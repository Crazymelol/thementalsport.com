// Mike's persistent skill store. Server-side only.
// Mirrors lib/memory.ts — Upstash Redis list `mike:skills`.
// Each skill is a named instruction set injected into every system prompt.

import { Redis } from "@upstash/redis";

const SKILLS_KEY = "mike:skills";
const INJECT_LIMIT = 20;

export type Skill = {
  id: string;
  name: string;
  description: string; // one-line summary shown in sidebar
  content: string;     // full markdown instruction set
  createdAt: string;
};

function redisUrl(): string | undefined {
  return process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
}
function redisToken(): string | undefined {
  return process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
}

export function skillsConfigured(): boolean {
  return Boolean(redisUrl() && redisToken());
}

let _client: Redis | null = null;
function redis(): Redis {
  if (!_client) {
    _client = new Redis({ url: redisUrl()!, token: redisToken()! });
  }
  return _client;
}

function newId(): string {
  return "sk_" + Math.random().toString(36).slice(2, 8);
}

function parseEntry(raw: unknown): Skill | null {
  let obj: unknown = raw;
  if (typeof raw === "string") {
    try { obj = JSON.parse(raw); } catch { return null; }
  }
  if (obj && typeof obj === "object" && "content" in obj) {
    const o = obj as Record<string, unknown>;
    return {
      id: typeof o.id === "string" ? o.id : newId(),
      name: String(o.name ?? ""),
      description: String(o.description ?? ""),
      content: String(o.content ?? ""),
      createdAt: typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString(),
    };
  }
  return null;
}

export async function addSkill(
  name: string,
  description: string,
  content: string,
): Promise<Skill> {
  const skill: Skill = {
    id: newId(),
    name: name.trim(),
    description: description.trim(),
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };
  if (!skillsConfigured()) return skill;
  try {
    await redis().lpush(SKILLS_KEY, JSON.stringify(skill));
  } catch (e) {
    console.error("addSkill failed:", e);
  }
  return skill;
}

export async function listSkills(limit = INJECT_LIMIT): Promise<Skill[]> {
  if (!skillsConfigured()) return [];
  try {
    const raw = await redis().lrange(SKILLS_KEY, 0, limit - 1);
    return raw.map(parseEntry).filter((s): s is Skill => s !== null);
  } catch (e) {
    console.error("listSkills failed:", e);
    return [];
  }
}

export async function deleteSkill(id: string): Promise<{ deleted: boolean; name?: string }> {
  if (!skillsConfigured()) return { deleted: false };
  try {
    const all = await listSkills(1000);
    const target = all.find((s) => s.id === id);
    if (!target) return { deleted: false };
    const kept = all.filter((s) => s.id !== id);
    await redis().del(SKILLS_KEY);
    for (let i = kept.length - 1; i >= 0; i--) {
      await redis().lpush(SKILLS_KEY, JSON.stringify(kept[i]));
    }
    return { deleted: true, name: target.name };
  } catch (e) {
    console.error("deleteSkill failed:", e);
    return { deleted: false };
  }
}

/** Format all skills into a prompt-injectable block. "" when none. */
export async function skillsBlock(): Promise<string> {
  const skills = await listSkills();
  if (skills.length === 0) return "";
  const lines = skills
    .map((s) => `### ${s.name}\n${s.content}`)
    .join("\n\n");
  return (
    "\n\n# Your Skills (apply these automatically whenever relevant):\n\n" +
    lines +
    "\n\n(These are your learned skills. Apply them whenever the situation calls for it.)"
  );
}
