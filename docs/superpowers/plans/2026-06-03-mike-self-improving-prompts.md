# Mike Self-Improving Prompts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Mike propose additive, human-approved refinements to its own instructions that persist across turns and channels, fully gated by the existing write-approval flow.

**Architecture:** A Redis-backed "prompt addenda" layer (mirrors `lib/memory.ts`) stores learned guidance. Four new cross-cutting tools — `propose_prompt_improvement`, `revert_prompt_improvement`, `toggle_prompt_improvement` (writes, gated) and `list_prompt_improvements` (read) — let Mike manage addenda. The hub appends only *enabled* addenda for the active agent **after** the immutable base prompt, so learned guidance can add behavior but never override safety rules.

**Tech Stack:** TypeScript, Next.js, Upstash Redis (`@upstash/redis`), vitest. All work is under `mina/`.

**Reference patterns to mirror:** `mina/src/lib/memory.ts` (Redis store + pure helpers + graceful no-config degradation), the `forget` tool in `mina/src/lib/tools.ts:593` (a gated write tool with `summarize()`), and `MEMORY_TOOLS` in `mina/src/lib/agents.ts` (cross-cutting tools appended to every agent).

---

### Task 1: Prompt store (`promptStore.ts`)

**Files:**
- Create: `mina/src/lib/promptStore.ts`
- Test: `mina/src/lib/promptStore.test.ts`

- [ ] **Step 1: Write the failing test**

Create `mina/src/lib/promptStore.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  parseEntry,
  isValidTarget,
  activeForAgent,
  renderAddenda,
  MAX_ADDENDA,
  type PromptAddendum,
} from "./promptStore";

const make = (over: Partial<PromptAddendum>): PromptAddendum => ({
  id: "p_1",
  target: "global",
  text: "be concise",
  rationale: "user asked",
  enabled: true,
  createdAt: "2026-06-03T00:00:00.000Z",
  ...over,
});

describe("isValidTarget", () => {
  it("accepts global and every agent id", () => {
    for (const t of ["global", "inbox", "calendar", "workspace", "finance", "general"]) {
      expect(isValidTarget(t)).toBe(true);
    }
  });
  it("rejects unknown targets", () => {
    expect(isValidTarget("billing")).toBe(false);
    expect(isValidTarget("")).toBe(false);
  });
});

describe("parseEntry", () => {
  it("parses a JSON string entry", () => {
    const e = parseEntry(JSON.stringify(make({ id: "p_x", text: "hi" })));
    expect(e?.id).toBe("p_x");
    expect(e?.text).toBe("hi");
    expect(e?.enabled).toBe(true);
  });
  it("coerces an invalid target to global and missing enabled to true", () => {
    const e = parseEntry({ id: "p_y", target: "nope", text: "t", rationale: "r", createdAt: "x" });
    expect(e?.target).toBe("global");
    expect(e?.enabled).toBe(true);
  });
  it("returns null for junk", () => {
    expect(parseEntry(42)).toBeNull();
    expect(parseEntry("{not json")).toBeNull();
  });
});

describe("activeForAgent", () => {
  it("includes enabled global + enabled matching-agent, excludes disabled and other agents", () => {
    const all = [
      make({ id: "a", target: "global", enabled: true }),
      make({ id: "b", target: "inbox", enabled: true }),
      make({ id: "c", target: "inbox", enabled: false }),
      make({ id: "d", target: "finance", enabled: true }),
    ];
    const ids = activeForAgent(all, "inbox").map((a) => a.id);
    expect(ids).toEqual(["a", "b"]);
  });
});

describe("renderAddenda", () => {
  it("returns empty string when nothing active", () => {
    expect(renderAddenda([make({ enabled: false })], "general")).toBe("");
  });
  it("renders active addenda as bullet lines", () => {
    const out = renderAddenda([make({ text: "check timezones", target: "global" })], "calendar");
    expect(out).toContain("- check timezones");
    expect(out).toContain("Refinements you've learned");
  });
});

describe("MAX_ADDENDA", () => {
  it("is 20", () => {
    expect(MAX_ADDENDA).toBe(20);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mina && npx vitest run src/lib/promptStore.test.ts`
Expected: FAIL — cannot find module `./promptStore`.

- [ ] **Step 3: Write the implementation**

Create `mina/src/lib/promptStore.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd mina && npx vitest run src/lib/promptStore.test.ts`
Expected: PASS (all describe blocks green).

- [ ] **Step 5: Commit**

```bash
git add mina/src/lib/promptStore.ts mina/src/lib/promptStore.test.ts
git commit -m "feat(self-improve): add Redis-backed prompt addenda store"
```

---

### Task 2: The four self-improvement tools

**Files:**
- Modify: `mina/src/lib/tools.ts` (add import near line 16; add 4 tool objects to the `TOOLS` array, just after the `forget` tool ~line 620, before the Web section)
- Test: `mina/src/lib/tools.test.ts` (append cases)

- [ ] **Step 1: Write the failing test**

Append to `mina/src/lib/tools.test.ts`. First ensure `getTool` and `isWrite` are in the file's existing top-of-file import from `./tools` (add them to that import if missing — do NOT add a second import line). Then append:

```ts
describe("self-improvement tools", () => {
  it("registers all four tools", () => {
    expect(getTool("propose_prompt_improvement")).toBeDefined();
    expect(getTool("revert_prompt_improvement")).toBeDefined();
    expect(getTool("toggle_prompt_improvement")).toBeDefined();
    expect(getTool("list_prompt_improvements")).toBeDefined();
  });

  it("marks the three mutators as write-tier and the list as read", () => {
    expect(isWrite("propose_prompt_improvement")).toBe(true);
    expect(isWrite("revert_prompt_improvement")).toBe(true);
    expect(isWrite("toggle_prompt_improvement")).toBe(true);
    expect(isWrite("list_prompt_improvements")).toBe(false);
  });

  it("write tools provide an approval summary", () => {
    const s = getTool("propose_prompt_improvement")!.summarize!({
      target: "inbox",
      text: "always cc legal",
      rationale: "policy",
    });
    expect(s.title).toContain("inbox");
    expect(s.detail).toContain("always cc legal");
  });

  it("list_prompt_improvements runs read-only without a store and returns a shape", async () => {
    const out = await getTool("list_prompt_improvements")!.run({});
    expect(JSON.parse(out)).toHaveProperty("improvements");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mina && npx vitest run src/lib/tools.test.ts`
Expected: FAIL — `getTool("propose_prompt_improvement")` is undefined.

- [ ] **Step 3: Add the import**

In `mina/src/lib/tools.ts`, after the memory import (`import { memoryConfigured, ... } from "./memory";` ~line 16) add:

```ts
import {
  addAddendum,
  removeAddendum,
  setEnabled,
  listAddenda,
  isValidTarget,
  type AddendumTarget,
} from "./promptStore";
```

- [ ] **Step 4: Add the four tools**

In `mina/src/lib/tools.ts`, immediately after the `forget` tool object (which ends with its `summarize` closing `},` near line 620) and before the `// ---- Web ----` comment, insert:

```ts
  // ---- Self-improvement ---------------------------------------------------
  {
    name: "propose_prompt_improvement",
    description:
      "Propose an addition to your OWN instructions to permanently improve how you work (e.g. a recurring preference or correction the user gave you). WRITES to your persistent instructions, so it requires user approval. Additive only — you cannot edit or remove existing rules. `target` is 'global' or one specialist id: inbox, calendar, workspace, finance, general.",
    tier: "write",
    input_schema: {
      type: "object",
      properties: {
        target: { type: "string", description: "'global' or a specialist id." },
        text: { type: "string", description: "The guidance to append, phrased as an instruction." },
        rationale: { type: "string", description: "Why this helps — shown on the approval card." },
      },
      required: ["target", "text", "rationale"],
    },
    run: async (input) => {
      const rawTarget = str(input.target, "global");
      const target: AddendumTarget = isValidTarget(rawTarget) ? rawTarget : "global";
      const text = str(input.text);
      const rationale = str(input.rationale);
      if (!text) return JSON.stringify({ added: false, error: "Nothing to add." });
      const res = await addAddendum(target, text, rationale);
      return JSON.stringify(
        res.added
          ? { added: true, id: res.addendum?.id, target, text, note: "Added to your instructions." }
          : { added: false, error: res.error },
      );
    },
    summarize: (input) => ({
      title: `Teach myself (${str(input.target, "global")})`,
      detail: `${str(input.text)}\n\nWhy: ${str(input.rationale)}`,
    }),
  },
  {
    name: "revert_prompt_improvement",
    description:
      "Permanently delete one of your learned instruction addenda by id (get ids from list_prompt_improvements). WRITES, so it requires user approval.",
    tier: "write",
    input_schema: {
      type: "object",
      properties: { id: { type: "string", description: "The addendum id to delete." } },
      required: ["id"],
    },
    run: async (input) => {
      const id = str(input.id);
      const res = await removeAddendum(id);
      return JSON.stringify({ ...res, id, note: res.removed ? "Reverted." : "No such addendum." });
    },
    summarize: (input) => ({
      title: "Revert a learned instruction",
      detail: `Delete addendum id: ${str(input.id)}`,
    }),
  },
  {
    name: "toggle_prompt_improvement",
    description:
      "Enable or disable a learned instruction addendum by id without deleting it. WRITES, so it requires user approval.",
    tier: "write",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "The addendum id." },
        enabled: { type: "boolean", description: "true to enable, false to disable." },
      },
      required: ["id", "enabled"],
    },
    run: async (input) => {
      const id = str(input.id);
      const enabled = input.enabled !== false;
      const res = await setEnabled(id, enabled);
      return JSON.stringify({ ok: res.ok, id, enabled, note: res.ok ? "Updated." : "No such addendum." });
    },
    summarize: (input) => ({
      title: `${input.enabled !== false ? "Enable" : "Disable"} a learned instruction`,
      detail: `Addendum id: ${str(input.id)}`,
    }),
  },
  {
    name: "list_prompt_improvements",
    description:
      "List all your learned instruction addenda (id, target, text, rationale, enabled). Read-only. Use when the user asks what you've learned or taught yourself.",
    tier: "read",
    input_schema: { type: "object", properties: {} },
    run: async () => {
      const all = await listAddenda();
      return JSON.stringify({
        improvements: all.map((a) => ({
          id: a.id,
          target: a.target,
          text: a.text,
          rationale: a.rationale,
          enabled: a.enabled,
        })),
      });
    },
  },
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd mina && npx vitest run src/lib/tools.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add mina/src/lib/tools.ts mina/src/lib/tools.test.ts
git commit -m "feat(self-improve): add propose/revert/toggle/list prompt tools"
```

---

### Task 3: Make the tools cross-cutting (available to every agent)

**Files:**
- Modify: `mina/src/lib/agents.ts` (add a constant near `MEMORY_TOOLS`; extend the `Set` in `toolsForAgent`)
- Test: `mina/src/lib/agents.test.ts` (append cases)

- [ ] **Step 1: Write the failing test**

Append to `mina/src/lib/agents.test.ts`. Ensure `toolsForAgent` is in the file's existing top-of-file import from `./agents` (add it if missing — do NOT add a second import line). Then append:

```ts
describe("self-improvement tools are cross-cutting", () => {
  it("every agent can see all four self-improvement tools", () => {
    const names = ["propose_prompt_improvement", "revert_prompt_improvement", "toggle_prompt_improvement", "list_prompt_improvements"];
    for (const agent of ["inbox", "calendar", "workspace", "finance", "general"] as const) {
      const have = new Set(toolsForAgent(agent).map((t) => (t as { function: { name: string } }).function.name));
      for (const n of names) expect(have.has(n)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mina && npx vitest run src/lib/agents.test.ts`
Expected: FAIL — the tools are not in any agent's set.

- [ ] **Step 3: Implement**

In `mina/src/lib/agents.ts`, after the line `const MEMORY_TOOLS = ["remember", "recall", "forget"];` add:

```ts
const SELF_IMPROVE_TOOLS = [
  "propose_prompt_improvement",
  "revert_prompt_improvement",
  "toggle_prompt_improvement",
  "list_prompt_improvements",
];
```

Then change the `Set` line inside `toolsForAgent` from:

```ts
  const toolNames = new Set([...agent.toolNames, ...MEMORY_TOOLS]);
```

to:

```ts
  const toolNames = new Set([...agent.toolNames, ...MEMORY_TOOLS, ...SELF_IMPROVE_TOOLS]);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd mina && npx vitest run src/lib/agents.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add mina/src/lib/agents.ts mina/src/lib/agents.test.ts
git commit -m "feat(self-improve): expose self-improvement tools to every agent"
```

---

### Task 4: Inject approved addenda into the system prompt

**Files:**
- Modify: `mina/src/lib/brain.ts` (import `addendaBlock`; await it after `agentId` is resolved; append to the system prompt content near line 103)

- [ ] **Step 1: Add the import**

In `mina/src/lib/brain.ts`, after `import { memoryBlock } from "./memory";` add:

```ts
import { addendaBlock } from "./promptStore";
```

- [ ] **Step 2: Compute the block after the agent is known**

In `mina/src/lib/brain.ts`, just after the `const agent = AGENTS[agentId];` / `const tools = toolsForAgent(agentId);` lines (~line 97-98), add:

```ts
  const addBlock = await addendaBlock(agentId);
```

- [ ] **Step 3: Append it to the system prompt**

Change the system message content (~line 103) from:

```ts
      content: MINA_SYSTEM_PROMPT + nowLine + memBlock + agent.promptAddon,
```

to:

```ts
      content: MINA_SYSTEM_PROMPT + nowLine + memBlock + agent.promptAddon + addBlock,
```

- [ ] **Step 4: Typecheck and run the full suite**

Run: `cd mina && npx tsc --noEmit && npx vitest run`
Expected: tsc clean; all tests PASS (existing 51 + the new promptStore/tools/agents cases).

- [ ] **Step 5: Commit**

```bash
git add mina/src/lib/brain.ts
git commit -m "feat(self-improve): inject approved prompt addenda at the hub"
```

---

### Task 5: Full verification

- [ ] **Step 1: Run the whole suite + typecheck + lint**

Run: `cd mina && npx tsc --noEmit && npx vitest run && npx next lint`
Expected: tsc clean, all tests green, lint clean (or only pre-existing warnings).

- [ ] **Step 2: Confirm the safety invariant by reading `brain.ts`**

Verify by inspection that `addBlock` is concatenated **after** `MINA_SYSTEM_PROMPT` (the base + safety rules come first; learned addenda are appended last and can only add text). No code change if correct.

- [ ] **Step 3: Push the branch**

```bash
git push -u origin claude/beautiful-hopper-oem0E
```

---

## Notes for the implementer

- **No new types file changes needed.** `AddendumTarget` lives in `promptStore.ts`; `AgentId` is reused from `types.ts`.
- **Graceful degradation:** with no Redis env vars, `addAddendum` returns a stub success, list/block return empty — same pattern as `memory.ts`. The app must keep working without a store.
- **Approval resume:** these write tools are cross-cutting (not in any agent's `toolNames`), so `getAgentForTool` returns `"general"` on an approval re-run — correct and harmless, because persisting an addendum is agent-independent.
- **Safety invariant (do not violate):** addenda are only ever *appended* after the base prompt. Never add an API that edits or removes the base prompt, and never move `addBlock` before `MINA_SYSTEM_PROMPT`.
