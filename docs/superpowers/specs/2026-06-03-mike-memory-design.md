# Mike Memory — Design Spec

**Date:** 2026-06-03
**Feature:** Give Mike persistent, cross-channel memory — durable facts and
preferences he remembers forever and uses automatically, shared identically
across the web app and (later) Slack.
**Status:** Approved design — pending implementation plan.

---

## 1. Goal

Turn Mike from a stateless tool into something that *knows you*. He should:

- Remember durable facts and preferences ("my business is The Mental Sport",
  "my co-founder is Alex", "keep replies concise") **forever**, across sessions.
- **Always know** his core profile without being asked — it's loaded into every
  conversation automatically.
- Share one memory across every channel — tell him something on the web, he
  knows it in Slack, and vice versa (unified store, not browser-local).
- Recall specific past facts on demand.

Build order in the wider roadmap: **Memory first** (ships on the web app, testable
immediately), **then Slack** (inherits memory for free).

## 2. Scope (v1) — and what's deliberately out

**In:**
- A persistent memory store (Upstash Redis).
- `remember` — save a durable fact (auto-runs, but announced — never silent).
- `recall` — search saved memories.
- `forget` — delete a memory (gated, since destructive).
- Auto-injection of Mike's core memory into every system prompt.

**Out (deliberately deferred — YAGNI):**
- Full searchable transcript logging of every conversation ("what did we decide
  last Tuesday?"). The store is designed so this slots in later as a fast
  follow-on, but it is not built now.
- Vector/semantic search. v1 recall uses keyword matching; the interface is
  written so a vector backend can replace it without touching tools.
- Automatic background fact-extraction from every message. v1 captures memory
  via explicit "remember" calls (the user asks, or Mike proposes and confirms).

## 3. Storage decision (validated)

**Upstash Redis**, accessed via `@upstash/redis` (HTTP/REST client).

Rationale:
- **Serverless-native:** REST-based, no TCP connection pooling problems in Vercel
  functions (a classic pain with Postgres on serverless).
- **Free tier** is ample for personal memory.
- **One-click on Vercel** via the Marketplace integration, which auto-injects the
  env vars — minimal setup for a non-technical user.
- Key-value/list model fits "a list of remembered facts" naturally.

Env vars (auto-set by the Vercel Upstash integration, server-side only):
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

**Real-or-stub:** if these are absent, `memoryConfigured()` is false and memory
tools fall back to a clear "memory isn't set up yet" notice. The app never breaks.

## 4. Data model

A single Redis list per principal (one user for now): key `mike:memories`.

Each entry is a JSON object:

```ts
type Memory = {
  id: string;        // short random id, e.g. "m_ab12cd"
  text: string;      // the fact/preference, e.g. "Co-founder is Alex (Acme)"
  createdAt: string; // ISO timestamp
};
```

- **Write** = `LPUSH mike:memories <json>` (newest first).
- **Read all** = `LRANGE mike:memories 0 -1`.
- **Delete** = read all, filter out the id, rewrite the list (small N; fine).
- **Injection cap:** the most recent 40 memories are injected into the system
  prompt to bound token cost. (40 short facts ≈ a few hundred tokens.)

## 5. Architecture

### 5.1 `mina/src/lib/memory.ts` (new) — the store
- `memoryConfigured(): boolean` — both Upstash env vars present.
- `addMemory(text: string): Promise<Memory>` — LPUSH a new entry.
- `listMemories(limit?: number): Promise<Memory[]>` — LRANGE, newest first.
- `searchMemories(query: string): Promise<Memory[]>` — keyword match over text
  (case-insensitive substring + simple term overlap). Pure-ish; the matching
  helper `scoreMemory(text, query)` is exported for unit testing.
- `deleteMemory(id: string): Promise<{ deleted: boolean }>`.
- `memoryBlock(limit?: number): Promise<string>` — formats recent memories into a
  prompt-injectable string (or "" when none / not configured).

All Upstash calls are wrapped so a transport error degrades gracefully (logged,
returns empty) rather than crashing a conversation.

### 5.2 Tools (`mina/src/lib/tools.ts`)
- `remember` (tier: **read** → auto-runs, no approval modal, but the result card
  makes it visible: "🧠 Remembered: …"). Input: `{ text: string }`.
  Stub when not configured.
- `recall` (tier: **read**). Input: `{ query: string }`. Returns matching
  memories; card lists them.
- `forget` (tier: **write** → gated, with `summarize()` showing what will be
  deleted). Input: `{ id: string }`.

Rationale for `remember` being auto (read-tier): saving a fact is low-risk and
gating it behind a modal every time would make Mike feel clumsy. It is always
*announced* via the card, so it's transparent, never silent. Deleting memory is
the destructive direction, so `forget` keeps the approval gate.

### 5.3 Brain integration (`mina/src/app/api/chat/route.ts`)
Before the loop, load `memoryBlock()` and append it to the system prompt:

```
What you know about your principal (your durable memory):
- Co-founder is Alex (Acme)
- Business: The Mental Sport
- Prefers concise replies
(Use these naturally. If you learn a new durable fact, call `remember`.)
```

This runs once per request (one Redis read), so Mike always "just knows" without
spending a tool call. When memory is empty/unconfigured, the block is omitted.

### 5.4 System prompt (`mina/src/lib/systemPrompt.ts`)
Add a short standing instruction: Mike should proactively offer to `remember`
durable facts/preferences he learns, and should consult memory before claiming he
doesn't know something about the principal. Keep it light — no nagging.

### 5.5 Result cards (`mina/src/components/ToolResultCard.tsx`)
- `remember` → "🧠 Remembered" card showing the saved fact.
- `recall` → "🧠 Memory" card listing matches (or "nothing on that yet").
- `forget` → handled via the existing approval card + generic result.

## 6. Cross-channel guarantee

Because memory lives in Redis (server-side, channel-agnostic) and is injected by
the shared brain path, every channel that calls the brain inherits the same
memory automatically. When Slack is built (next spec), it requires **zero** extra
memory work — it reads the same store. This is the whole reason memory is built
first.

## 7. Security & privacy

- Upstash tokens are server-side env vars only; never bundled to the browser.
- Memory contents are the user's own facts; no third party sees them.
- `remember` is always surfaced in a card (no silent capture). `forget` is gated.
- No secrets (API keys, tokens) should ever be written to memory; the system
  prompt instructs Mike not to store credentials.

## 8. Testing

Pure-logic unit tests (no network, consistent with existing vitest setup):
- `scoreMemory` / `searchMemories` ranking: a query matches relevant text and
  ignores irrelevant text.
- `memoryConfigured()` env gating.
- Tool stub fallbacks when memory not configured (`remember`, `recall`).
- `forget` produces an approval-card summary.

Network-dependent Upstash calls are verified manually on Vercel (same pattern as
Google/Gmail — the sandbox can't reach external services).

## 9. Setup (one-time, user-facing)

1. In the Vercel project → **Storage** (or **Integrations** → Marketplace) → add
   **Upstash Redis** (free plan). Vercel auto-creates `UPSTASH_REDIS_REST_URL`
   and `UPSTASH_REDIS_REST_TOKEN` in the project's env vars.
2. Redeploy.
3. Done — tell Mike "remember that my business is The Mental Sport," refresh, and
   confirm he still knows it.

## 10. Future (foundation only, not built now)

- **Conversation recall:** add a `mike:log` stream of turns; `recall` searches it
  too. Storage model already supports adding keys.
- **Semantic search:** swap `searchMemories` internals for Upstash Vector; tool
  interface unchanged.
- **Multi-user:** namespace keys by principal id (`mike:{userId}:memories`).
