// Mina's brain. Server-side only — the API key never reaches the browser.
//
// Runs on Groq via its OpenAI-compatible chat API (fast + free tier). The
// safety model is unchanged from the original design:
//
//   • read-tier tools  -> executed automatically, loop continues
//   • write-tier tools -> NOT executed; we stream an `action_required` event
//                         and stop. The client shows approval cards; on the
//                         user's decision it re-POSTs with `decisions`, and we
//                         resume — executing only what was approved.

import OpenAI from "openai";
import { MINA_SYSTEM_PROMPT } from "@/lib/systemPrompt";
import { toolDefsForApi, getTool, isWrite } from "@/lib/tools";
import type { ChatRequest, ServerEvent, ActionProposal, ToolCall, ApiMessage } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GPT-OSS follows the OpenAI tool-calling format natively. It's a reasoning
// model, so we set reasoning_format: "hidden" (below) to keep its internal
// notes out of the spoken reply.
const MODEL = "openai/gpt-oss-120b";
const MAX_TOKENS = 4096;
const MAX_LOOPS = 6;

const parseArgs = (raw: string): Record<string, unknown> => {
  try {
    return JSON.parse(raw || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
};

export async function POST(req: Request) {
  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ServerEvent) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));

      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        send({
          type: "error",
          message:
            "Mina has no API key yet. Add GROQ_API_KEY to .env.local and restart.",
        });
        send({ type: "done" });
        controller.close();
        return;
      }

      const client = new OpenAI({
        apiKey,
        baseURL: "https://api.groq.com/openai/v1",
      });

      // Conversation in OpenAI message shape, with Mina's system prompt pinned first.
      const nowLine = `\n\nCurrent date and time: ${new Date().toString()}.`;
      const messages = [
        { role: "system" as const, content: MINA_SYSTEM_PROMPT + nowLine },
        ...body.messages,
      ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[];

      const tools = toolDefsForApi() as OpenAI.Chat.Completions.ChatCompletionTool[];

      try {
        // --- Phase 0: resolve any pending write decisions from the user ----
        if (body.decisions) {
          const last = body.messages[body.messages.length - 1];
          const toolMsgs: ApiMessage[] = [];
          if (last && last.role === "assistant" && last.tool_calls) {
            for (const tc of last.tool_calls) {
              const tool = getTool(tc.function.name);
              const input = parseArgs(tc.function.arguments);
              let content: string;
              if (isWrite(tc.function.name)) {
                const approved = body.decisions[tc.id] === true;
                content = approved
                  ? ((await tool?.run(input)) ?? "Done.")
                  : "The user declined this action. Do not retry it; ask what they'd like instead.";
                if (approved && tool) {
                  try {
                    send({ type: "tool_card", toolName: tc.function.name, data: JSON.parse(content) });
                  } catch {}
                }
              } else {
                content = (await tool?.run(input)) ?? "Unknown tool.";
                try {
                  send({ type: "tool_card", toolName: tc.function.name, data: JSON.parse(content) });
                } catch {}
              }
              toolMsgs.push({ role: "tool", tool_call_id: tc.id, content });
            }
          }
          if (toolMsgs.length > 0) {
            for (const m of toolMsgs) messages.push(m as OpenAI.Chat.Completions.ChatCompletionMessageParam);
            send({ type: "tool_result", messages: toolMsgs });
          }
        }

        // --- Main loop: stream a turn, run read tools, repeat -------------
        for (let i = 0; i < MAX_LOOPS; i++) {
          const completion = await client.chat.completions.create({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            tools,
            messages,
            stream: true,
            // Groq-specific: keep GPT-OSS's internal reasoning out of `content`.
            reasoning_format: "hidden",
          } as OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming);

          let text = "";
          // Accumulate streamed tool calls by index.
          const acc = new Map<number, { id: string; name: string; args: string }>();

          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta;
            if (!delta) continue;
            if (delta.content) {
              text += delta.content;
              send({ type: "delta", text: delta.content });
            }
            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                const slot = acc.get(tc.index) ?? { id: "", name: "", args: "" };
                if (tc.id) slot.id = tc.id;
                if (tc.function?.name) slot.name = tc.function.name;
                if (tc.function?.arguments) slot.args += tc.function.arguments;
                acc.set(tc.index, slot);
              }
            }
          }

          const toolCalls: ToolCall[] = [...acc.values()]
            .filter((s) => s.name)
            .map((s) => ({
              id: s.id || `call_${Math.random().toString(36).slice(2)}`,
              type: "function",
              function: { name: s.name, arguments: s.args || "{}" },
            }));

          const assistantMsg: ApiMessage = {
            role: "assistant",
            content: text || null,
            ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
          };
          send({ type: "assistant", message: assistantMsg });
          messages.push(assistantMsg as OpenAI.Chat.Completions.ChatCompletionMessageParam);

          if (toolCalls.length === 0) {
            send({ type: "done" });
            break;
          }

          const writeCalls = toolCalls.filter((c) => isWrite(c.function.name));
          if (writeCalls.length > 0) {
            const actions: ActionProposal[] = writeCalls.map((c) => {
              const tool = getTool(c.function.name);
              const s = tool?.summarize?.(parseArgs(c.function.arguments));
              return {
                id: c.id,
                name: c.function.name,
                tier: "write",
                title: s?.title ?? c.function.name,
                detail: s?.detail ?? c.function.arguments,
              };
            });
            send({ type: "action_required", actions });
            send({ type: "done" });
            break;
          }

          // All read-only: execute now, emit cards, loop.
          const toolMsgs: ApiMessage[] = await Promise.all(
            toolCalls.map(async (c): Promise<ApiMessage> => {
              const tool = getTool(c.function.name);
              const content = (await tool?.run(parseArgs(c.function.arguments))) ?? "Unknown tool.";
              try {
                send({ type: "tool_card", toolName: c.function.name, data: JSON.parse(content) });
              } catch {}
              return { role: "tool", tool_call_id: c.id, content };
            }),
          );
          for (const m of toolMsgs) messages.push(m as OpenAI.Chat.Completions.ChatCompletionMessageParam);
          send({ type: "tool_result", messages: toolMsgs });

          if (i === MAX_LOOPS - 1) send({ type: "done" });
        }
      } catch (err) {
        const message =
          err instanceof OpenAI.APIError
            ? `Brain error (${err.status}): ${err.message}`
            : err instanceof Error
              ? err.message
              : "Something went wrong talking to Mina's brain.";
        send({ type: "error", message });
        send({ type: "done" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
