import OpenAI from "openai";
import type { AgentId, ApiMessage } from "./types";

// A small, fast, non-reasoning model — classification is trivial and must be
// quick. The heavy reasoning model (gpt-oss-120b) is reserved for the agents
// themselves; using it here added seconds of latency per request.
const MODEL = "llama-3.1-8b-instant";
// Hard ceiling so the router can NEVER stall a request. If routing doesn't
// resolve in time we fall back to "general" — correctness over cleverness.
const ROUTE_TIMEOUT_MS = 4000;
const VALID_IDS = new Set<AgentId>(["inbox", "calendar", "workspace", "finance", "general"]);

const ROUTER_SYSTEM = `You are a request classifier for a personal AI assistant.
Classify the user's request into exactly ONE of these agent ids and reply with only that id — no other text:
  inbox      — email: reading, searching, sending, drafting messages
  calendar   — scheduling: events, meetings, availability, calendar
  workspace  — files: Google Drive, Docs, Sheets, Contacts
  finance    — money: revenue, Stripe, refunds, invoices
  general    — everything else: web browsing, general questions, chit-chat`;

/** Pure: build the messages array for the router call (unit-testable, no I/O). */
export function buildRouterMessages(
  messages: ApiMessage[],
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  return [
    { role: "system", content: ROUTER_SYSTEM },
    { role: "user", content: lastUser ? String(lastUser.content) : "" },
  ];
}

/** Call Groq to classify intent. Falls back to "general" on any error or timeout. */
export async function route(messages: ApiMessage[]): Promise<AgentId> {
  if (!process.env.GROQ_API_KEY) return "general";
  try {
    const client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
      // Don't let the SDK silently retry-with-backoff — that's what turns a slow
      // classifier call into a multi-second stall and, ultimately, a 504.
      maxRetries: 0,
      timeout: ROUTE_TIMEOUT_MS,
    });
    const call = client.chat.completions.create({
      model: MODEL,
      max_tokens: 10,
      messages: buildRouterMessages(messages),
    });
    // Belt-and-suspenders: even if the SDK timeout misbehaves, this race
    // guarantees route() resolves within the ceiling.
    const res = await Promise.race([
      call,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), ROUTE_TIMEOUT_MS)),
    ]);
    if (!res) return "general";
    const raw = (res.choices[0]?.message?.content ?? "").trim().toLowerCase() as AgentId;
    return VALID_IDS.has(raw) ? raw : "general";
  } catch {
    return "general";
  }
}
