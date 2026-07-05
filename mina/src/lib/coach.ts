// The public AI coach: a small, isolated think-act loop for the training app.
//
// Deliberately NOT built on runBrain(): the operator brain wires in the Mike
// persona, the router, global memory, skills and self-improvement tools. A
// public endpoint must never be able to reach any of that, so the coach has
// its own loop whose tool table is closed over here — the isolation is
// structural, not a filter. It reuses only the stateless plumbing: the
// provider council, health tracking, and the stream idle-timeout guard.
import OpenAI from "openai";
import { getProviders } from "./providers";
import { sortedByHealth, recordSuccess, recordFailure, healthReport } from "./healthTracker";
import { withIdleTimeout } from "./brain";
import { addMemoryAt, searchMemoriesAt, listMemoriesAt, deleteMemoryAt } from "./memory";
import { getDayLesson, searchProtocols, TOTAL_DAYS } from "./coachContent";
import type { ApiMessage, ToolCall } from "./types";

const MAX_TOKENS = 1024;
const MAX_LOOPS = 4;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const coachMemKey = (deviceId: string) => `coach:mem:${deviceId}`;

export const COACH_SYSTEM_PROMPT = `You are the Mental Sport Coach — a mental-performance coach for athletes,
built on Giannis Notaras's 48-day Titans Protocol and course material.

# Who you are
- Direct, warm, athlete-first. You talk like a coach at the side of the track:
  short sentences, concrete instructions, zero fluff.
- You coach the mental game: pressure, nerves, focus, confidence, routines,
  recovery from mistakes. You believe these are trainable skills.

# Ground your coaching in the material
- You have tools to look up the athlete's current day lesson and to search the
  48-day protocol library. When a question maps to a protocol, USE the tools
  and teach that protocol by name (e.g. "Day 1's Fear-is-Fuel reframe").
- Prefer one specific protocol with exact steps over general advice.
- If the material has nothing relevant, say so and give brief, sensible
  mental-performance guidance — never invent fake protocols or fake science.

# Boundaries — non-negotiable
- You are a performance coach, not a therapist or doctor. You do NOT give
  medical, clinical, psychiatric, medication, diet, or injury advice.
- If the athlete mentions self-harm, abuse, an eating disorder, depression, or
  anything beyond performance coaching: respond with warmth, say clearly this
  needs a professional (doctor, therapist, or a trusted adult for minors) and
  encourage them to reach out today. Do not coach past it.
- Minors: keep everything you say appropriate for a young athlete.

# Memory
- Durable facts about this athlete (sport, position, goals, struggles) are
  provided under "What you know about this athlete". Use them naturally.
- When you learn such a fact, call remember. Never store secrets.

# Style
- 2-5 sentences per reply unless walking through a protocol's steps.
- End protocol walk-throughs with ONE clear action for today.
- Plain text only — no markdown headings or bullet symbols.`;

// Same ToolDef shape as tools.ts, minus tier/summarize (everything here is read-only).
type CoachTool = {
  name: string;
  description: string;
  input_schema: { type: "object"; properties: Record<string, unknown>; required?: string[] };
  run: (input: Record<string, unknown>) => string | Promise<string>;
};

const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const num = (v: unknown, fallback = 0) => (typeof v === "number" ? v : fallback);

export function coachTools(deviceId: string): CoachTool[] {
  const memKey = coachMemKey(deviceId);
  return [
    {
      name: "get_day_lesson",
      description: `Fetch one day's lesson from the 48-day program (1..${TOTAL_DAYS}): title, description and full text.`,
      input_schema: { type: "object", properties: { day: { type: "number", description: "Day number 1-48" } }, required: ["day"] },
      run: (input) => {
        const d = getDayLesson(num(input.day));
        return d ? JSON.stringify(d) : JSON.stringify({ error: `No such day; valid range is 1-${TOTAL_DAYS}.` });
      },
    },
    {
      name: "search_protocols",
      description: "Search the 48-day protocol library by topic (e.g. 'pre-game nerves', 'choking', 'confidence'). Returns the top 3 lessons with excerpts.",
      input_schema: { type: "object", properties: { query: { type: "string", description: "What the athlete is struggling with" } }, required: ["query"] },
      run: (input) => JSON.stringify(searchProtocols(str(input.query))),
    },
    {
      name: "remember",
      description: "Save a durable fact about this athlete (their sport, goals, recurring struggles).",
      input_schema: { type: "object", properties: { fact: { type: "string" } }, required: ["fact"] },
      run: async (input) => JSON.stringify(await addMemoryAt(memKey, str(input.fact))),
    },
    {
      name: "recall",
      description: "Search saved facts about this athlete.",
      input_schema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
      run: async (input) => JSON.stringify(await searchMemoriesAt(memKey, str(input.query))),
    },
    {
      name: "forget",
      description: "Delete a saved fact by its id (use recall first to find the id).",
      input_schema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
      run: async (input) => JSON.stringify(await deleteMemoryAt(memKey, str(input.id))),
    },
  ];
}

export function checkCoachAuth(headers: Headers):
  | { ok: true; deviceId: string }
  | { ok: false; status: number; message: string } {
  if (!process.env.COACH_APP_TOKEN) return { ok: false, status: 503, message: "Coach not configured." };
  if (headers.get("x-app-token") !== process.env.COACH_APP_TOKEN) return { ok: false, status: 401, message: "Bad app token." };
  const deviceId = headers.get("x-device-id") ?? "";
  if (!UUID_RE.test(deviceId)) return { ok: false, status: 400, message: "Missing or invalid x-device-id." };
  return { ok: true, deviceId };
}

export type CoachResult = { text: string; error?: string };

export async function runCoach(opts: { messages: ApiMessage[]; deviceId: string }): Promise<CoachResult> {
  const providers = getProviders();
  if (providers.length === 0) return { text: "", error: "No AI provider configured." };

  const tools = coachTools(opts.deviceId);
  const toolDefs = tools.map((t) => ({
    type: "function" as const,
    function: { name: t.name, description: t.description, parameters: t.input_schema },
  }));
  const byName = new Map(tools.map((t) => [t.name, t]));

  const mems = await listMemoriesAt(coachMemKey(opts.deviceId), 20);
  const memBlock = mems.length
    ? `\n\n# What you know about this athlete\n${mems.map((m) => `- ${m.text}`).join("\n")}`
    : "";

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: COACH_SYSTEM_PROMPT + memBlock + `\n\nCurrent date: ${new Date().toDateString()}.` },
    ...(opts.messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[]),
  ];

  let text = "";
  try {
    for (let i = 0; i < MAX_LOOPS; i++) {
      let turnText = "";
      let acc = new Map<number, { id: string; name: string; args: string }>();
      let lastErr: unknown;
      let okProvider: string | null = null;

      for (const p of sortedByHealth(providers)) {
        try {
          const completion = await Promise.race([
            p.client.chat.completions.create({
              model: p.model, max_tokens: MAX_TOKENS, tools: toolDefs, messages, stream: true,
            } as OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${p.name} open timeout`)), 12_000)),
          ]);
          turnText = "";
          acc = new Map();
          for await (const chunk of withIdleTimeout(completion)) {
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
          okProvider = p.name;
          recordSuccess(p.name);
          break;
        } catch (err) {
          recordFailure(p.name);
          lastErr = err;
        }
      }
      if (!okProvider) throw lastErr ?? new Error(`All providers failed. ${healthReport()}`);

      text += turnText;
      const toolCalls: ToolCall[] = [...acc.values()].filter((s) => s.name).map((s) => ({
        id: s.id || `call_${Math.random().toString(36).slice(2)}`,
        type: "function" as const,
        function: { name: s.name, arguments: s.args || "{}" },
      }));
      messages.push({ role: "assistant", content: turnText || null, ...(toolCalls.length ? { tool_calls: toolCalls } : {}) });
      if (toolCalls.length === 0) break;

      for (const c of toolCalls) {
        const tool = byName.get(c.function.name);
        let input: Record<string, unknown> = {};
        try { input = JSON.parse(c.function.arguments || "{}"); } catch {}
        const content = tool ? await tool.run(input) : "Unknown tool.";
        messages.push({ role: "tool", tool_call_id: c.id, content });
      }
    }
    return { text };
  } catch (err) {
    return { text, error: err instanceof Error ? err.message : "Something went wrong." };
  }
}
