# Mike Skills System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Mike the ability to create, store, and automatically use named skills — reusable instruction sets stored in Upstash Redis, injected into every system prompt, with full CRUD tools and a Sidebar panel.

**Architecture:** `skills.ts` mirrors `memory.ts` exactly (Upstash Redis list `mike:skills`). Three tools (`create_skill`, `list_skills`, `delete_skill`) follow the exact same tier/approval pattern as memory tools. `brain.ts` injects a `skillsBlock` into the system prompt alongside `memBlock`. The Sidebar gains a SKILLS panel mirroring MEMORY BANK.

**Tech Stack:** TypeScript, Upstash Redis (`@upstash/redis` — already installed), Next.js App Router, React, Tailwind CSS.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `mina/src/lib/skills.ts` | **Create** | Redis CRUD + prompt block for skills |
| `mina/src/app/api/skills/route.ts` | **Create** | GET /api/skills |
| `mina/src/app/api/skills/[id]/route.ts` | **Create** | DELETE /api/skills/:id |
| `mina/src/lib/tools.ts` | **Modify** | Add create_skill, list_skills, delete_skill tools |
| `mina/src/lib/agents.ts` | **Modify** | Add skill tools to the shared tool list (like MEMORY_TOOLS) |
| `mina/src/lib/brain.ts` | **Modify** | Import + inject skillsBlock into system prompt |
| `mina/src/components/Sidebar.tsx` | **Modify** | Add SKILLS panel |

---

## Task 1: Create `skills.ts` — Redis CRUD + prompt block

**Files:**
- Create: `mina/src/lib/skills.ts`

- [ ] **Step 1: Create the file**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /home/user/thementalsport.com/mina && npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add mina/src/lib/skills.ts
git commit -m "feat(skills): add Redis-backed skill store with prompt injection"
```

---

## Task 2: Add API routes for skills

**Files:**
- Create: `mina/src/app/api/skills/route.ts`
- Create: `mina/src/app/api/skills/[id]/route.ts`

- [ ] **Step 1: Create GET route**

```typescript
// mina/src/app/api/skills/route.ts
import { listSkills } from "@/lib/skills";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const skills = await listSkills(50);
  return Response.json({ skills });
}
```

- [ ] **Step 2: Create DELETE route**

```typescript
// mina/src/app/api/skills/[id]/route.ts
import { deleteSkill } from "@/lib/skills";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await deleteSkill(id);
  return Response.json(result);
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /home/user/thementalsport.com/mina && npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add mina/src/app/api/skills/route.ts mina/src/app/api/skills/\[id\]/route.ts
git commit -m "feat(skills): add GET /api/skills and DELETE /api/skills/:id routes"
```

---

## Task 3: Add skill tools to `tools.ts`

**Files:**
- Modify: `mina/src/lib/tools.ts`

- [ ] **Step 1: Add imports at top of tools.ts**

Find the import block at the top of `mina/src/lib/tools.ts`. After the existing imports, add:

```typescript
import { skillsConfigured, addSkill, listSkills, deleteSkill } from "./skills";
```

- [ ] **Step 2: Add the three skill tools**

Find the end of the tools array (look for the closing `];` of the tools list). Add three new tool definitions **before** that closing bracket. The tools follow the exact same pattern as `remember`, `recall`, and `forget`:

```typescript
  {
    name: "create_skill",
    description:
      "Save a new named skill — a reusable instruction set you will apply automatically whenever relevant. WRITES to your skill store, so it requires user approval. Use when the user teaches you a repeatable process, preference, or approach they want you to always follow.",
    tier: "write" as Tier,
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Short name for the skill (e.g. 'Email tone', 'Weekly review format')." },
        description: { type: "string", description: "One-line summary shown in the UI." },
        content: { type: "string", description: "Full markdown instructions — what to do and how." },
      },
      required: ["name", "description", "content"],
    },
    run: async (input) => {
      const name = str(input.name);
      const description = str(input.description);
      const content = str(input.content);
      if (!name || !content) return JSON.stringify({ added: false, error: "name and content are required." });
      if (!skillsConfigured()) return JSON.stringify({ added: false, error: "Skill store not configured." });
      const skill = await addSkill(name, description, content);
      return JSON.stringify({ added: true, id: skill.id, name: skill.name });
    },
    summarize: (input) => ({
      title: `New skill: ${str(input.name)}`,
      detail: `${str(input.description)}\n\n${str(input.content)}`,
    }),
  },
  {
    name: "list_skills",
    description:
      "List all your saved skills (id, name, description). Read-only. Use when the user asks what skills you have.",
    tier: "read" as Tier,
    input_schema: { type: "object" as const, properties: {}, required: [] },
    run: async () => {
      if (!skillsConfigured()) return JSON.stringify({ skills: [], note: "Skill store not configured." });
      const skills = await listSkills(50);
      return JSON.stringify({ skills: skills.map((s) => ({ id: s.id, name: s.name, description: s.description })) });
    },
  },
  {
    name: "delete_skill",
    description:
      "Permanently delete a saved skill by id. Get ids from list_skills. WRITES, so it requires user approval.",
    tier: "write" as Tier,
    input_schema: {
      type: "object" as const,
      properties: { id: { type: "string", description: "The skill id to delete." } },
      required: ["id"],
    },
    run: async (input) => {
      const id = str(input.id);
      if (!skillsConfigured()) return JSON.stringify({ deleted: false, error: "Skill store not configured." });
      const result = await deleteSkill(id);
      return JSON.stringify({ ...result, id });
    },
    summarize: (input) => ({
      title: "Delete a skill",
      detail: `Delete skill id: ${str(input.id)}`,
    }),
  },
```

**Note:** `str` is already defined in `tools.ts` as a helper to coerce `unknown` to `string`. Check the file for its exact definition before adding the tools — use it exactly as other tools do.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /home/user/thementalsport.com/mina && npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add mina/src/lib/tools.ts
git commit -m "feat(skills): add create_skill, list_skills, delete_skill tools"
```

---

## Task 4: Expose skill tools to all agents

**Files:**
- Modify: `mina/src/lib/agents.ts`

- [ ] **Step 1: Add skill tools to the shared constant**

In `mina/src/lib/agents.ts`, find this existing constant:

```typescript
const MEMORY_TOOLS = ["remember", "recall", "forget"];
```

Add a `SKILL_TOOLS` constant immediately after it:

```typescript
const SKILL_TOOLS = ["create_skill", "list_skills", "delete_skill"];
```

- [ ] **Step 2: Include SKILL_TOOLS in toolsForAgent**

Find the `toolsForAgent` function. It currently spreads `MEMORY_TOOLS` and `SELF_IMPROVE_TOOLS`. Add `SKILL_TOOLS` to the same spread:

```typescript
export function toolsForAgent(
  id: AgentId,
): OpenAI.Chat.Completions.ChatCompletionTool[] {
  const agent = AGENTS[id];
  const toolNames = new Set([...agent.toolNames, ...MEMORY_TOOLS, ...SKILL_TOOLS, ...SELF_IMPROVE_TOOLS]);
  return ALL_TOOL_DEFS.filter((t) => toolNames.has((t as { function: { name: string } }).function.name));
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /home/user/thementalsport.com/mina && npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add mina/src/lib/agents.ts
git commit -m "feat(skills): expose skill tools to all agents"
```

---

## Task 5: Inject skills into system prompt

**Files:**
- Modify: `mina/src/lib/brain.ts`

- [ ] **Step 1: Add import**

In `mina/src/lib/brain.ts`, find the existing imports at the top. Add `skillsBlock` to the skills import (add a new import line after the memory import):

```typescript
import { skillsBlock } from "./skills";
```

- [ ] **Step 2: Fetch the skills block alongside memBlock**

Find these two lines in `runBrain()`:

```typescript
  const nowLine = `\n\nCurrent date and time: ${new Date().toString()}.`;
  const memBlock = await memoryBlock();
```

Change them to fetch skills in parallel for performance:

```typescript
  const nowLine = `\n\nCurrent date and time: ${new Date().toString()}.`;
  const [memBlock, skillBlock] = await Promise.all([memoryBlock(), skillsBlock()]);
```

- [ ] **Step 3: Inject skillBlock into the system prompt**

Find the system message construction (it currently ends with `addBlock`):

```typescript
      content: MINA_SYSTEM_PROMPT + nowLine + memBlock + agent.promptAddon + addBlock,
```

Add `skillBlock` after `memBlock`:

```typescript
      content: MINA_SYSTEM_PROMPT + nowLine + memBlock + skillBlock + agent.promptAddon + addBlock,
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /home/user/thementalsport.com/mina && npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add mina/src/lib/brain.ts
git commit -m "feat(skills): inject skills block into system prompt alongside memories"
```

---

## Task 6: Add SKILLS panel to Sidebar

**Files:**
- Modify: `mina/src/components/Sidebar.tsx`

- [ ] **Step 1: Add Skill type import and state**

In `mina/src/components/Sidebar.tsx`, find the existing imports at the top:

```typescript
import type { Memory } from "@/lib/memory";
import type { PromptAddendum } from "@/lib/promptStore";
```

Add the Skill type import:

```typescript
import type { Skill } from "@/lib/skills";
```

- [ ] **Step 2: Add skills state**

Find the existing state declarations inside the `Sidebar` component:

```typescript
  const [memories, setMemories] = useState<Memory[]>([]);
  const [addenda, setAddenda] = useState<PromptAddendum[]>([]);
```

Add skills state below:

```typescript
  const [skills, setSkills] = useState<Skill[]>([]);
```

- [ ] **Step 3: Fetch skills in fetchAll**

Find the `fetchAll` function — it currently fetches `/api/memory` and `/api/addenda`. Add `/api/skills`:

```typescript
  const fetchAll = useCallback(async () => {
    const [memRes, addRes, skillRes] = await Promise.all([
      fetch("/api/memory"),
      fetch("/api/addenda"),
      fetch("/api/skills"),
    ]);
    if (memRes.ok) {
      const d = (await memRes.json()) as { memories: Memory[] };
      setMemories(d.memories);
    }
    if (addRes.ok) {
      const d = (await addRes.json()) as { addenda: PromptAddendum[] };
      setAddenda(d.addenda);
    }
    if (skillRes.ok) {
      const d = (await skillRes.json()) as { skills: Skill[] };
      setSkills(d.skills);
    }
  }, []);
```

- [ ] **Step 4: Add deleteSkill handler**

Find the existing `deleteMemory` handler. Add a `deleteSkill` handler directly below it:

```typescript
  const deleteSkill = async (id: string) => {
    await fetch(`/api/skills/${id}`, { method: "DELETE" });
    setSkills((s) => s.filter((x) => x.id !== id));
  };
```

- [ ] **Step 5: Add SKILLS panel in JSX**

Find the closing `</div>` of the Sidebar's return statement (just before the outer closing `</div>`). Add the SKILLS panel **between** the MEMORY BANK panel and the DIRECTIVES panel:

```tsx
      {/* Skills */}
      <div className="hud-panel rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="hud-label">SKILLS</p>
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{
              background: "rgba(0,212,255,0.1)",
              color: "#00d4ff",
              border: "1px solid rgba(0,212,255,0.2)",
            }}
          >
            {skills.length} LOADED
          </span>
        </div>
        {skills.length === 0 ? (
          <p className="text-[10px] text-mina-muted font-mono italic">// NO SKILLS</p>
        ) : (
          <ul className="space-y-1.5">
            {skills.map((s) => (
              <li
                key={s.id}
                className="group rounded p-2"
                style={{
                  background: "rgba(170,136,255,0.05)",
                  border: "1px solid rgba(170,136,255,0.15)",
                }}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold tracking-widest font-mono" style={{ color: "#aa88ff" }}>
                      {s.name.toUpperCase()}
                    </p>
                    <p className="text-[10px] text-mina-muted font-mono mt-0.5 line-clamp-1">{s.description}</p>
                  </div>
                  <button
                    onClick={() => void deleteSkill(s.id)}
                    className="shrink-0 text-[10px] text-mina-muted opacity-0 group-hover:opacity-100 hover:text-mina-danger transition"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd /home/user/thementalsport.com/mina && npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 7: Build to confirm no errors**

```bash
cd /home/user/thementalsport.com/mina && npm run build 2>&1 | tail -15
```
Expected: clean build, all routes listed.

- [ ] **Step 8: Commit**

```bash
git add mina/src/components/Sidebar.tsx
git commit -m "feat(skills): add SKILLS panel to Sidebar with delete support"
```

---

## Task 7: Push and deploy

- [ ] **Step 1: Push to master**

```bash
git push origin master
```

- [ ] **Step 2: Verify push succeeded**

```bash
git log --oneline origin/master -5
```
Expected: your skill commits appear at the top.
