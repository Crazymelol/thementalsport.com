# Dashboard UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a live sidebar to Mike's web UI showing the active specialist agent, stored memories (with delete), and prompt addenda (with toggle + delete), in a two-column desktop layout with a mobile overlay toggle.

**Architecture:** New GET/DELETE/PATCH API routes expose existing server-side `listMemories`, `deleteMemory`, `listAddenda`, `setEnabled`, `removeAddendum` functions to the browser. A new `Sidebar` component polls those routes and re-fetches after every turn. `page.tsx` layout shifts from a centered single column to a two-column flex row; agent state is fed from a new `agent` SSE event emitted by `/api/chat`.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS (mina-* design tokens), React 19 hooks, existing vitest test suite.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `mina/src/lib/types.ts` | Add `agent` SSE event type |
| Modify | `mina/src/app/api/chat/route.ts` | Emit `agent` event after brain returns |
| Create | `mina/src/app/api/memory/route.ts` | `GET /api/memory` |
| Create | `mina/src/app/api/memory/[id]/route.ts` | `DELETE /api/memory/[id]` |
| Create | `mina/src/app/api/addenda/route.ts` | `GET /api/addenda` |
| Create | `mina/src/app/api/addenda/[id]/route.ts` | `PATCH /api/addenda/[id]` + `DELETE /api/addenda/[id]` |
| Create | `mina/src/components/Sidebar.tsx` | Sidebar UI — agent, memory, addenda panels |
| Modify | `mina/src/app/page.tsx` | Two-column layout, agent state, sidebar refresh trigger |

---

## Task 1: Add `agent` SSE event to types

**Files:**
- Modify: `mina/src/lib/types.ts`

- [ ] **Add the event union member**

Open `mina/src/lib/types.ts`. The `ServerEvent` union currently ends with `| { type: "error"; message: string }`. Add one more member:

```ts
export type ServerEvent =
  | { type: "delta"; text: string }
  | { type: "assistant"; message: ApiMessage }
  | { type: "tool_result"; messages: ApiMessage[] }
  | { type: "tool_card"; toolName: string; data: unknown }
  | { type: "action_required"; actions: ActionProposal[] }
  | { type: "agent"; agentId: AgentId }
  | { type: "done" }
  | { type: "error"; message: string };
```

- [ ] **Verify tsc**

```bash
cd mina && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(dashboard): add agent SSE event type"
```

---

## Task 2: Emit `agent` event from `/api/chat`

**Files:**
- Modify: `mina/src/app/api/chat/route.ts`

- [ ] **Emit after brain returns**

In the `try` block inside `start(controller)`, after `const result = await runBrain(...)` and before `if (result.error)`, add:

```ts
if (result.agent) {
  send({ type: "agent", agentId: result.agent });
}
```

The full `try` block should look like:

```ts
try {
  const result = await runBrain({
    messages: trimHistory(body.messages),
    decisions: body.decisions,
  });

  if (result.agent) {
    send({ type: "agent", agentId: result.agent });
  }

  if (result.error) {
    send({ type: "error", message: result.error });
    send({ type: "done" });
    controller.close();
    return;
  }

  // Emit tool cards.
  for (const card of result.cards) {
    send({ type: "tool_card", toolName: card.toolName, data: card.data });
  }

  // Emit the assistant message and text delta (web app shows both).
  const lastMsg = result.messages[result.messages.length - 1];
  if (lastMsg?.role === "assistant") {
    send({ type: "assistant", message: lastMsg });
    if (result.text) send({ type: "delta", text: result.text });
  }

  // If a write action needs approval, send the gate event.
  if (result.pendingActions && result.pendingActions.length > 0) {
    send({ type: "tool_result", messages: result.messages });
    send({ type: "action_required", actions: result.pendingActions });
  }

  send({ type: "done" });
} catch (err) {
  send({
    type: "error",
    message: err instanceof Error ? err.message : "Something went wrong.",
  });
  send({ type: "done" });
} finally {
  controller.close();
}
```

- [ ] **Verify tsc**

```bash
cd mina && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat(dashboard): emit agent SSE event from chat route"
```

---

## Task 3: `GET /api/memory`

**Files:**
- Create: `mina/src/app/api/memory/route.ts`

- [ ] **Write the route**

```ts
import { listMemories } from "@/lib/memory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const memories = await listMemories(50);
  return Response.json({ memories });
}
```

- [ ] **Verify tsc**

```bash
cd mina && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Commit**

```bash
git add src/app/api/memory/route.ts
git commit -m "feat(dashboard): GET /api/memory route"
```

---

## Task 4: `DELETE /api/memory/[id]`

**Files:**
- Create: `mina/src/app/api/memory/[id]/route.ts`

- [ ] **Write the route**

```ts
import { deleteMemory } from "@/lib/memory";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await deleteMemory(id);
  return Response.json(result);
}
```

- [ ] **Verify tsc**

```bash
cd mina && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Commit**

```bash
git add src/app/api/memory/[id]/route.ts
git commit -m "feat(dashboard): DELETE /api/memory/[id] route"
```

---

## Task 5: `GET /api/addenda`

**Files:**
- Create: `mina/src/app/api/addenda/route.ts`

- [ ] **Write the route**

```ts
import { listAddenda } from "@/lib/promptStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const addenda = await listAddenda();
  return Response.json({ addenda });
}
```

- [ ] **Verify tsc**

```bash
cd mina && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Commit**

```bash
git add src/app/api/addenda/route.ts
git commit -m "feat(dashboard): GET /api/addenda route"
```

---

## Task 6: `PATCH` and `DELETE /api/addenda/[id]`

**Files:**
- Create: `mina/src/app/api/addenda/[id]/route.ts`

- [ ] **Write the route**

```ts
import { setEnabled, removeAddendum } from "@/lib/promptStore";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as { enabled: boolean };
  const result = await setEnabled(id, body.enabled);
  return Response.json(result);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await removeAddendum(id);
  return Response.json(result);
}
```

- [ ] **Verify tsc**

```bash
cd mina && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Commit**

```bash
git add src/app/api/addenda/[id]/route.ts
git commit -m "feat(dashboard): PATCH+DELETE /api/addenda/[id] routes"
```

---

## Task 7: `Sidebar` component

**Files:**
- Create: `mina/src/components/Sidebar.tsx`

This is the main new UI component. It receives `agentId` (last active agent or null), a `refreshKey` number (incremented after each turn to trigger re-fetch), and an `onClose` callback for the mobile overlay.

- [ ] **Write the component**

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import type { AgentId } from "@/lib/types";
import type { Memory } from "@/lib/memory";
import type { PromptAddendum } from "@/lib/promptStore";

const AGENT_META: Record<AgentId, { label: string; icon: string }> = {
  inbox:     { label: "Inbox",     icon: "✉️" },
  calendar:  { label: "Calendar",  icon: "📅" },
  workspace: { label: "Workspace", icon: "📁" },
  finance:   { label: "Finance",   icon: "💳" },
  general:   { label: "General",   icon: "🤖" },
};

const TARGET_LABEL: Record<string, string> = {
  global:    "All agents",
  inbox:     "Inbox",
  calendar:  "Calendar",
  workspace: "Workspace",
  finance:   "Finance",
  general:   "General",
};

type Props = {
  agentId: AgentId | null;
  refreshKey: number;
  onClose?: () => void;
};

export default function Sidebar({ agentId, refreshKey, onClose }: Props) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [addenda, setAddenda] = useState<PromptAddendum[]>([]);

  const fetchAll = useCallback(async () => {
    const [memRes, addRes] = await Promise.all([
      fetch("/api/memory"),
      fetch("/api/addenda"),
    ]);
    if (memRes.ok) {
      const d = (await memRes.json()) as { memories: Memory[] };
      setMemories(d.memories);
    }
    if (addRes.ok) {
      const d = (await addRes.json()) as { addenda: PromptAddendum[] };
      setAddenda(d.addenda);
    }
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll, refreshKey]);

  const deleteMemory = async (id: string) => {
    await fetch(`/api/memory/${id}`, { method: "DELETE" });
    setMemories((m) => m.filter((x) => x.id !== id));
  };

  const toggleAddendum = async (id: string, enabled: boolean) => {
    await fetch(`/api/addenda/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    setAddenda((a) => a.map((x) => (x.id === id ? { ...x, enabled } : x)));
  };

  const deleteAddendum = async (id: string) => {
    await fetch(`/api/addenda/${id}`, { method: "DELETE" });
    setAddenda((a) => a.filter((x) => x.id !== id));
  };

  const agent = agentId ? AGENT_META[agentId] : null;

  return (
    <aside className="flex h-full w-full flex-col gap-4 overflow-y-auto p-4 text-sm scroll-slim">
      {/* Close button — mobile only */}
      {onClose && (
        <div className="flex justify-end lg:hidden">
          <button
            onClick={onClose}
            className="rounded-lg border border-mina-edge px-2 py-1 text-xs text-mina-muted hover:text-mina-text transition"
          >
            ✕ Close
          </button>
        </div>
      )}

      {/* Agent panel */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-mina-muted">
          Active Agent
        </h2>
        <div className="flex items-center gap-3 rounded-xl border border-mina-edge bg-mina-panel px-4 py-3">
          {agent ? (
            <>
              <span className="text-xl">{agent.icon}</span>
              <div>
                <p className="font-medium text-mina-text">{agent.label}</p>
                <p className="text-xs text-mina-muted">Last specialist used</p>
              </div>
              <span className="ml-auto h-2 w-2 rounded-full bg-mina-accent" />
            </>
          ) : (
            <>
              <span className="text-xl opacity-40">🤖</span>
              <p className="text-mina-muted">Idle</p>
            </>
          )}
        </div>
      </section>

      {/* Memory panel */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-mina-muted">
          Memory ({memories.length})
        </h2>
        {memories.length === 0 ? (
          <p className="text-xs text-mina-muted px-1">No memories stored yet.</p>
        ) : (
          <ul className="space-y-1">
            {memories.map((m) => (
              <li
                key={m.id}
                className="group flex items-start gap-2 rounded-lg border border-mina-edge bg-mina-panel/60 px-3 py-2"
              >
                <p className="flex-1 text-xs text-mina-text leading-relaxed">{m.text}</p>
                <button
                  onClick={() => void deleteMemory(m.id)}
                  className="shrink-0 text-xs text-mina-muted opacity-0 group-hover:opacity-100 hover:text-mina-danger transition"
                  title="Forget this"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Prompt Addenda panel */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-mina-muted">
          Prompt Tweaks ({addenda.length})
        </h2>
        {addenda.length === 0 ? (
          <p className="text-xs text-mina-muted px-1">No prompt improvements yet.</p>
        ) : (
          <ul className="space-y-2">
            {addenda.map((a) => (
              <li
                key={a.id}
                className={[
                  "group rounded-xl border px-3 py-2.5 transition",
                  a.enabled
                    ? "border-mina-edge bg-mina-panel/60"
                    : "border-mina-edge/40 bg-mina-panel/20 opacity-50",
                ].join(" ")}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-mina-text leading-relaxed">{a.text}</p>
                    <p className="mt-1 text-xs text-mina-muted">
                      {TARGET_LABEL[a.target] ?? a.target}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => void toggleAddendum(a.id, !a.enabled)}
                      className={[
                        "rounded px-1.5 py-0.5 text-xs transition",
                        a.enabled
                          ? "text-mina-accent hover:text-mina-accent/70"
                          : "text-mina-muted hover:text-mina-text",
                      ].join(" ")}
                      title={a.enabled ? "Disable" : "Enable"}
                    >
                      {a.enabled ? "On" : "Off"}
                    </button>
                    <button
                      onClick={() => void deleteAddendum(a.id)}
                      className="text-xs text-mina-muted opacity-0 group-hover:opacity-100 hover:text-mina-danger transition"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
```

- [ ] **Verify tsc**

```bash
cd mina && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat(dashboard): Sidebar component with agent/memory/addenda panels"
```

---

## Task 8: Rework `page.tsx` — two-column layout + agent state

**Files:**
- Modify: `mina/src/app/page.tsx`

This is the largest change. The existing file is ~418 lines. We're making these changes:

1. Import `Sidebar` and `AgentId`
2. Add `agentId` state (`AgentId | null`) and `sidebarOpen` state (mobile toggle)
3. Add `refreshKey` state (number, incremented after each turn to trigger sidebar re-fetch)
4. Handle the new `agent` SSE event in the `handle` function
5. After `runChat` completes (in the `finally` block), increment `refreshKey`
6. Change `<main>` from `mx-auto max-w-2xl flex flex-col` to a full-width two-column layout
7. Add a sidebar toggle button in the header (visible only on mobile `lg:hidden`)
8. Render `<Sidebar>` in a right panel (hidden on mobile unless `sidebarOpen`)

- [ ] **Replace the full `page.tsx`**

Write this complete file to `mina/src/app/page.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MinaOrb, { type MinaState } from "@/components/MinaOrb";
import ActionCard from "@/components/ActionCard";
import ToolResultCard from "@/components/ToolResultCard";
import Sidebar from "@/components/Sidebar";
import { useVoice } from "@/hooks/useVoice";
import type {
  ActionProposal,
  AgentId,
  ApiMessage,
  ServerEvent,
} from "@/lib/types";

type Bubble =
  | { id: string; kind: "message"; role: "user" | "mina" | "system"; text: string }
  | { id: string; kind: "tool_card"; toolName: string; data: unknown };

const STORAGE_KEY = "mina_session_v1";

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const textOf = (content: string | null): string => (content ?? "").trim();

function loadSession(): { bubbles: Bubble[]; messages: ApiMessage[] } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { bubbles: Bubble[]; messages: ApiMessage[] };
  } catch {
    return null;
  }
}

function saveSession(bubbles: Bubble[], messages: ApiMessage[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ bubbles, messages }));
  } catch {}
}

export default function Home() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [streaming, setStreaming] = useState("");
  const [pending, setPending] = useState<ActionProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [speakEnabled, setSpeakEnabled] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [agentId, setAgentId] = useState<AgentId | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const convoRef = useRef<ApiMessage[]>([]);
  const streamingRef = useRef("");
  const decisionsRef = useRef<Record<string, boolean>>({});
  const bubblesRef = useRef<Bubble[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const voice = useVoice();

  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      setBubbles(saved.bubbles);
      bubblesRef.current = saved.bubbles;
      convoRef.current = saved.messages;
    }
    setHydrated(true);
  }, []);

  const orbState: MinaState = voice.listening
    ? "listening"
    : voice.speaking
      ? "speaking"
      : loading
        ? "thinking"
        : "idle";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [bubbles, streaming, pending]);

  const addBubble = useCallback((b: Bubble) => {
    setBubbles((prev) => {
      const next = [...prev, b];
      bubblesRef.current = next;
      saveSession(next, convoRef.current);
      return next;
    });
  }, []);

  const addMessage = useCallback(
    (role: "user" | "mina" | "system", text: string) => {
      if (!text.trim()) return;
      addBubble({ id: newId(), kind: "message", role, text });
    },
    [addBubble],
  );

  const clearConversation = useCallback(() => {
    setBubbles([]);
    bubblesRef.current = [];
    convoRef.current = [];
    setPending([]);
    setStreaming("");
    streamingRef.current = "";
    setAgentId(null);
    voice.cancelSpeak();
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, [voice]);

  const runChat = useCallback(
    async (decisions?: Record<string, boolean>) => {
      setLoading(true);
      streamingRef.current = "";
      setStreaming("");
      let lastMinaText = "";

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: convoRef.current, decisions }),
        });
        if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const handle = (event: ServerEvent) => {
          switch (event.type) {
            case "delta":
              streamingRef.current += event.text;
              setStreaming(streamingRef.current);
              break;
            case "assistant": {
              convoRef.current.push(event.message);
              const t = event.message.role === "assistant" ? textOf(event.message.content) : "";
              if (t) {
                lastMinaText = t;
                addMessage("mina", t);
              }
              streamingRef.current = "";
              setStreaming("");
              saveSession(bubblesRef.current, convoRef.current);
              break;
            }
            case "tool_result":
              for (const m of event.messages) convoRef.current.push(m);
              break;
            case "tool_card":
              addBubble({ id: newId(), kind: "tool_card", toolName: event.toolName, data: event.data });
              break;
            case "action_required":
              decisionsRef.current = {};
              setPending(event.actions);
              break;
            case "agent":
              setAgentId(event.agentId);
              break;
            case "error":
              addMessage("system", `⚠️ ${event.message}`);
              break;
            case "done":
              break;
          }
        };

        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";
          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data:")) continue;
            const json = line.slice(5).trim();
            if (json) handle(JSON.parse(json) as ServerEvent);
          }
        }

        if (lastMinaText && speakEnabled) voice.speak(lastMinaText);
      } catch (err) {
        addMessage("system", `⚠️ ${err instanceof Error ? err.message : "Connection error."}`);
      } finally {
        streamingRef.current = "";
        setStreaming("");
        setLoading(false);
        setRefreshKey((k) => k + 1);
      }
    },
    [addBubble, addMessage, speakEnabled, voice],
  );

  const sendText = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t || loading) return;
      voice.cancelSpeak();
      addMessage("user", t);
      convoRef.current.push({ role: "user", content: t });
      setInput("");
      inputRef.current?.focus();
      void runChat();
    },
    [addMessage, loading, runChat, voice],
  );

  const decide = useCallback(
    (id: string, approved: boolean) => {
      decisionsRef.current[id] = approved;
      const allResolved = pending.every((a) => a.id in decisionsRef.current);
      if (!allResolved) {
        setPending((p) => p.filter((a) => !(a.id in decisionsRef.current)));
        return;
      }
      const decisions = { ...decisionsRef.current };
      setPending([]);
      addMessage(
        "system",
        Object.values(decisions).some(Boolean)
          ? "✓ Approved — Mike is carrying it out…"
          : "✗ Cancelled.",
      );
      void runChat(decisions);
    },
    [addMessage, pending, runChat],
  );

  const micClick = () => {
    if (voice.listening) {
      voice.stop();
    } else {
      voice.start((finalText) => sendText(finalText));
    }
  };

  if (!hydrated) return null;

  const isEmpty = bubbles.length === 0 && !streaming;

  return (
    <div className="flex h-screen overflow-hidden bg-mina-bg">
      {/* ── Main chat column ── */}
      <main className="flex flex-1 flex-col min-w-0 px-4 py-6 overflow-hidden">
        {/* Header */}
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-mina-text">Mike</h1>
            <p className="text-xs text-mina-muted">Your AI right hand · prototype</p>
          </div>
          <div className="flex items-center gap-2">
            {bubbles.length > 0 && (
              <button
                onClick={clearConversation}
                className="rounded-lg px-3 py-1.5 text-xs text-mina-muted hover:text-mina-text transition"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setSpeakEnabled((v) => !v)}
              className="rounded-lg border border-mina-edge px-3 py-1.5 text-sm text-mina-muted hover:text-mina-text transition"
            >
              {speakEnabled ? "🔊" : "🔇"}
            </button>
            {/* Mobile sidebar toggle */}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="lg:hidden rounded-lg border border-mina-edge px-3 py-1.5 text-sm text-mina-muted hover:text-mina-text transition"
              title="Show dashboard"
            >
              ☰
            </button>
          </div>
        </header>

        {/* Orb */}
        <div className="my-4">
          <MinaOrb state={orbState} />
        </div>

        {/* Conversation */}
        <div
          ref={scrollRef}
          className="scroll-slim mb-4 flex-1 space-y-3 overflow-y-auto rounded-xl border border-mina-edge bg-mina-panel/50 p-4"
        >
          {isEmpty && (
            <div className="space-y-3 text-sm text-mina-muted">
              <p className="font-medium text-mina-text/70">At your service. You might ask:</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  { q: "What's on my calendar today?", icon: "📅" },
                  { q: "Draft a reply to Alex accepting the proposal.", icon: "✉️" },
                  { q: "How much revenue did I make this month?", icon: "💳" },
                  { q: "Refund Alex's last charge.", icon: "⚠️" },
                ].map(({ q, icon }) => (
                  <button
                    key={q}
                    onClick={() => sendText(q)}
                    disabled={loading}
                    className="flex items-start gap-2 rounded-lg border border-mina-edge bg-mina-panel/60 px-3 py-2 text-left text-xs text-mina-muted hover:border-mina-accent/50 hover:text-mina-text transition disabled:opacity-40"
                  >
                    <span className="shrink-0">{icon}</span>
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {bubbles.map((b) => {
            if (b.kind === "tool_card") {
              return <ToolResultCard key={b.id} toolName={b.toolName} data={b.data} />;
            }
            return <Message key={b.id} role={b.role} text={b.text} />;
          })}

          {streaming && <Message role="mina" text={streaming} />}

          {loading && !streaming && pending.length === 0 && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-mina-edge bg-mina-panel px-4 py-3">
                <ThinkingDots />
              </div>
            </div>
          )}

          {pending.map((a) => (
            <ActionCard
              key={a.id}
              action={a}
              disabled={loading}
              onApprove={() => decide(a.id, true)}
              onDeny={() => decide(a.id, false)}
            />
          ))}
        </div>

        {/* Composer */}
        <div className="flex items-center gap-2">
          <button
            onClick={micClick}
            disabled={!voice.sttSupported || loading}
            className={[
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg transition",
              voice.listening
                ? "bg-mina-accent text-black shadow-[0_0_16px_-2px] shadow-mina-accent/70"
                : "border border-mina-edge text-mina-muted hover:border-mina-accent/50 hover:text-mina-text",
              !voice.sttSupported ? "opacity-40" : "",
            ].join(" ")}
          >
            🎤
          </button>
          <input
            ref={inputRef}
            value={voice.listening && voice.interim ? voice.interim : input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendText(input);
              }
            }}
            placeholder={voice.listening ? "Listening…" : "Message Mike…"}
            disabled={loading}
            className="h-11 flex-1 rounded-full border border-mina-edge bg-mina-panel px-4 text-sm outline-none placeholder:text-mina-muted focus:border-mina-accent/70 disabled:opacity-50 transition"
          />
          <button
            onClick={() => sendText(input)}
            disabled={loading || !input.trim()}
            className="h-11 rounded-full bg-mina-accent px-5 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-40"
          >
            Send
          </button>
        </div>

        {!voice.sttSupported && (
          <p className="mt-2 text-center text-xs text-mina-muted">
            Voice input needs Chrome or Edge.
          </p>
        )}
      </main>

      {/* ── Sidebar — desktop always visible, mobile overlay ── */}
      <>
        {/* Mobile overlay backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={[
            "z-30 flex flex-col border-l border-mina-edge bg-mina-panel transition-transform duration-200",
            // Desktop: always visible, fixed width
            "lg:relative lg:w-80 lg:translate-x-0 lg:flex",
            // Mobile: fixed overlay from the right, toggled
            sidebarOpen
              ? "fixed right-0 top-0 h-full w-80 translate-x-0"
              : "fixed right-0 top-0 h-full w-80 translate-x-full lg:translate-x-0",
          ].join(" ")}
        >
          <Sidebar
            agentId={agentId}
            refreshKey={refreshKey}
            onClose={() => setSidebarOpen(false)}
          />
        </aside>
      </>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-mina-accent/60 animate-pulse"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

function Message({ role, text }: { role: "user" | "mina" | "system"; text: string }) {
  if (role === "system") {
    return <p className="text-center text-xs text-mina-muted py-1">{text}</p>;
  }
  const isUser = role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={[
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-mina-accent text-black"
            : "border border-mina-edge bg-mina-panel text-mina-text",
        ].join(" ")}
      >
        {text}
      </div>
    </div>
  );
}
```

- [ ] **Verify tsc**

```bash
cd mina && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Run tests**

```bash
cd mina && npx vitest run
```
Expected: 78 tests pass (no new tests needed — all new code is UI or pass-through API routes).

- [ ] **Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(dashboard): two-column layout with live sidebar"
```

---

## Task 9: Final verification and push

- [ ] **Full tsc check**

```bash
cd mina && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Full test run**

```bash
cd mina && npx vitest run
```
Expected: 78 tests pass.

- [ ] **Push to master**

```bash
git push origin master
```

---

## Self-Review Notes

- All API routes use `params: Promise<{ id: string }>` (Next.js 16 async params pattern) ✓
- `agent` SSE event handled in the `switch` in `page.tsx` ✓  
- `refreshKey` incremented in `finally` so sidebar refreshes even on error ✓
- Mobile sidebar uses `fixed` + `z-30` to sit above content, backdrop at `z-20` ✓
- `deleteMemory`/`toggleAddendum`/`deleteAddendum` do optimistic updates (no re-fetch) ✓
- Types: `Memory` imported from `@/lib/memory`, `PromptAddendum` from `@/lib/promptStore` — both are server libs but the types are pure data (no server-only imports) ✓
- `mina-danger` used for delete hover — confirmed it exists as `#f87171` in tailwind config ✓
