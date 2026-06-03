// Mike's self-improving prompt layer. Server-side only.
//
// Mirrors lib/memory.ts: an Upstash Redis list `mike:prompt_addenda` of learned
// instruction addenda. Each addendum is APPENDED after the immutable base system
// prompt at the hub, so Mike can add guidance but never override its safety rules.
// Every mutation flows through the write-approval gate via the tools in tools.ts.

import { Redis } from "@upstash/redis";
import type { AgentId } from "./types";

const ADDENDA_KEY = "mike:prompt_addenda";
export const MAX_ADDENDA = 20;

export type AddendumTarget = "global" | AgentId;

export type PromptAddendum = {
  id: string;
  target: AddendumTarget;
  text: string;
  rationale: string;
  enabled: boolean;
  createdAt: string;
};

const VALID_TARGETS = new Set<AddendumTarget>([
  "global",
  "inbox",
  "calendar",
  "workspace",
  "finance",
  "general",
]);

export function isValidTarget(t: string): t is AddendumTarget {
  return VALID_TARGETS.has(t as AddendumTarget);
}

function redisUrl(): string | undefined {
  return process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
}
function redisToken(): string | undefined {
  return process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
}
export function promptStoreConfigured(): boolean {
  return Boolean(redisUrl() && redisToken());
}

let _client: Redis | null = null;
function redis(): Redis {
  if (!_client) _client = new Redis({ url: redisUrl()!, token: redisToken()! });
  return _client;
}

function newId(): string {
  return "p_" + Math.random().toString(36).slice(2, 8);
}

/** Coerce a stored entry (object or JSON string) into a PromptAddendum. Pure. */
export function parseEntry(raw: unknown): PromptAddendum | null {
  let obj: unknown = raw;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (obj && typeof obj === "object" && "text" in obj) {
    const o = obj as Record<string, unknown>;
    const target =
      typeof o.target === "string" && isValidTarget(o.target)
        ? (o.target as AddendumTarget)
        : "global";
    return {
      id: typeof o.id === "string" ? o.id : newId(),
      target,
      text: String(o.text ?? ""),
      rationale: String(o.rationale ?? ""),
      enabled: o.enabled !== false,
      createdAt: typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString(),
    };
  }
  return null;
}

/** Pure: enabled addenda that apply to this agent (global + matching agent). */
export function activeForAgent(all: PromptAddendum[], agentId: AgentId): PromptAddendum[] {
  return all.filter((a) => a.enabled && (a.target === "global" || a.target === agentId));
}

/** Pure: render the active addenda into a prompt-injectable block. "" when none. */
export function renderAddenda(all: PromptAddendum[], agentId: AgentId): string {
  const active = activeForAgent(all, agentId);
  if (active.length === 0) return "";
  const lines = active.map((a) => `- ${a.text}`).join("\n");
  return "\n\nRefinements you've learned (approved by your principal):\n" + lines;
}

/** All stored addenda, newest first. */
export async function listAddenda(): Promise<PromptAddendum[]> {
  if (!promptStoreConfigured()) return [];
  try {
    const raw = await redis().lrange(ADDENDA_KEY, 0, -1);
    return raw.map(parseEntry).filter((a): a is PromptAddendum => a !== null);
  } catch (e) {
    console.error("listAddenda failed:", e);
    return [];
  }
}

/** Append a new (enabled) addendum, enforcing the MAX_ADDENDA cap. */
export async function addAddendum(
  target: AddendumTarget,
  text: string,
  rationale: string,
): Promise<{ added: boolean; addendum?: PromptAddendum; error?: string }> {
  const rec: PromptAddendum = {
    id: newId(),
    target,
    text: text.trim(),
    rationale: rationale.trim(),
    enabled: true,
    createdAt: new Date().toISOString(),
  };
  if (!promptStoreConfigured()) return { added: true, addendum: rec };
  try {
    const existing = await listAddenda();
    if (existing.length >= MAX_ADDENDA) {
      return { added: false, error: `At capacity (${MAX_ADDENDA}). Revert one before adding more.` };
    }
    await redis().lpush(ADDENDA_KEY, JSON.stringify(rec));
    return { added: true, addendum: rec };
  } catch (e) {
    console.error("addAddendum failed:", e);
    return { added: false, error: "Store error." };
  }
}

/** Rewrite the whole list (small N) preserving order. */
async function rewrite(items: PromptAddendum[]): Promise<void> {
  await redis().del(ADDENDA_KEY);
  for (let i = items.length - 1; i >= 0; i--) {
    await redis().lpush(ADDENDA_KEY, JSON.stringify(items[i]));
  }
}

/** Flip an addendum's enabled flag without deleting it. */
export async function setEnabled(
  id: string,
  enabled: boolean,
): Promise<{ ok: boolean; addendum?: PromptAddendum }> {
  if (!promptStoreConfigured()) return { ok: false };
  try {
    const all = await listAddenda();
    const target = all.find((a) => a.id === id);
    if (!target) return { ok: false };
    target.enabled = enabled;
    await rewrite(all);
    return { ok: true, addendum: target };
  } catch (e) {
    console.error("setEnabled failed:", e);
    return { ok: false };
  }
}

/** Delete an addendum by id (revert). */
export async function removeAddendum(id: string): Promise<{ removed: boolean; text?: string }> {
  if (!promptStoreConfigured()) return { removed: false };
  try {
    const all = await listAddenda();
    const target = all.find((a) => a.id === id);
    if (!target) return { removed: false };
    await rewrite(all.filter((a) => a.id !== id));
    return { removed: true, text: target.text };
  } catch (e) {
    console.error("removeAddendum failed:", e);
    return { removed: false };
  }
}

/** Async: enabled addenda for an agent, rendered for the system prompt. */
export async function addendaBlock(agentId: AgentId): Promise<string> {
  return renderAddenda(await listAddenda(), agentId);
}
