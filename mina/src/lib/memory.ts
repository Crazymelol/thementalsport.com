// Mike's persistent, cross-channel memory. Server-side only.
//
// Backed by Upstash Redis (HTTP/REST — serverless-friendly). If the two env
// vars are absent, memoryConfigured() is false and callers degrade gracefully
// so the app keeps working without a store (same real-or-stub pattern as the
// Google/Gmail integrations).
//
// Data model: one Redis list `mike:memories`, newest-first. Each entry is a
// JSON {id, text, createdAt}. The most recent N are injected into every system
// prompt so Mike always "knows" his principal without spending a tool call.

import { Redis } from "@upstash/redis";

const MEMORY_KEY = "mike:memories";
const INJECT_LIMIT = 40;

export type Memory = {
  id: string;
  text: string;
  createdAt: string;
};

// The Vercel Upstash integration provisions KV_REST_API_URL / KV_REST_API_TOKEN.
// We also accept the native UPSTASH_REDIS_REST_* names as a fallback so the
// store works regardless of which naming scheme the environment uses.
function redisUrl(): string | undefined {
  return process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
}
function redisToken(): string | undefined {
  return process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
}

export function memoryConfigured(): boolean {
  return Boolean(redisUrl() && redisToken());
}

let _client: Redis | null = null;
function redis(): Redis {
  if (!_client) {
    _client = new Redis({
      url: redisUrl()!,
      token: redisToken()!,
    });
  }
  return _client;
}

function newId(): string {
  return "m_" + Math.random().toString(36).slice(2, 8);
}

/** Coerce a stored list entry (object or JSON string) into a Memory. */
function parseEntry(raw: unknown): Memory | null {
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
    return {
      id: typeof o.id === "string" ? o.id : newId(),
      text: String(o.text ?? ""),
      createdAt: typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString(),
    };
  }
  return null;
}

/** Save a durable fact. Newest entries come back first. */
export async function addMemory(text: string): Promise<Memory> {
  const mem: Memory = { id: newId(), text: text.trim(), createdAt: new Date().toISOString() };
  if (!memoryConfigured()) return mem;
  try {
    await redis().lpush(MEMORY_KEY, JSON.stringify(mem));
  } catch (e) {
    console.error("addMemory failed:", e);
  }
  return mem;
}

/** List memories, newest first. */
export async function listMemories(limit = INJECT_LIMIT): Promise<Memory[]> {
  if (!memoryConfigured()) return [];
  try {
    const raw = await redis().lrange(MEMORY_KEY, 0, limit - 1);
    return raw.map(parseEntry).filter((m): m is Memory => m !== null);
  } catch (e) {
    console.error("listMemories failed:", e);
    return [];
  }
}

/**
 * Score how well a memory's text matches a query. Higher = better; 0 = no match.
 * Pure function, exported for testing. Case-insensitive substring + term overlap.
 */
export function scoreMemory(text: string, query: string): number {
  const t = text.toLowerCase();
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  let score = 0;
  if (t.includes(q)) score += 10; // whole-phrase hit
  for (const term of q.split(/\s+/).filter((w) => w.length > 2)) {
    if (t.includes(term)) score += 1;
  }
  return score;
}

/** Search memories by keyword relevance. */
export async function searchMemories(query: string): Promise<Memory[]> {
  const all = await listMemories(200);
  return all
    .map((m) => ({ m, s: scoreMemory(m.text, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.m);
}

/** Delete a memory by id. */
export async function deleteMemory(id: string): Promise<{ deleted: boolean; text?: string }> {
  if (!memoryConfigured()) return { deleted: false };
  try {
    const all = await listMemories(1000);
    const target = all.find((m) => m.id === id);
    if (!target) return { deleted: false };
    const kept = all.filter((m) => m.id !== id);
    // Rewrite the list (small N): clear then re-push oldest-first to preserve order.
    await redis().del(MEMORY_KEY);
    for (let i = kept.length - 1; i >= 0; i--) {
      await redis().lpush(MEMORY_KEY, JSON.stringify(kept[i]));
    }
    return { deleted: true, text: target.text };
  } catch (e) {
    console.error("deleteMemory failed:", e);
    return { deleted: false };
  }
}

/** Format recent memories into a prompt-injectable block. "" when none. */
export async function memoryBlock(limit = INJECT_LIMIT): Promise<string> {
  const mems = await listMemories(limit);
  if (mems.length === 0) return "";
  const lines = mems.map((m) => `- ${m.text}`).join("\n");
  return (
    "\n\nWhat you know about your principal (your durable memory):\n" +
    lines +
    "\n(Use these naturally. If you learn a new durable fact or preference, call `remember`. Never store passwords, API keys, or tokens.)"
  );
}
