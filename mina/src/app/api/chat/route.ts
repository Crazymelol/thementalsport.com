// Mina's brain. Server-side only — the Anthropic SDK and your API key never
// reach the browser.
//
// This implements a MANUAL tool-use loop (not the auto tool runner) on
// purpose: the PRD's safety model requires a human-in-the-loop approval gate
// before any write action, and the manual loop is where we insert it.
//
//   • read-tier tools  -> executed automatically, loop continues
//   • write-tier tools -> NOT executed; we stream an `action_required` event
//                         and stop. The client shows approval cards; on the
//                         user's decision it re-POSTs with `decisions`, and we
//                         resume — executing only what was approved.

import Anthropic from "@anthropic-ai/sdk";
import { MINA_SYSTEM_PROMPT } from "@/lib/systemPrompt";
import { toolDefsForApi, getTool, isWrite } from "@/lib/tools";
import type { ChatRequest, ServerEvent, ActionProposal } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = "claude-opus-4-8";
const MAX_TOKENS = 16000;
const MAX_LOOPS = 6; // safety stop for the read-tool auto-loop

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

      let client: Anthropic;
      try {
        client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment
      } catch {
        send({
          type: "error",
          message:
            "Mina has no API key yet. Add ANTHROPIC_API_KEY to .env.local (see .env.example) and restart.",
        });
        send({ type: "done" });
        controller.close();
        return;
      }

      // Work on a local copy of the conversation in Anthropic message shape.
      const messages = body.messages as unknown as Anthropic.MessageParam[];
      const tools = toolDefsForApi() as unknown as Anthropic.Tool[];

      try {
        // --- Phase 0: resolve any pending write decisions from the user ----
        if (body.decisions) {
          const last = messages[messages.length - 1];
          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          if (last && last.role === "assistant" && Array.isArray(last.content)) {
            for (const block of last.content) {
              if (block.type !== "tool_use") continue;
              const tool = getTool(block.name);
              const input = (block.input ?? {}) as Record<string, unknown>;
              let content: string;
              if (isWrite(block.name)) {
                const approved = body.decisions[block.id] === true;
                content = approved
                  ? (tool?.run(input) ?? "Done.")
                  : "The user declined this action. Do not retry it; ask what they'd like instead.";
              } else {
                content = tool?.run(input) ?? "Unknown tool.";
              }
              toolResults.push({ type: "tool_result", tool_use_id: block.id, content });
            }
          }
          if (toolResults.length > 0) {
            const turn: Anthropic.MessageParam = { role: "user", content: toolResults };
            messages.push(turn);
            send({ type: "tool_result", content: toolResults as never });
          }
        }

        // --- Main loop: stream a turn, run read tools, repeat -------------
        for (let i = 0; i < MAX_LOOPS; i++) {
          const ms = client.messages.stream({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            thinking: { type: "disabled" },
            system: [
              {
                type: "text",
                text: MINA_SYSTEM_PROMPT,
                cache_control: { type: "ephemeral" }, // cache tools + system prefix
              },
            ],
            tools,
            messages,
          });

          for await (const event of ms) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              send({ type: "delta", text: event.delta.text });
            }
          }

          const final = await ms.finalMessage();
          send({ type: "assistant", content: final.content as never });
          messages.push({ role: "assistant", content: final.content });

          const toolUses = final.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
          );
          if (toolUses.length === 0) {
            send({ type: "done" });
            break;
          }

          const writeUses = toolUses.filter((b) => isWrite(b.name));
          if (writeUses.length > 0) {
            // Stop and ask the user. Any read tools in this same turn will be
            // executed alongside the writes when the user responds.
            const actions: ActionProposal[] = writeUses.map((b) => {
              const tool = getTool(b.name);
              const s = tool?.summarize?.((b.input ?? {}) as Record<string, unknown>);
              return {
                id: b.id,
                name: b.name,
                tier: "write",
                title: s?.title ?? b.name,
                detail: s?.detail ?? JSON.stringify(b.input, null, 2),
              };
            });
            send({ type: "action_required", actions });
            send({ type: "done" });
            break;
          }

          // All read-only: execute now and loop without a client round-trip.
          const toolResults: Anthropic.ToolResultBlockParam[] = toolUses.map((b) => ({
            type: "tool_result",
            tool_use_id: b.id,
            content: getTool(b.name)?.run((b.input ?? {}) as Record<string, unknown>) ?? "Unknown tool.",
          }));
          messages.push({ role: "user", content: toolResults });
          send({ type: "tool_result", content: toolResults as never });

          if (i === MAX_LOOPS - 1) send({ type: "done" });
        }
      } catch (err) {
        const message =
          err instanceof Anthropic.APIError
            ? `Anthropic API error (${err.status}): ${err.message}`
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
