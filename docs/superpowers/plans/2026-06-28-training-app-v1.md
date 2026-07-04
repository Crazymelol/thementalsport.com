# Training App v1 (48-Day Program + AI Coach) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An Expo/React Native Android app delivering the 48-day Titans Protocol as a daily-unlock program with breathing tools, on-device streaks, a daily reminder, and an AI coach chat served by a new isolated `/api/coach` endpoint in the existing `mina/` backend.

**Architecture:** Build-time script turns the 48 `titans-protocol-day-*.md` articles into one bundled JSON (two committed copies: app bundle + `mina/src/data/`). The coach is a small dedicated loop (`mina/src/lib/coach.ts`) reusing the provider council + health tracker but with its own persona and a closed allowlist of read-only tools (day lesson, protocol search, namespaced memory) — it never touches `router.ts`, `agents.ts`, or operator tools. The app keeps all state in AsyncStorage; notifications are local.

**Tech Stack:** Expo SDK (managed, TypeScript, expo-router tabs), jest-expo; Next.js/Vercel (`mina/`), vitest, Upstash Redis; gray-matter for content parsing.

**Spec:** `docs/superpowers/specs/2026-06-28-training-app-v1-design.md`

**Deviation from spec (deliberate):** the content JSON omits `generatedAt` so output is deterministic (clean git diffs, `--check` mode trivially exact). Everything else follows the spec.

---

## Phase A — Scaffold + content pipeline

### Task 1: Scaffold the Expo app

**Files:**
- Create: `app/` (via create-expo-app, expo-router "default" template)

- [ ] **Step 1: Generate the project**

```bash
cd /home/user/thementalsport.com
npx create-expo-app@latest app --template default
rm -rf app/.git   # must stay part of the monorepo, not a nested repo
```
Expected: `app/package.json` exists; `app/app/(tabs)/` contains the template tabs.

- [ ] **Step 2: Reset template screens to a clean slate**

```bash
cd /home/user/thementalsport.com/app
npm run reset-project -- --no-example 2>/dev/null || node scripts/reset-project.js || true
ls app/
```
If the template has no reset script, manually delete example content in Task 12 instead. Non-fatal either way.

- [ ] **Step 3: Install runtime deps**

```bash
cd /home/user/thementalsport.com/app
npx expo install @react-native-async-storage/async-storage expo-notifications expo-crypto expo-haptics
npm install react-native-markdown-display
```

- [ ] **Step 4: Install and configure jest**

```bash
cd /home/user/thementalsport.com/app
npx expo install jest-expo jest @types/jest --dev
```
Add to `app/package.json`:
```json
"scripts": { "test": "jest" },
"jest": { "preset": "jest-expo", "testMatch": ["**/__tests__/**/*.test.ts"] }
```

- [ ] **Step 5: App identity in `app/app.json`**

Set inside `expo`:
```json
"name": "The Mental Sport",
"slug": "the-mental-sport",
"android": { "package": "com.thementalsport.app" }
```
(Keep all other generated fields as-is.)

- [ ] **Step 6: Sanity check + commit**

```bash
cd /home/user/thementalsport.com/app && npx tsc --noEmit
cd /home/user/thementalsport.com
git add app && git commit -m "feat(app): scaffold Expo project for training app"
```
Expected: tsc clean (template compiles).

### Task 2: Content pipeline script

**Files:**
- Create: `scripts/app-content/build-content.ts`
- Create (generated): `app/assets/content/titans.json`, `mina/src/data/coach-content.json`

- [ ] **Step 1: Verify gray-matter is available at repo root**

```bash
cd /home/user/thementalsport.com && node -e "require('gray-matter');console.log('ok')" || npm install gray-matter
```

- [ ] **Step 2: Write `scripts/app-content/build-content.ts`**

```ts
// Builds the bundled training content from the 48 Titans Protocol articles.
// Run from the repo root:  npx tsx scripts/app-content/build-content.ts [--check]
// Writes two committed copies (see spec): the app bundle and mina's copy
// (Vercel builds mina/ with root dir mina, so it can't read outside it).
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src/content/articles');
const OUTPUTS = [
  path.join(ROOT, 'app/assets/content/titans.json'),
  path.join(ROOT, 'mina/src/data/coach-content.json'),
];
const TOTAL_DAYS = 48;

type Day = {day: number; title: string; description: string; tags: string[]; body: string};

function build(): {version: number; days: Day[]} {
  if (!fs.existsSync(SRC_DIR)) throw new Error(`Not repo root? Missing ${SRC_DIR}`);
  const days: Day[] = [];
  for (const f of fs.readdirSync(SRC_DIR)) {
    const m = f.match(/^titans-protocol-day-(\d+)\.md$/);
    if (!m) continue;
    const parsed = matter(fs.readFileSync(path.join(SRC_DIR, f), 'utf-8'));
    const day = parseInt(m[1], 10);
    days.push({
      day,
      title: String(parsed.data.title ?? '').replace(/^Day \d+:\s*/i, ''),
      description: String(parsed.data.description ?? ''),
      tags: Array.isArray(parsed.data.tags) ? parsed.data.tags.map(String) : [],
      body: parsed.content.trim(),
    });
  }
  days.sort((a, b) => a.day - b.day);
  if (days.length !== TOTAL_DAYS) throw new Error(`Expected ${TOTAL_DAYS} days, found ${days.length}`);
  days.forEach((d, i) => {
    if (d.day !== i + 1) throw new Error(`Days not contiguous at index ${i}: got day ${d.day}`);
    if (!d.title || !d.body) throw new Error(`Day ${d.day}: empty title or body`);
  });
  return {version: 1, days};
}

function main() {
  const json = JSON.stringify(build(), null, 2) + '\n';
  if (process.argv.includes('--check')) {
    for (const out of OUTPUTS) {
      if (!fs.existsSync(out) || fs.readFileSync(out, 'utf-8') !== json) {
        console.error(`STALE: ${out} — re-run npx tsx scripts/app-content/build-content.ts`);
        process.exit(1);
      }
    }
    console.log('Content up to date.');
    return;
  }
  for (const out of OUTPUTS) {
    fs.mkdirSync(path.dirname(out), {recursive: true});
    fs.writeFileSync(out, json);
    console.log(`Wrote ${out}`);
  }
}

main();
```

- [ ] **Step 3: Run it, verify, verify --check passes**

```bash
cd /home/user/thementalsport.com
npx tsx scripts/app-content/build-content.ts
npx tsx scripts/app-content/build-content.ts --check
python3 -c "import json;d=json.load(open('app/assets/content/titans.json'));print(len(d['days']),d['days'][0]['title'])"
```
Expected: `Wrote …` twice, `Content up to date.`, then `48 The Biology of Choking (And How to Hack It)`.

- [ ] **Step 4: Commit**

```bash
git add scripts/app-content app/assets/content/titans.json mina/src/data/coach-content.json
git commit -m "feat: build-time content pipeline for the 48-day program"
```

## Phase B — Coach backend (`mina/`)

### Task 3: Key-parameterized memory

**Files:**
- Modify: `mina/src/lib/memory.ts`
- Test: `mina/src/lib/memory.test.ts` (extend existing)

- [ ] **Step 1: Write failing tests** (append to `memory.test.ts`, following its existing mock/style conventions)

```ts
import { addMemoryAt, listMemoriesAt, searchMemoriesAt, deleteMemoryAt, incrDailyCounter } from "./memory";

describe("key-parameterized memory (coach namespacing)", () => {
  it("addMemoryAt returns a Memory even when unconfigured", async () => {
    const m = await addMemoryAt("coach:mem:test-device", "prefers morning sessions");
    expect(m.text).toBe("prefers morning sessions");
    expect(m.id).toMatch(/^m_/);
  });
  it("listMemoriesAt returns [] when unconfigured", async () => {
    expect(await listMemoriesAt("coach:mem:test-device")).toEqual([]);
  });
  it("searchMemoriesAt returns [] when unconfigured", async () => {
    expect(await searchMemoriesAt("coach:mem:test-device", "sessions")).toEqual([]);
  });
  it("deleteMemoryAt reports not-deleted when unconfigured", async () => {
    expect((await deleteMemoryAt("coach:mem:test-device", "m_x")).deleted).toBe(false);
  });
  it("incrDailyCounter returns null when unconfigured", async () => {
    expect(await incrDailyCounter("coach:rl:test:2026-06-28")).toBeNull();
  });
});
```
Run: `cd mina && npx vitest run src/lib/memory.test.ts` → FAIL (functions don't exist).

- [ ] **Step 2: Implement in `memory.ts`**

Refactor the four existing functions so each `…At(key, …)` variant holds the current body with `MEMORY_KEY` replaced by `key`, and the original name delegates:

```ts
export async function addMemoryAt(key: string, text: string): Promise<Memory> { /* current addMemory body, MEMORY_KEY→key */ }
export async function addMemory(text: string): Promise<Memory> { return addMemoryAt(MEMORY_KEY, text); }

export async function listMemoriesAt(key: string, limit = INJECT_LIMIT): Promise<Memory[]> { /* current listMemories body, MEMORY_KEY→key */ }
export async function listMemories(limit = INJECT_LIMIT): Promise<Memory[]> { return listMemoriesAt(MEMORY_KEY, limit); }

export async function searchMemoriesAt(key: string, query: string): Promise<Memory[]> {
  const all = await listMemoriesAt(key, 200);
  return all.map((m) => ({ m, s: scoreMemory(m.text, query) })).filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s).map((x) => x.m);
}
export async function searchMemories(query: string): Promise<Memory[]> { return searchMemoriesAt(MEMORY_KEY, query); }

export async function deleteMemoryAt(key: string, id: string): Promise<{ deleted: boolean; text?: string }> { /* current deleteMemory body, MEMORY_KEY→key */ }
export async function deleteMemory(id: string) { return deleteMemoryAt(MEMORY_KEY, id); }

/** INCR a counter key, setting a TTL on first increment. null = store unconfigured (caller decides). */
export async function incrDailyCounter(key: string, ttlSeconds = 86_400): Promise<number | null> {
  if (!memoryConfigured()) return null;
  try {
    const n = await redis().incr(key);
    if (n === 1) await redis().expire(key, ttlSeconds);
    return n;
  } catch (e) {
    console.error("incrDailyCounter failed:", e);
    return null;
  }
}
```

- [ ] **Step 3: Run the whole memory suite (old + new must pass)**

`cd mina && npx vitest run src/lib/memory.test.ts` → PASS.

- [ ] **Step 4: Commit**

```bash
git add mina/src/lib/memory.ts mina/src/lib/memory.test.ts
git commit -m "feat(mina): key-parameterized memory + daily counter for coach namespacing"
```

### Task 4: Coach content tools module

**Files:**
- Create: `mina/src/lib/coachContent.ts`
- Test: `mina/src/lib/coachContent.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { getDayLesson, searchProtocols, TOTAL_DAYS } from "./coachContent";

describe("coachContent", () => {
  it("has 48 days", () => expect(TOTAL_DAYS).toBe(48));
  it("returns day 1 with title and body", () => {
    const d = getDayLesson(1)!;
    expect(d.title).toContain("Choking");
    expect(d.body.length).toBeGreaterThan(200);
  });
  it("returns null out of range", () => {
    expect(getDayLesson(0)).toBeNull();
    expect(getDayLesson(49)).toBeNull();
  });
  it("finds breathing-related protocols", () => {
    const hits = searchProtocols("breathing");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.length).toBeLessThanOrEqual(3);
    expect(hits[0]).toHaveProperty("day");
  });
  it("empty query → []", () => expect(searchProtocols("")).toEqual([]));
});
```
Run: `cd mina && npx vitest run src/lib/coachContent.test.ts` → FAIL.

- [ ] **Step 2: Implement `coachContent.ts`**

```ts
// The coach's grounding: the bundled 48-day program content.
// coach-content.json is generated by scripts/app-content/build-content.ts —
// do not edit by hand.
import content from "@/data/coach-content.json";
import { scoreMemory } from "./memory";

export type DayLesson = { day: number; title: string; description: string; tags: string[]; body: string };

const DAYS: DayLesson[] = (content as { days: DayLesson[] }).days;
export const TOTAL_DAYS = DAYS.length;

export function getDayLesson(day: number): DayLesson | null {
  return DAYS.find((d) => d.day === day) ?? null;
}

/** Top-3 lessons matching the query (title/description/tags weighted over body). */
export function searchProtocols(query: string): Array<Omit<DayLesson, "body"> & { excerpt: string }> {
  const q = query.trim();
  if (!q) return [];
  return DAYS.map((d) => ({
    d,
    s: 3 * scoreMemory(`${d.title} ${d.description} ${d.tags.join(" ")}`, q) + scoreMemory(d.body, q),
  }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 3)
    .map(({ d }) => ({ day: d.day, title: d.title, description: d.description, tags: d.tags, excerpt: d.body.slice(0, 400) }));
}
```
If `@/data/...` doesn't resolve, check `mina/tsconfig.json` paths (`@/*` → `./src/*` is the existing convention used by `@/lib/brain`) and that `resolveJsonModule` is on — add `"resolveJsonModule": true` to compilerOptions if missing.

- [ ] **Step 3: Run tests** → PASS. **Commit**

```bash
git add mina/src/lib/coachContent.ts mina/src/lib/coachContent.test.ts mina/tsconfig.json
git commit -m "feat(mina): coach content tools over the bundled 48-day program"
```

### Task 5: The coach loop (persona, tools, runCoach, auth guard)

**Files:**
- Modify: `mina/src/lib/brain.ts` (export `withIdleTimeout` only)
- Create: `mina/src/lib/coach.ts`
- Test: `mina/src/lib/coach.test.ts`

- [ ] **Step 1: Export the stream guard from brain.ts**

Change `async function* withIdleTimeout(` to `export async function* withIdleTimeout(`. No other change.

- [ ] **Step 2: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { coachTools, checkCoachAuth, COACH_SYSTEM_PROMPT } from "./coach";
import { TOOLS } from "./tools";

const DEVICE = "123e4567-e89b-42d3-a456-426614174000";

describe("coach tool isolation (spec security invariant)", () => {
  const names = coachTools(DEVICE).map((t) => t.name).sort();
  it("exposes exactly the allowlist", () => {
    expect(names).toEqual(["forget", "get_day_lesson", "recall", "remember", "search_protocols"]);
  });
  it("exposes NO operator tools", () => {
    const operator = TOOLS.map((t) => t.name);
    for (const n of names.filter((x) => !["remember", "recall", "forget"].includes(x))) {
      expect(operator).not.toContain(n);
    }
    for (const forbidden of ["send_email", "issue_refund", "create_calendar_event", "create_skill", "propose_prompt_improvement", "browse_url"]) {
      expect(names).not.toContain(forbidden);
    }
  });
});

describe("checkCoachAuth", () => {
  const mk = (h: Record<string, string>) => new Headers(h);
  it("503 when server has no token", () => {
    delete process.env.COACH_APP_TOKEN;
    expect(checkCoachAuth(mk({ "x-app-token": "x", "x-device-id": DEVICE }))).toMatchObject({ ok: false, status: 503 });
  });
  it("401 on wrong token", () => {
    process.env.COACH_APP_TOKEN = "secret";
    expect(checkCoachAuth(mk({ "x-app-token": "wrong", "x-device-id": DEVICE }))).toMatchObject({ ok: false, status: 401 });
  });
  it("400 on bad device id", () => {
    process.env.COACH_APP_TOKEN = "secret";
    expect(checkCoachAuth(mk({ "x-app-token": "secret", "x-device-id": "not-a-uuid" }))).toMatchObject({ ok: false, status: 400 });
  });
  it("ok on valid token + uuid", () => {
    process.env.COACH_APP_TOKEN = "secret";
    expect(checkCoachAuth(mk({ "x-app-token": "secret", "x-device-id": DEVICE }))).toEqual({ ok: true, deviceId: DEVICE });
  });
});

describe("persona guardrails", () => {
  it("mentions the clinical boundary and crisis redirect", () => {
    expect(COACH_SYSTEM_PROMPT).toMatch(/not .*(therap|medical|clinical)/i);
    expect(COACH_SYSTEM_PROMPT).toMatch(/professional/i);
  });
});
```
Run: `cd mina && npx vitest run src/lib/coach.test.ts` → FAIL.

- [ ] **Step 3: Implement `coach.ts`**

```ts
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
```

- [ ] **Step 4: Run tests** → coach.test.ts PASS. Also `npx vitest run` (whole suite) → PASS.

- [ ] **Step 5: Commit**

```bash
git add mina/src/lib/brain.ts mina/src/lib/coach.ts mina/src/lib/coach.test.ts
git commit -m "feat(mina): isolated coach loop with persona, grounded tools, auth guard"
```

### Task 6: `/api/coach` route

**Files:**
- Create: `mina/src/app/api/coach/route.ts`

- [ ] **Step 1: Write the route**

```ts
// Public coach endpoint for the training app. SSE, same wire shape as
// /api/chat (delta / error / done ServerEvents) so the app client stays dumb.
// Auth: x-app-token (shared secret) + x-device-id (UUID) — see lib/coach.ts.
// Rate limit: 30 messages/device/UTC day via Upstash (fails open when the
// store is unconfigured, e.g. local dev).
import { runCoach, checkCoachAuth } from "@/lib/coach";
import { incrDailyCounter } from "@/lib/memory";
import { trimHistory } from "@/lib/history";
import type { ApiMessage, ServerEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAILY_LIMIT = 30;

export async function POST(req: Request) {
  const auth = checkCoachAuth(req.headers);
  if (!auth.ok) return new Response(auth.message, { status: auth.status });

  let body: { messages: ApiMessage[] };
  try {
    body = (await req.json()) as { messages: ApiMessage[] };
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response("messages required", { status: 400 });
  }

  const day = new Date().toISOString().slice(0, 10);
  const n = await incrDailyCounter(`coach:rl:${auth.deviceId}:${day}`);
  if (n !== null && n > DAILY_LIMIT) {
    return new Response("Daily coach limit reached — back tomorrow.", { status: 429 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ServerEvent) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      try {
        const result = await runCoach({ messages: trimHistory(body.messages), deviceId: auth.deviceId });
        if (result.error) send({ type: "error", message: result.error });
        else if (result.text) send({ type: "delta", text: result.text });
        send({ type: "done" });
      } catch {
        send({ type: "error", message: "Coach failed — try again." });
        send({ type: "done" });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
```

- [ ] **Step 2: Build + suite check**

```bash
cd /home/user/thementalsport.com/mina && npx tsc --noEmit && npx vitest run
```
Expected: both clean. (If `tsc --noEmit` isn't how mina checks — check for a `typecheck`/`build` script in mina/package.json and use that.)

- [ ] **Step 3: Smoke the endpoint locally**

```bash
cd /home/user/thementalsport.com/mina
COACH_APP_TOKEN=devtoken npx next dev -p 3111 &
sleep 8
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3111/api/coach \
  -H 'content-type: application/json' -d '{"messages":[{"role":"user","content":"hi"}]}'          # expect 401
curl -s -X POST http://localhost:3111/api/coach \
  -H 'content-type: application/json' -H 'x-app-token: devtoken' \
  -H 'x-device-id: 123e4567-e89b-42d3-a456-426614174000' \
  -d '{"messages":[{"role":"user","content":"I get nervous before games"}]}' | head -3
kill %1
```
Expected: `401`, then SSE lines (`data: {"type":"delta"…` if a provider key is present in the env, otherwise a clean `error` event — both prove the route works).

- [ ] **Step 4: Commit**

```bash
git add mina/src/app/api/coach/route.ts
git commit -m "feat(mina): /api/coach SSE endpoint with auth + per-device daily rate limit"
```

## Phase C — App features

### Task 7: Content module + progress logic (pure, TDD)

**Files:**
- Create: `app/src/lib/content.ts`, `app/src/lib/progress.ts`
- Test: `app/src/lib/__tests__/content.test.ts`, `app/src/lib/__tests__/progress.test.ts`

- [ ] **Step 1: Write failing tests**

`content.test.ts`:
```ts
import { DAYS, getDay, TOTAL_DAYS } from "../content";

it("bundles 48 contiguous days", () => {
  expect(TOTAL_DAYS).toBe(48);
  DAYS.forEach((d, i) => expect(d.day).toBe(i + 1));
});
it("day 1 has content", () => {
  expect(getDay(1)!.title).toContain("Choking");
  expect(getDay(1)!.body.length).toBeGreaterThan(200);
});
```

`progress.test.ts`:
```ts
import { unlockedDayCount, isUnlocked, nextStreak } from "../progress";

const d = (s: string) => new Date(s + "T10:00:00");

describe("unlockedDayCount", () => {
  it("day of install unlocks day 1 only", () => expect(unlockedDayCount(d("2026-06-01"), d("2026-06-01"))).toBe(1));
  it("next calendar day unlocks day 2", () => expect(unlockedDayCount(d("2026-06-01"), d("2026-06-02"))).toBe(2));
  it("same-day boundary: late night to early morning still counts a day", () =>
    expect(unlockedDayCount(new Date("2026-06-01T23:50:00"), new Date("2026-06-02T00:10:00"))).toBe(2));
  it("caps at 48", () => expect(unlockedDayCount(d("2026-01-01"), d("2026-12-01"))).toBe(48));
  it("isUnlocked matches the count", () => {
    expect(isUnlocked(2, d("2026-06-01"), d("2026-06-02"))).toBe(true);
    expect(isUnlocked(3, d("2026-06-01"), d("2026-06-02"))).toBe(false);
  });
});

describe("nextStreak", () => {
  it("first completion → 1", () => expect(nextStreak(0, null, d("2026-06-01"))).toBe(1));
  it("second completion same day → unchanged", () => expect(nextStreak(3, d("2026-06-01"), d("2026-06-01"))).toBe(3));
  it("completion on consecutive day → +1", () => expect(nextStreak(3, d("2026-06-01"), d("2026-06-02"))).toBe(4));
  it("gap resets to 1", () => expect(nextStreak(9, d("2026-06-01"), d("2026-06-04"))).toBe(1));
});
```
Run: `cd app && npm test` → FAIL.

- [ ] **Step 2: Implement**

`content.ts`:
```ts
import raw from "../../assets/content/titans.json";

export type DayLesson = { day: number; title: string; description: string; tags: string[]; body: string };
export const DAYS: DayLesson[] = (raw as { days: DayLesson[] }).days;
export const TOTAL_DAYS = DAYS.length;
export const getDay = (day: number): DayLesson | null => DAYS.find((d) => d.day === day) ?? null;
```
(If TS complains about the JSON import, add `"resolveJsonModule": true` to `app/tsconfig.json` compilerOptions.)

`progress.ts`:
```ts
// Pure date/streak math. All comparisons are LOCAL-calendar-day based so a
// 23:50 → 00:10 gap still counts as "the next day" for both unlocks and streaks.
import { TOTAL_DAYS } from "./content";

const dayStamp = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const MS_DAY = 86_400_000;

export const calendarDaysBetween = (a: Date, b: Date) => Math.round((dayStamp(b) - dayStamp(a)) / MS_DAY);

/** How many program days are unlocked: day 1 on install day, +1 per calendar day, capped. */
export const unlockedDayCount = (startDate: Date, now: Date) =>
  Math.max(1, Math.min(TOTAL_DAYS, calendarDaysBetween(startDate, now) + 1));

export const isUnlocked = (day: number, startDate: Date, now: Date) => day <= unlockedDayCount(startDate, now);

/** Streak transition on completing a day. Same-day: unchanged; consecutive day: +1; gap: reset. */
export function nextStreak(current: number, lastCompletedAt: Date | null, now: Date): number {
  if (!lastCompletedAt) return 1;
  const gap = calendarDaysBetween(lastCompletedAt, now);
  if (gap === 0) return Math.max(1, current);
  if (gap === 1) return current + 1;
  return 1;
}
```

- [ ] **Step 3: Run tests** → PASS. **Commit**

```bash
git add app/src/lib app/tsconfig.json app/package.json
git commit -m "feat(app): bundled content module + unlock/streak logic (TDD)"
```

### Task 8: Progress store (AsyncStorage)

**Files:**
- Create: `app/src/store/progress.ts`
- Test: `app/src/lib/__tests__/store.test.ts`

- [ ] **Step 1: Failing test** (AsyncStorage ships an official jest mock)

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadProgress, markDayComplete, getOrInitProgress } from "../../store/progress";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

beforeEach(() => AsyncStorage.clear());

it("initializes once and persists startDate + deviceId", async () => {
  const p1 = await getOrInitProgress();
  const p2 = await getOrInitProgress();
  expect(p1.startDate).toBe(p2.startDate);
  expect(p1.deviceId).toBe(p2.deviceId);
  expect(p1.deviceId).toMatch(/^[0-9a-f-]{36}$/i);
});

it("markDayComplete records the day and updates streaks", async () => {
  await getOrInitProgress();
  const p = await markDayComplete(1);
  expect(p.completedDays).toContain(1);
  expect(p.streak).toBe(1);
  expect(p.longestStreak).toBe(1);
  const again = await markDayComplete(1);
  expect(again.completedDays).toEqual([1]); // no duplicates
});

it("loadProgress returns null before init", async () => {
  expect(await loadProgress()).toBeNull();
});
```
Run → FAIL.

- [ ] **Step 2: Implement `app/src/store/progress.ts`**

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { nextStreak } from "../lib/progress";

const KEY = "tms:progress:v1";

export type Progress = {
  startDate: string;          // ISO — first launch
  deviceId: string;           // anonymous UUID, coach memory namespace
  completedDays: number[];
  streak: number;
  longestStreak: number;
  lastCompletedAt: string | null;
  reminderHour: number;       // local hour for the daily notification
  reminderEnabled: boolean;
};

export async function loadProgress(): Promise<Progress | null> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Progress) : null;
}

async function save(p: Progress): Promise<Progress> {
  await AsyncStorage.setItem(KEY, JSON.stringify(p));
  return p;
}

export async function getOrInitProgress(): Promise<Progress> {
  const existing = await loadProgress();
  if (existing) return existing;
  return save({
    startDate: new Date().toISOString(),
    deviceId: Crypto.randomUUID(),
    completedDays: [],
    streak: 0,
    longestStreak: 0,
    lastCompletedAt: null,
    reminderHour: 8,
    reminderEnabled: true,
  });
}

export async function markDayComplete(day: number, now = new Date()): Promise<Progress> {
  const p = await getOrInitProgress();
  if (!p.completedDays.includes(day)) {
    p.completedDays = [...p.completedDays, day].sort((a, b) => a - b);
    p.streak = nextStreak(p.streak, p.lastCompletedAt ? new Date(p.lastCompletedAt) : null, now);
    p.longestStreak = Math.max(p.longestStreak, p.streak);
    p.lastCompletedAt = now.toISOString();
  }
  return save(p);
}

export async function updateReminder(fields: Pick<Progress, "reminderHour" | "reminderEnabled">): Promise<Progress> {
  const p = await getOrInitProgress();
  return save({ ...p, ...fields });
}
```
(`expo-crypto`'s `randomUUID` works under jest-expo; if not, mock it in the test file with `jest.mock("expo-crypto", () => ({ randomUUID: () => "123e4567-e89b-42d3-a456-426614174000" }))`.)

- [ ] **Step 3: Run tests** → PASS. **Commit**

```bash
git add app/src
git commit -m "feat(app): persistent progress store"
```

### Task 9: Tab shell + Today screen

**Files:**
- Replace: `app/app/(tabs)/_layout.tsx`, `app/app/(tabs)/index.tsx` (Today)
- Delete: leftover template screens in `app/app/(tabs)/`
- Create: `app/src/ui/theme.ts`

- [ ] **Step 1: Theme constants** (`app/src/ui/theme.ts`)

```ts
export const C = {
  bg: "#0B0F14", card: "#151B23", text: "#F2F5F7", dim: "#8A97A5",
  accent: "#22C55E", accentDim: "#14532D", lock: "#3B4654", danger: "#EF4444",
};
```

- [ ] **Step 2: Tabs layout** (`app/app/(tabs)/_layout.tsx`)

```tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../../src/ui/theme";

const icon = (name: keyof typeof Ionicons.glyphMap) =>
  ({ color, size }: { color: string; size: number }) => <Ionicons name={name} color={color} size={size} />;

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerStyle: { backgroundColor: C.bg }, headerTintColor: C.text,
      tabBarStyle: { backgroundColor: C.bg, borderTopColor: C.card },
      tabBarActiveTintColor: C.accent, tabBarInactiveTintColor: C.dim,
      sceneStyle: { backgroundColor: C.bg },
    }}>
      <Tabs.Screen name="index" options={{ title: "Today", tabBarIcon: icon("today") }} />
      <Tabs.Screen name="program" options={{ title: "Program", tabBarIcon: icon("calendar") }} />
      <Tabs.Screen name="tools" options={{ title: "Tools", tabBarIcon: icon("pulse") }} />
      <Tabs.Screen name="coach" options={{ title: "Coach", tabBarIcon: icon("chatbubbles") }} />
    </Tabs>
  );
}
```
Delete template screens that aren't these four routes (e.g. `explore.tsx`).

- [ ] **Step 3: Today screen** (`app/app/(tabs)/index.tsx`)

```tsx
import { useCallback, useState } from "react";
import { ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import Markdown from "react-native-markdown-display";
import { getDay } from "../../src/lib/content";
import { unlockedDayCount } from "../../src/lib/progress";
import { getOrInitProgress, markDayComplete, type Progress } from "../../src/store/progress";
import { syncDailyReminder } from "../../src/lib/reminders";
import { C } from "../../src/ui/theme";

export default function Today() {
  const [p, setP] = useState<Progress | null>(null);
  useFocusEffect(useCallback(() => {
    getOrInitProgress().then(async (prog) => { setP(prog); await syncDailyReminder(prog); });
  }, []));
  if (!p) return null;

  const unlocked = unlockedDayCount(new Date(p.startDate), new Date());
  // Today = the lowest unlocked-but-incomplete day (catch-up first), else the newest unlocked.
  const day = Array.from({ length: unlocked }, (_, i) => i + 1).find((d) => !p.completedDays.includes(d)) ?? unlocked;
  const lesson = getDay(day)!;
  const done = p.completedDays.includes(day);

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Text style={s.kicker}>DAY {day} OF 48 · 🔥 {p.streak}-day streak</Text>
      <Text style={s.title}>{lesson.title}</Text>
      <Text style={s.desc}>{lesson.description}</Text>
      <View style={s.card}>
        <Markdown style={md}>{lesson.body}</Markdown>
      </View>
      <Pressable
        onPress={async () => setP(await markDayComplete(day))}
        disabled={done}
        style={[s.btn, done && { backgroundColor: C.accentDim }]}
      >
        <Text style={s.btnText}>{done ? "✓ Day complete" : "Mark day complete"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  kicker: { color: C.accent, fontWeight: "700", letterSpacing: 1, marginBottom: 8 },
  title: { color: C.text, fontSize: 26, fontWeight: "800", marginBottom: 6 },
  desc: { color: C.dim, fontSize: 15, marginBottom: 16 },
  card: { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 20 },
  btn: { backgroundColor: C.accent, borderRadius: 12, padding: 16, alignItems: "center" },
  btnText: { color: "#04140A", fontWeight: "800", fontSize: 16 },
});
const md = {
  body: { color: C.text, fontSize: 15, lineHeight: 23 },
  heading2: { color: C.text, fontWeight: "800" as const, marginTop: 14 },
  heading3: { color: C.text, fontWeight: "700" as const, marginTop: 10 },
  strong: { color: C.text },
  blockquote: { backgroundColor: "#101720", borderLeftColor: C.accent, borderLeftWidth: 3, padding: 8 },
  bullet_list: { marginVertical: 6 },
};
```
`reminders.ts` doesn't exist yet — create a stub now so tsc stays green (fully implemented in Task 12):
```ts
// app/src/lib/reminders.ts
import type { Progress } from "../store/progress";
export async function syncDailyReminder(_p: Progress): Promise<void> {} // implemented in Task 12
```

- [ ] **Step 4: Typecheck + commit**

```bash
cd /home/user/thementalsport.com/app && npx tsc --noEmit
cd /home/user/thementalsport.com && git add app && git commit -m "feat(app): tab shell + Today screen"
```

### Task 10: Program screen

**Files:**
- Create: `app/app/(tabs)/program.tsx`, `app/app/day/[day].tsx` (detail view)

- [ ] **Step 1: Program list** (`app/app/(tabs)/program.tsx`)

```tsx
import { useCallback, useState } from "react";
import { FlatList, Text, View, Pressable, StyleSheet } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { DAYS } from "../../src/lib/content";
import { unlockedDayCount } from "../../src/lib/progress";
import { getOrInitProgress, type Progress } from "../../src/store/progress";
import { C } from "../../src/ui/theme";

export default function Program() {
  const [p, setP] = useState<Progress | null>(null);
  useFocusEffect(useCallback(() => { getOrInitProgress().then(setP); }, []));
  if (!p) return null;
  const unlocked = unlockedDayCount(new Date(p.startDate), new Date());

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 12 }}
      data={DAYS}
      keyExtractor={(d) => String(d.day)}
      renderItem={({ item }) => {
        const done = p.completedDays.includes(item.day);
        const open = item.day <= unlocked;
        return (
          <Pressable
            disabled={!open}
            onPress={() => router.push(`/day/${item.day}`)}
            style={[s.row, !open && { opacity: 0.45 }]}
          >
            <View style={[s.badge, done ? { backgroundColor: C.accent } : open ? { borderColor: C.accent, borderWidth: 2 } : { backgroundColor: C.lock }]}>
              <Text style={[s.badgeText, done && { color: "#04140A" }]}>{done ? "✓" : item.day}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={s.rowSub} numberOfLines={1}>{open ? item.description : "Unlocks later — one day at a time"}</Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.card, borderRadius: 12, padding: 12, marginBottom: 8 },
  badge: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  badgeText: { color: C.text, fontWeight: "800" },
  rowTitle: { color: C.text, fontWeight: "700" },
  rowSub: { color: C.dim, fontSize: 12, marginTop: 2 },
});
```

- [ ] **Step 2: Day detail route** (`app/app/day/[day].tsx`) — same rendering as Today but for any unlocked day:

```tsx
import { useCallback, useState } from "react";
import { ScrollView, Text, Pressable, StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams, useFocusEffect } from "expo-router";
import Markdown from "react-native-markdown-display";
import { getDay } from "../../src/lib/content";
import { isUnlocked } from "../../src/lib/progress";
import { getOrInitProgress, markDayComplete, type Progress } from "../../src/store/progress";
import { C } from "../../src/ui/theme";

export default function DayDetail() {
  const { day: dayParam } = useLocalSearchParams<{ day: string }>();
  const day = parseInt(dayParam ?? "1", 10);
  const [p, setP] = useState<Progress | null>(null);
  useFocusEffect(useCallback(() => { getOrInitProgress().then(setP); }, []));
  const lesson = getDay(day);
  if (!p || !lesson) return null;
  const open = isUnlocked(day, new Date(p.startDate), new Date());
  const done = p.completedDays.includes(day);

  return (
    <>
      <Stack.Screen options={{ title: `Day ${day}`, headerStyle: { backgroundColor: C.bg }, headerTintColor: C.text }} />
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Text style={s.title}>{lesson.title}</Text>
        {open ? (
          <>
            <View style={s.card}><Markdown style={{ body: { color: C.text, fontSize: 15, lineHeight: 23 } }}>{lesson.body}</Markdown></View>
            <Pressable onPress={async () => setP(await markDayComplete(day))} disabled={done}
              style={[s.btn, done && { backgroundColor: C.accentDim }]}>
              <Text style={s.btnText}>{done ? "✓ Completed" : "Mark complete"}</Text>
            </Pressable>
          </>
        ) : (
          <Text style={{ color: C.dim }}>This day hasn't unlocked yet. One day at a time.</Text>
        )}
      </ScrollView>
    </>
  );
}
const s = StyleSheet.create({
  title: { color: C.text, fontSize: 24, fontWeight: "800", marginBottom: 12 },
  card: { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 20 },
  btn: { backgroundColor: C.accent, borderRadius: 12, padding: 16, alignItems: "center" },
  btnText: { color: "#04140A", fontWeight: "800", fontSize: 16 },
});
```

- [ ] **Step 2b: Finish-line card (spec: go-deeper at end of Day 48)** — in `app/app/day/[day].tsx`, directly after the `Mark complete` `<Pressable>` inside the `open` branch, add:

```tsx
{done && day === 48 && (
  <Pressable style={{ backgroundColor: C.card, borderRadius: 14, padding: 16, marginTop: 16 }}
    onPress={() => Linking.openURL(LINKS.course)}>
    <Text style={{ color: C.accent, fontWeight: "800", fontSize: 16 }}>48 days done. Go deeper →</Text>
    <Text style={{ color: C.dim, marginTop: 4, fontSize: 13 }}>The full Mental Performance Protocol course picks up where the program ends.</Text>
  </Pressable>
)}
```
with imports `Linking` (from react-native) and `import { LINKS } from "../../src/lib/links";` — note `links.ts` is created in Task 11 Step 4; if executing strictly in order, create that tiny file here instead and skip it in Task 11.

- [ ] **Step 3: Typecheck, jest, commit**

```bash
cd app && npx tsc --noEmit && npm test
cd .. && git add app && git commit -m "feat(app): program map + day detail with unlock gating"
```

### Task 11: Tools tab (breathing timers)

**Files:**
- Create: `app/src/lib/breathing.ts`, `app/src/ui/BreathingTimer.tsx`, `app/app/(tabs)/tools.tsx`

- [ ] **Step 1: Configs** (`app/src/lib/breathing.ts`)

```ts
export type BreathPhase = { label: "Inhale" | "Hold" | "Exhale" | "Inhale again"; seconds: number };
export type BreathingExercise = { id: string; name: string; blurb: string; phases: BreathPhase[]; source: string };

export const EXERCISES: BreathingExercise[] = [
  {
    id: "box",
    name: "Box Breathing",
    blurb: "The Navy SEAL 4-4-4-4: steady the system before or during competition.",
    phases: [
      { label: "Inhale", seconds: 4 }, { label: "Hold", seconds: 4 },
      { label: "Exhale", seconds: 4 }, { label: "Hold", seconds: 4 },
    ],
    source: "The Mental Performance Protocol — arousal control module",
  },
  {
    id: "sigh",
    name: "Physiological Sigh",
    blurb: "Double inhale + long exhale — the fastest evidence-backed downshift.",
    phases: [
      { label: "Inhale", seconds: 2 }, { label: "Inhale again", seconds: 1 }, { label: "Exhale", seconds: 6 },
    ],
    source: "The Mental Performance Protocol — 60-second reset",
  },
];
```

- [ ] **Step 2: Timer component** (`app/src/ui/BreathingTimer.tsx`)

```tsx
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import type { BreathingExercise } from "../lib/breathing";
import { C } from "./theme";

export function BreathingTimer({ exercise }: { exercise: BreathingExercise }) {
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [remaining, setRemaining] = useState(exercise.phases[0].seconds);
  const scale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!running) return;
    const phase = exercise.phases[phaseIdx];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const grow = phase.label.startsWith("Inhale");
    Animated.timing(scale, {
      toValue: grow ? 1 : phase.label === "Hold" ? (scale as unknown as { _value: number })._value : 0.6,
      duration: phase.seconds * 1000,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
    setRemaining(phase.seconds);
    const tick = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    const next = setTimeout(() => setPhaseIdx((i) => (i + 1) % exercise.phases.length), phase.seconds * 1000);
    return () => { clearInterval(tick); clearTimeout(next); };
  }, [running, phaseIdx, exercise, scale]);

  const stop = () => { setRunning(false); setPhaseIdx(0); scale.setValue(0.6); setRemaining(exercise.phases[0].seconds); };

  return (
    <View style={s.wrap}>
      <Animated.View style={[s.circle, { transform: [{ scale }] }]} />
      <Text style={s.phase}>{running ? exercise.phases[phaseIdx].label : exercise.name}</Text>
      <Text style={s.count}>{running ? remaining : ""}</Text>
      <Pressable style={s.btn} onPress={() => (running ? stop() : setRunning(true))}>
        <Text style={s.btnText}>{running ? "Stop" : "Start"}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: 24 },
  circle: { width: 180, height: 180, borderRadius: 90, backgroundColor: C.accentDim, borderColor: C.accent, borderWidth: 3, marginBottom: 16 },
  phase: { color: C.text, fontSize: 22, fontWeight: "800" },
  count: { color: C.dim, fontSize: 18, minHeight: 24 },
  btn: { marginTop: 12, backgroundColor: C.accent, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 40 },
  btnText: { color: "#04140A", fontWeight: "800" },
});
```

- [ ] **Step 3: Tools screen** (`app/app/(tabs)/tools.tsx`)

```tsx
import { useState } from "react";
import { ScrollView, Text, Pressable, StyleSheet, View, Linking } from "react-native";
import { EXERCISES } from "../../src/lib/breathing";
import { BreathingTimer } from "../../src/ui/BreathingTimer";
import { LINKS } from "../../src/lib/links";
import { C } from "../../src/ui/theme";

export default function Tools() {
  const [active, setActive] = useState(EXERCISES[0]);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {EXERCISES.map((e) => (
          <Pressable key={e.id} onPress={() => setActive(e)}
            style={[s.chip, active.id === e.id && { backgroundColor: C.accent }]}>
            <Text style={[s.chipText, active.id === e.id && { color: "#04140A" }]}>{e.name}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={s.blurb}>{active.blurb}</Text>
      <BreathingTimer exercise={active} />
      <Text style={s.source}>{active.source}</Text>
      <Pressable style={s.deeper} onPress={() => Linking.openURL(LINKS.course)}>
        <Text style={s.deeperTitle}>Go deeper: the full course →</Text>
        <Text style={s.deeperSub}>All 8 modules of The Mental Performance Protocol, on thementalsport.com</Text>
      </Pressable>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  chip: { backgroundColor: C.card, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  chipText: { color: C.text, fontWeight: "700" },
  blurb: { color: C.dim, marginTop: 14 },
  source: { color: C.lock, fontSize: 12, textAlign: "center", marginTop: 8 },
  deeper: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginTop: 24 },
  deeperTitle: { color: C.accent, fontWeight: "800", fontSize: 16 },
  deeperSub: { color: C.dim, marginTop: 4, fontSize: 13 },
});
```

- [ ] **Step 4: Links constants** (`app/src/lib/links.ts`) — stable site URLs (not raw Shopify cart variant links):

```ts
export const LINKS = {
  course: "https://thementalsport.com/course",
  books: "https://thementalsport.com/books",
  freeGuide: "https://thementalsport.com/free",
};
```

- [ ] **Step 5: Typecheck + commit**

```bash
cd app && npx tsc --noEmit
cd .. && git add app && git commit -m "feat(app): breathing tools + go-deeper links"
```

### Task 12: Daily reminder (local notifications)

**Files:**
- Replace stub: `app/src/lib/reminders.ts`

- [ ] **Step 1: Implement**

```ts
// One local daily notification: "Day N is ready". Local-only (no push server).
// Re-synced on every app open so the day number tracks the unlock state.
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { unlockedDayCount } from "./progress";
import type { Progress } from "../store/progress";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false,
    shouldShowBanner: true, shouldShowList: true,
  }),
});

export async function syncDailyReminder(p: Progress): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!p.reminderEnabled) return;
    const perms = await Notifications.requestPermissionsAsync();
    if (!perms.granted) return;
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("daily", {
        name: "Daily training", importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const nextDay = Math.min(48, unlockedDayCount(new Date(p.startDate), new Date()) + 1);
    await Notifications.scheduleNotificationAsync({
      content: { title: "The Mental Sport", body: `Day ${nextDay} is ready. Keep the streak alive. 🔥` },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: p.reminderHour, minute: 0, channelId: "daily",
      } as Notifications.DailyTriggerInput,
    });
  } catch {
    // Notifications are best-effort — never block the app on them.
  }
}
```
(If the SDK's trigger typing differs, adapt to the installed `expo-notifications` version's daily-trigger shape — the intent is a repeating daily local notification at `reminderHour`:00.)

- [ ] **Step 2: Reminder settings row** (`app/src/ui/ReminderRow.tsx`) — spec requires a user-configurable time:

```tsx
import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { updateReminder, type Progress } from "../store/progress";
import { syncDailyReminder } from "../lib/reminders";
import { C } from "./theme";

export function ReminderRow({ progress, onChange }: { progress: Progress; onChange: (p: Progress) => void }) {
  const [busy, setBusy] = useState(false);
  const apply = async (fields: { reminderHour: number; reminderEnabled: boolean }) => {
    if (busy) return;
    setBusy(true);
    const p = await updateReminder(fields);
    await syncDailyReminder(p);
    onChange(p);
    setBusy(false);
  };
  const hour = progress.reminderHour;
  return (
    <View style={s.row}>
      <Text style={s.label}>Daily reminder</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable disabled={!progress.reminderEnabled} onPress={() => apply({ reminderEnabled: true, reminderHour: (hour + 23) % 24 })}>
          <Text style={s.step}>−</Text>
        </Pressable>
        <Text style={s.time}>{String(hour).padStart(2, "0")}:00</Text>
        <Pressable disabled={!progress.reminderEnabled} onPress={() => apply({ reminderEnabled: true, reminderHour: (hour + 1) % 24 })}>
          <Text style={s.step}>＋</Text>
        </Pressable>
        <Switch value={progress.reminderEnabled} onValueChange={(v) => apply({ reminderEnabled: v, reminderHour: hour })}
          trackColor={{ true: C.accentDim, false: C.lock }} thumbColor={progress.reminderEnabled ? C.accent : C.dim} />
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.card, borderRadius: 12, padding: 12, marginTop: 20 },
  label: { color: C.text, fontWeight: "700" },
  step: { color: C.accent, fontSize: 22, fontWeight: "800", paddingHorizontal: 6 },
  time: { color: C.text, fontVariant: ["tabular-nums"], fontWeight: "700" },
});
```

Then render it at the bottom of the Today screen (after the complete button):
```tsx
<ReminderRow progress={p} onChange={setP} />
```
with the import `import { ReminderRow } from "../../src/ui/ReminderRow";`.

- [ ] **Step 3: Typecheck, jest, commit**

```bash
cd app && npx tsc --noEmit && npm test
cd .. && git add app && git commit -m "feat(app): daily local reminder synced to unlock state, configurable time"
```

### Task 13: Coach tab

**Files:**
- Create: `app/src/lib/coachClient.ts`, `app/app/(tabs)/coach.tsx`

- [ ] **Step 1: SSE client** (`app/src/lib/coachClient.ts`) — RN's fetch can't stream; `expo/fetch` can:

```ts
import { fetch as expoFetch } from "expo/fetch";

export type CoachMessage = { role: "user" | "assistant"; content: string };

const COACH_URL = process.env.EXPO_PUBLIC_COACH_URL ?? "http://10.0.2.2:3000"; // Android-emulator localhost
const APP_TOKEN = process.env.EXPO_PUBLIC_COACH_TOKEN ?? "devtoken";
const HISTORY_LIMIT = 12;

/** POSTs the conversation; resolves with the coach's reply text. Throws on HTTP/stream errors. */
export async function askCoach(messages: CoachMessage[], deviceId: string): Promise<string> {
  const res = await expoFetch(`${COACH_URL}/api/coach`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-app-token": APP_TOKEN, "x-device-id": deviceId },
    body: JSON.stringify({ messages: messages.slice(-HISTORY_LIMIT) }),
  });
  if (res.status === 429) throw new Error("Daily coach limit reached — back tomorrow.");
  if (!res.ok) throw new Error(`Coach unavailable (${res.status}).`);

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let reply = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const line = frame.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      const event = JSON.parse(line.slice(6)) as { type: string; text?: string; message?: string };
      if (event.type === "delta" && event.text) reply += event.text;
      if (event.type === "error") throw new Error(event.message ?? "Coach error.");
      if (event.type === "done") return reply;
    }
  }
  return reply;
}
```

- [ ] **Step 2: Coach screen** (`app/app/(tabs)/coach.tsx`)

```tsx
import { useCallback, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { askCoach, type CoachMessage } from "../../src/lib/coachClient";
import { getOrInitProgress } from "../../src/store/progress";
import { C } from "../../src/ui/theme";

const OPENER: CoachMessage = {
  role: "assistant",
  content: "I'm your mental performance coach. What are you working on — nerves, focus, confidence, bouncing back?",
};

export default function Coach() {
  const [messages, setMessages] = useState<CoachMessage[]>([OPENER]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const deviceId = useRef<string>("");
  const list = useRef<FlatList>(null);
  useFocusEffect(useCallback(() => { getOrInitProgress().then((p) => { deviceId.current = p.deviceId; }); }, []));

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next: CoachMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const reply = await askCoach(next.filter((m) => m !== OPENER), deviceId.current);
      setMessages([...next, { role: "assistant", content: reply || "…" }]);
    } catch (e) {
      setMessages([...next, { role: "assistant", content: e instanceof Error ? e.message : "Something went wrong — try again." }]);
    } finally {
      setBusy(false);
      setTimeout(() => list.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <FlatList
        ref={list}
        contentContainerStyle={{ padding: 14, gap: 8 }}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={[s.bubble, item.role === "user" ? s.user : s.coach]}>
            <Text style={s.bubbleText}>{item.content}</Text>
          </View>
        )}
      />
      <View style={s.inputRow}>
        <TextInput
          style={s.input} value={input} onChangeText={setInput}
          placeholder={busy ? "Coach is thinking…" : "Ask your coach"}
          placeholderTextColor={C.dim} editable={!busy} onSubmitEditing={send} returnKeyType="send"
        />
        <Pressable style={[s.send, busy && { opacity: 0.5 }]} onPress={send} disabled={busy}>
          <Text style={{ color: "#04140A", fontWeight: "800" }}>{busy ? "…" : "Send"}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  bubble: { maxWidth: "85%", borderRadius: 14, padding: 12 },
  user: { alignSelf: "flex-end", backgroundColor: C.accentDim },
  coach: { alignSelf: "flex-start", backgroundColor: C.card },
  bubbleText: { color: C.text, fontSize: 15, lineHeight: 21 },
  inputRow: { flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: C.card },
  input: { flex: 1, backgroundColor: C.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: C.text },
  send: { backgroundColor: C.accent, borderRadius: 12, paddingHorizontal: 18, justifyContent: "center" },
});
```

- [ ] **Step 3: Typecheck + commit**

```bash
cd app && npx tsc --noEmit
cd .. && git add app && git commit -m "feat(app): coach chat over /api/coach SSE"
```

### Task 14: Final verification sweep

- [ ] **Step 1: All test suites**

```bash
cd /home/user/thementalsport.com/app && npx tsc --noEmit && npm test
cd /home/user/thementalsport.com/mina && npx tsc --noEmit && npx vitest run
cd /home/user/thementalsport.com && npx tsx scripts/app-content/build-content.ts --check
```
Expected: all green.

- [ ] **Step 2: Bundle sanity (no emulator in this sandbox)**

```bash
cd /home/user/thementalsport.com/app && npx expo export --platform android
```
Expected: bundle builds without module-resolution errors (output in `app/dist/`, delete after: `rm -rf dist`).

- [ ] **Step 3: End-to-end coach smoke** — repeat Task 6 Step 3's curl against the dev server, confirm a real grounded reply mentions a protocol when asked "I choke under pressure, what should I do?" (requires a provider key in env; if none available in the sandbox, note it for the user — the deployed Vercel env has the keys).

- [ ] **Step 4: Commit any stragglers + push**

```bash
cd /home/user/thementalsport.com
git status --short
git add -A && git commit -m "chore: training app v1 finishing touches" || true
git push -u origin claude/sleepy-gauss-CyGUG
```

## Post-plan (explicitly NOT in this plan)

- EAS debug APK + Play Store submission (needs the user's Expo + Play accounts).
- `COACH_APP_TOKEN` + `EXPO_PUBLIC_COACH_URL` production values (user adds the Vercel env var; we bake the URL at build time).
- Voiceover engine upgrade plan (parked earlier, resumes after this ships).
