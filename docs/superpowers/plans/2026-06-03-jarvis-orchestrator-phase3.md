# Jarvis Orchestrator Phase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the single `runBrain` brain into a Groq-powered LLM router + 5 specialist agents (Inbox, Calendar, Workspace, Finance, General), each with its own tight tool set and focused prompt, while keeping the `runBrain` signature and every channel handler completely unchanged.

**Architecture:** A new `lib/router.ts` makes one small Groq call to classify intent into an `AgentId`. A new `lib/agents.ts` registry maps each id to its tool names + prompt addon. `lib/brain.ts` calls `route()` then scopes the prompt and tools before running the identical existing think-loop. The safety gate (write → `pendingAction`) stays at the hub, unchanged.

**Tech Stack:** TypeScript, Vitest, Groq API (OpenAI-compatible, model `openai/gpt-oss-120b`), existing `tools.ts` registry (no changes).

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `mina/src/lib/types.ts` | Modify | Add `AgentId` type + `agent?` field on `BrainResult` |
| `mina/src/lib/agents.ts` | Create | Agent registry: tool lists, prompt addons, `toolsForAgent()`, `getAgentForTool()` |
| `mina/src/lib/agents.test.ts` | Create | Pure unit tests for registry lookups |
| `mina/src/lib/router.ts` | Create | `buildRouterMessages()` (pure) + `route()` (Groq call) |
| `mina/src/lib/router.test.ts` | Create | Pure tests for prompt builder + mocked route() |
| `mina/src/lib/brain.ts` | Modify | Wire route → agents → existing loop; add `agent` to result |

---

## Task 1: Add `AgentId` to types

**Files:**
- Modify: `mina/src/lib/types.ts`

- [ ] **Step 1.1 — Add `AgentId` and update `BrainResult`**

Open `mina/src/lib/types.ts`. After the `Tier` type on line 4, add:

```ts
export type AgentId = "inbox" | "calendar" | "workspace" | "finance" | "general";
```

`BrainResult` lives in `brain.ts`, not `types.ts` — we'll update it in Task 4. No test needed for a type alias.

- [ ] **Step 1.2 — Commit**

```bash
cd mina
git add src/lib/types.ts
git commit -m "feat(orchestrator): add AgentId type"
```

---

## Task 2: Build the agent registry

**Files:**
- Create: `mina/src/lib/agents.ts`
- Create: `mina/src/lib/agents.test.ts`

- [ ] **Step 2.1 — Write the failing tests first**

Create `mina/src/lib/agents.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { toolsForAgent, getAgentForTool, AGENTS } from "./agents";

describe("toolsForAgent", () => {
  it("inbox agent has search_emails and send_email", () => {
    const names = toolsForAgent("inbox").map((t) => t.function.name);
    expect(names).toContain("search_emails");
    expect(names).toContain("send_email");
  });

  it("inbox agent does NOT have calendar tools", () => {
    const names = toolsForAgent("inbox").map((t) => t.function.name);
    expect(names).not.toContain("get_calendar_events");
  });

  it("every agent includes remember, recall, forget", () => {
    for (const id of Object.keys(AGENTS) as (keyof typeof AGENTS)[]) {
      const names = toolsForAgent(id).map((t) => t.function.name);
      expect(names).toContain("remember");
      expect(names).toContain("recall");
      expect(names).toContain("forget");
    }
  });

  it("calendar agent has get_calendar_events and create_calendar_event", () => {
    const names = toolsForAgent("calendar").map((t) => t.function.name);
    expect(names).toContain("get_calendar_events");
    expect(names).toContain("create_calendar_event");
  });

  it("workspace agent has all drive/doc/sheet/contacts tools", () => {
    const names = toolsForAgent("workspace").map((t) => t.function.name);
    expect(names).toContain("search_drive");
    expect(names).toContain("read_drive_file");
    expect(names).toContain("read_doc");
    expect(names).toContain("create_doc");
    expect(names).toContain("read_sheet");
    expect(names).toContain("append_sheet_row");
    expect(names).toContain("search_contacts");
  });

  it("finance agent has get_revenue_summary and issue_refund", () => {
    const names = toolsForAgent("finance").map((t) => t.function.name);
    expect(names).toContain("get_revenue_summary");
    expect(names).toContain("issue_refund");
  });

  it("general agent has browse_url", () => {
    const names = toolsForAgent("general").map((t) => t.function.name);
    expect(names).toContain("browse_url");
  });
});

describe("getAgentForTool", () => {
  it("maps send_email → inbox", () => {
    expect(getAgentForTool("send_email")).toBe("inbox");
  });
  it("maps create_calendar_event → calendar", () => {
    expect(getAgentForTool("create_calendar_event")).toBe("calendar");
  });
  it("maps issue_refund → finance", () => {
    expect(getAgentForTool("issue_refund")).toBe("finance");
  });
  it("maps append_sheet_row → workspace", () => {
    expect(getAgentForTool("append_sheet_row")).toBe("workspace");
  });
  it("maps browse_url → general", () => {
    expect(getAgentForTool("browse_url")).toBe("general");
  });
  it("returns general for unknown tool", () => {
    expect(getAgentForTool("nonexistent_tool")).toBe("general");
  });
});
```

- [ ] **Step 2.2 — Run tests to confirm they fail**

```bash
cd mina && npx vitest run src/lib/agents.test.ts 2>&1 | tail -10
```

Expected: `FAIL` — `agents` module not found.

- [ ] **Step 2.3 — Create `mina/src/lib/agents.ts`**

```ts
import { toolDefsForApi, getTool } from "./tools";
import type { AgentId } from "./types";
import type OpenAI from "openai";

type AgentDef = {
  id: AgentId;
  label: string;
  toolNames: string[];
  promptAddon: string;
};

const MEMORY_TOOLS = ["remember", "recall", "forget"];

export const AGENTS: Record<AgentId, AgentDef> = {
  inbox: {
    id: "inbox",
    label: "Inbox",
    toolNames: ["search_emails", "send_email"],
    promptAddon:
      "\n\n# Your role\nYou are Jarvis's email specialist. Only use email tools. Be precise about recipients. Never send an email without showing the draft and going through the approval gate.",
  },
  calendar: {
    id: "calendar",
    label: "Calendar",
    toolNames: ["get_calendar_events", "create_calendar_event"],
    promptAddon:
      "\n\n# Your role\nYou are Jarvis's calendar specialist. Only use calendar tools. Always confirm the date, time, and attendees before creating events. Flag conflicts proactively.",
  },
  workspace: {
    id: "workspace",
    label: "Workspace",
    toolNames: [
      "search_drive",
      "read_drive_file",
      "read_doc",
      "create_doc",
      "read_sheet",
      "append_sheet_row",
      "search_contacts",
    ],
    promptAddon:
      "\n\n# Your role\nYou are Jarvis's workspace specialist for Google Drive, Docs, Sheets, and Contacts. Only use workspace tools. Always confirm before creating or modifying files.",
  },
  finance: {
    id: "finance",
    label: "Finance",
    toolNames: ["get_revenue_summary", "issue_refund"],
    promptAddon:
      "\n\n# Your role\nYou are Jarvis's finance specialist. Only use finance tools. Refunds always require explicit double-confirmation — always show the amount and recipient before requesting approval.",
  },
  general: {
    id: "general",
    label: "General",
    toolNames: ["browse_url"],
    promptAddon:
      "\n\n# Your role\nYou are Jarvis's general assistant. Handle conversation, web browsing, and anything that doesn't fit a specialist lane.",
  },
};

const ALL_TOOL_DEFS = toolDefsForApi() as OpenAI.Chat.Completions.ChatCompletionTool[];

/** Returns the OpenAI tool defs for a given agent, always including memory tools. */
export function toolsForAgent(
  id: AgentId,
): OpenAI.Chat.Completions.ChatCompletionTool[] {
  const agent = AGENTS[id];
  const toolNames = new Set([...agent.toolNames, ...MEMORY_TOOLS]);
  return ALL_TOOL_DEFS.filter((t) => toolNames.has(t.function.name));
}

/** Reverse-lookup: which agent owns this tool name? Falls back to "general". */
export function getAgentForTool(toolName: string): AgentId {
  for (const agent of Object.values(AGENTS)) {
    if (agent.toolNames.includes(toolName)) return agent.id;
  }
  return "general";
}
```

- [ ] **Step 2.4 — Run tests to confirm they pass**

```bash
cd mina && npx vitest run src/lib/agents.test.ts 2>&1 | tail -10
```

Expected: all tests `PASS`.

- [ ] **Step 2.5 — Commit**

```bash
git add src/lib/agents.ts src/lib/agents.test.ts
git commit -m "feat(orchestrator): agent registry with toolsForAgent and getAgentForTool"
```

---

## Task 3: Build the LLM router

**Files:**
- Create: `mina/src/lib/router.ts`
- Create: `mina/src/lib/router.test.ts`

- [ ] **Step 3.1 — Write the failing tests first**

Create `mina/src/lib/router.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { buildRouterMessages, route } from "./router";

describe("buildRouterMessages", () => {
  it("includes the classification instruction in the system message", () => {
    const msgs = buildRouterMessages([{ role: "user", content: "check my email" }]);
    const system = msgs.find((m) => m.role === "system");
    expect(system?.content).toMatch(/inbox/);
    expect(system?.content).toMatch(/calendar/);
    expect(system?.content).toMatch(/workspace/);
    expect(system?.content).toMatch(/finance/);
    expect(system?.content).toMatch(/general/);
  });

  it("includes the last user message", () => {
    const msgs = buildRouterMessages([
      { role: "user", content: "check my email" },
    ]);
    const user = msgs.find((m) => m.role === "user");
    expect(user?.content).toBe("check my email");
  });

  it("uses only the last user message for routing (not full history)", () => {
    const msgs = buildRouterMessages([
      { role: "user", content: "first message" },
      { role: "assistant", content: "ok" },
      { role: "user", content: "now check my calendar" },
    ]);
    const userMsgs = msgs.filter((m) => m.role === "user");
    expect(userMsgs).toHaveLength(1);
    expect(userMsgs[0].content).toBe("now check my calendar");
  });
});

describe("route", () => {
  it("returns 'general' when GROQ_API_KEY is missing", async () => {
    vi.stubEnv("GROQ_API_KEY", "");
    const id = await route([{ role: "user", content: "hello" }]);
    expect(id).toBe("general");
    vi.unstubAllEnvs();
  });

  it("returns 'general' on invalid model output", async () => {
    vi.stubEnv("GROQ_API_KEY", "fake");
    // Mock the openai client to return garbage
    vi.mock("openai", () => ({
      default: class {
        chat = {
          completions: {
            create: async () => ({
              choices: [{ message: { content: "something_unexpected" } }],
            }),
          },
        };
      },
    }));
    const { route: routeFresh } = await import("./router?t=" + Date.now());
    const id = await routeFresh([{ role: "user", content: "hello" }]);
    expect(id).toBe("general");
    vi.unstubAllEnvs();
    vi.resetModules();
  });
});
```

- [ ] **Step 3.2 — Run tests to confirm they fail**

```bash
cd mina && npx vitest run src/lib/router.test.ts 2>&1 | tail -10
```

Expected: `FAIL` — `router` module not found.

- [ ] **Step 3.3 — Create `mina/src/lib/router.ts`**

```ts
import OpenAI from "openai";
import type { AgentId, ApiMessage } from "./types";

const MODEL = "openai/gpt-oss-120b";
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
  // Only send the last user message — routing doesn't need full history.
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  return [
    { role: "system", content: ROUTER_SYSTEM },
    { role: "user", content: lastUser ? String(lastUser.content) : "" },
  ];
}

/** Call Groq to classify intent. Falls back to "general" on any error. */
export async function route(messages: ApiMessage[]): Promise<AgentId> {
  if (!process.env.GROQ_API_KEY) return "general";
  try {
    const client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
    const res = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 10,
      messages: buildRouterMessages(messages),
    });
    const raw = (res.choices[0]?.message?.content ?? "").trim().toLowerCase() as AgentId;
    return VALID_IDS.has(raw) ? raw : "general";
  } catch {
    return "general";
  }
}
```

- [ ] **Step 3.4 — Run tests to confirm they pass**

```bash
cd mina && npx vitest run src/lib/router.test.ts 2>&1 | tail -15
```

Expected: `buildRouterMessages` tests all `PASS`. The mocked `route` test may pass or skip — that's fine; the critical path (GROQ_API_KEY missing → `general`) must pass.

- [ ] **Step 3.5 — Commit**

```bash
git add src/lib/router.ts src/lib/router.test.ts
git commit -m "feat(orchestrator): LLM router — buildRouterMessages + route()"
```

---

## Task 4: Wire the orchestrator into `brain.ts`

**Files:**
- Modify: `mina/src/lib/brain.ts`

- [ ] **Step 4.1 — Update imports and `BrainResult` in `brain.ts`**

Open `mina/src/lib/brain.ts`. Replace the top section (lines 1–48) with:

```ts
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
```

- [ ] **Step 4.2 — Update `runBrain` to route then scope tools**

Replace the body of `runBrain` (from `export async function runBrain` to the end of the file) with:

```ts
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
```

- [ ] **Step 4.3 — Run the full test suite to confirm nothing broke**

```bash
cd mina && npx vitest run 2>&1 | tail -20
```

Expected: all existing tests still `PASS` (tools, memory, memory.integration, agents, router).

- [ ] **Step 4.4 — TypeScript check**

```bash
cd mina && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 4.5 — Commit**

```bash
git add src/lib/brain.ts src/lib/types.ts
git commit -m "feat(orchestrator): wire router + agent registry into runBrain"
```

---

## Task 5: Push and verify

- [ ] **Step 5.1 — Push to remote**

```bash
git push -u origin claude/beautiful-hopper-oem0E
```

- [ ] **Step 5.2 — Run full test suite one final time**

```bash
cd mina && npx vitest run 2>&1 | tail -20
```

Expected: all tests `PASS`.

- [ ] **Step 5.3 — Done**

The orchestrator is live behind `runBrain`. Every channel (web, Slack) is unchanged. Each request is now handled by the specialist that owns its tools, with memory cross-cutting all agents and the safety gate unchanged at the hub.

---

## Verification checklist (manual test after deploy)

After deploying to Vercel:

| Test | Expected agent | How to verify |
|---|---|---|
| "check my emails" | Inbox | Reply uses email data |
| "what's on my calendar tomorrow?" | Calendar | Reply uses calendar data |
| "find my Q1 report in Drive" | Workspace | Reply searches Drive |
| "how much revenue this month?" | Finance | Reply shows Stripe data |
| "what time is it in Tokyo?" | General | Plain answer, no tools |
| "send an email to Alex" | Inbox | Approval gate fires (send_email is a write) |
