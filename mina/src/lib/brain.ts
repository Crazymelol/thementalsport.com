// Mike's core think-and-act loop, shared by every channel (web, Slack, …).
//
// Orchestrator flow (Phase 3):
//   1. route(messages)       — one Groq call to pick the specialist agent
//   2. toolsForAgent(id)     — scoped tool list for that agent only
//   3. agent.promptAddon     — focused instruction appended to system prompt
//   4. existing think-loop   — unchanged: reads auto-run, writes → pendingActions
//   5. getAgentForTool()     — on approval re-run, recover agent from tool name
//
// runBrain() signature is unchanged — all callers (web, Slack) need no edits.

import OpenAI from "openai";
import { MINA_SYSTEM_PROMPT } from "./systemPrompt";
import { memoryBlock } from "./memory";
import { getTool, isWrite } from "./tools";
import { route } from "./router";
import { toolsForAgent, getAgentForTool, AGENTS } from "./agents";
import type { ApiMessage, ActionProposal, ToolCall, AgentId } from "./types";

const MAX_TOKENS = 4096;
const MAX_LOOPS = 6;

const parseArgs = (raw: string): Record<string, unknown> => {
  try {
    return JSON.parse(raw || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
};

export type ToolCard = { toolName: string; data: unknown };

export type BrainResult = {
  /** Streamed text chunks joined — the final reply text. */
  text: string;
  /** Tool result cards to display (read tools + approved writes). */
  cards: ToolCard[];
  /** Set when the loop hit a write tool and needs user approval. */
  pendingActions?: ActionProposal[];
  /** The full message history (input + new turns) — pass back next request. */
  messages: ApiMessage[];
  /** Which specialist handled this turn (for display + approval resumption). */
  agent?: AgentId;
  error?: string;
};

function groqClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY!,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

export async function runBrain(opts: {
  /** Conversation so far (no system prompt — we prepend it). */
  messages: ApiMessage[];
  /** Approved/rejected write decisions from a previous turn. */
  decisions?: Record<string, boolean>;
}): Promise<BrainResult> {
  const cards: ToolCard[] = [];
  let text = "";

  if (!process.env.GROQ_API_KEY) {
    return { text: "", cards, error: "No GROQ_API_KEY configured.", messages: opts.messages };
  }

  const client = groqClient();
  const nowLine = `\n\nCurrent date and time: ${new Date().toString()}.`;
  const memBlock = await memoryBlock();

  // Determine which agent to use.
  // On an approval re-run, recover agent from the pending tool name (stateless).
  // On a fresh turn, ask the router.
  let agentId: AgentId;
  if (opts.decisions) {
    const last = opts.messages[opts.messages.length - 1];
    const firstToolName =
      last?.role === "assistant" && "tool_calls" in last && last.tool_calls
        ? (last.tool_calls as ToolCall[])[0]?.function.name
        : undefined;
    agentId = firstToolName ? getAgentForTool(firstToolName) : "general";
  } else {
    agentId = await route(opts.messages);
  }

  const agent = AGENTS[agentId];
  const tools = toolsForAgent(agentId);

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: MINA_SYSTEM_PROMPT + nowLine + memBlock + agent.promptAddon,
    },
    ...(opts.messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[]),
  ];

  try {
    // Phase 0: resolve pending write decisions from a previous turn.
    if (opts.decisions) {
      const last = opts.messages[opts.messages.length - 1];
      const toolMsgs: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
      if (last && last.role === "assistant" && "tool_calls" in last && last.tool_calls) {
        for (const tc of last.tool_calls as ToolCall[]) {
          const tool = getTool(tc.function.name);
          const input = parseArgs(tc.function.arguments);
          let content: string;
          if (isWrite(tc.function.name)) {
            const approved = opts.decisions[tc.id] === true;
            content = approved
              ? ((await tool?.run(input)) ?? "Done.")
              : "The user declined this action. Do not retry it; ask what they'd like instead.";
            if (approved && tool) {
              try { cards.push({ toolName: tc.function.name, data: JSON.parse(content) }); } catch {}
            }
          } else {
            content = (await tool?.run(input)) ?? "Unknown tool.";
            try { cards.push({ toolName: tc.function.name, data: JSON.parse(content) }); } catch {}
          }
          toolMsgs.push({ role: "tool", tool_call_id: tc.id, content });
        }
      }
      for (const m of toolMsgs) messages.push(m);
    }

    // Main loop: call model, run read tools, repeat.
    for (let i = 0; i < MAX_LOOPS; i++) {
      const completion = await client.chat.completions.create({
        model: "openai/gpt-oss-120b",
        max_tokens: MAX_TOKENS,
        tools,
        messages,
        stream: true,
        reasoning_format: "hidden",
      } as OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming);

      let turnText = "";
      const acc = new Map<number, { id: string; name: string; args: string }>();

      for await (const chunk of completion) {
        const delta = chunk.choices[0]?.delta;
        if (!delta) continue;
        if (delta.content) turnText += delta.content;
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

      text += turnText;

      const toolCalls: ToolCall[] = [...acc.values()]
        .filter((s) => s.name)
        .map((s) => ({
          id: s.id || `call_${Math.random().toString(36).slice(2)}`,
          type: "function" as const,
          function: { name: s.name, arguments: s.args || "{}" },
        }));

      const assistantMsg: OpenAI.Chat.Completions.ChatCompletionMessageParam = {
        role: "assistant",
        content: turnText || null,
        ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
      };
      messages.push(assistantMsg);

      if (toolCalls.length === 0) break;

      const writeCalls = toolCalls.filter((c) => isWrite(c.function.name));
      if (writeCalls.length > 0) {
        const pendingActions: ActionProposal[] = writeCalls.map((c) => {
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
        return {
          text,
          cards,
          pendingActions,
          agent: agentId,
          messages: messages.slice(1) as ApiMessage[],
        };
      }

      // All reads: execute, collect cards, loop.
      const toolMsgs = await Promise.all(
        toolCalls.map(async (c) => {
          const tool = getTool(c.function.name);
          const content = (await tool?.run(parseArgs(c.function.arguments))) ?? "Unknown tool.";
          try { cards.push({ toolName: c.function.name, data: JSON.parse(content) }); } catch {}
          return { role: "tool" as const, tool_call_id: c.id, content };
        }),
      );
      for (const m of toolMsgs) messages.push(m);
    }

    return { text, cards, agent: agentId, messages: messages.slice(1) as ApiMessage[] };
  } catch (err) {
    const error =
      err instanceof OpenAI.APIError
        ? `Brain error (${err.status}): ${err.message}`
        : err instanceof Error
          ? err.message
          : "Something went wrong.";
    return { text, cards, error, messages: opts.messages };
  }
}
