# Jarvis Orchestrator (Phase 3) — Design

**Date:** 2026-06-03
**Status:** Approved (design), pending implementation plan
**Roadmap:** PRD §0a Phase 3 — "Orchestrator: Jarvis routes intent to ≥2 specialist agents, each with its own context + tools."

## 1. Goal

Split the single all-knowing brain (`lib/brain.ts`, which holds every tool in one
context) into a **router + specialist agents** ("hub and spoke"). A quick LLM
router reads the user's intent, picks the one specialist that owns the relevant
tools, and that specialist runs the existing think-loop with a tight tool set and
a focused prompt.

This is the industry-standard "orchestrator-worker / router" pattern — the most
deployed multi-agent shape in production (~70%), and explicitly recommended for
applications with **distinct verticals** (here: Inbox, Calendar, Workspace,
Finance), which is exactly our shape.

### Why now
The single brain works but doesn't scale: as tools pile up, the model gets slower,
more easily confused, and the system prompt bloats. Narrow specialists keep each
agent's instructions tight, its tool list small, and its blast radius contained —
better for both reliability and safety.

## 2. Non-Goals (explicitly Phase 4+)

- **Multi-agent sequencing / auto-chaining** ("pull analytics THEN email it"
  automatically). Research shows chaining adds 1–3s latency per hop and a large
  jump in complexity. Phase 3 is **single-hop**: one agent per turn.
- **Parallel fan-out** to multiple agents at once.
- New tools or integrations. This is a pure refactor of how existing tools are
  organised behind `runBrain`.

## 3. The Agent Fleet

| Agent | Tools |
|---|---|
| **Inbox** | `search_emails`, `send_email` |
| **Calendar** | `get_calendar_events`, `create_calendar_event` |
| **Workspace** | `search_drive`, `read_drive_file`, `read_doc`, `create_doc`, `read_sheet`, `append_sheet_row`, `search_contacts` |
| **Finance** | `get_revenue_summary`, `issue_refund` |
| **General** | `browse_url` + fallback for chit-chat / anything unrouted |

**Memory is cross-cutting, not an agent.** `remember` / `recall` / `forget` are
available to every specialist, and `memoryBlock()` stays injected at the hub so
"what Jarvis knows about you" is shared across all lanes.

## 4. Architecture

```
   You (web chat / Slack / voice)
              │
              ▼
        ┌──────────┐
        │  JARVIS  │  runBrain() — unchanged signature
        │   hub    │  1. route(intent) → agent id   (1 quick Groq call)
        │          │  2. load agent prompt + tools
        │          │  3. run think-loop (existing logic)
        │          │  4. write tool? → bubble up as pendingAction (THE GATE)
        └────┬─────┘
   ┌─────────┼─────────┬─────────┬─────────┐
   ▼         ▼         ▼         ▼         ▼
 Inbox    Calendar  Workspace Finance   General
```

### 4.1 Routing — `lib/router.ts`
- A single function `route(messages): Promise<AgentId>`.
- One Groq call with a tiny system prompt: "Classify this request into exactly one
  of: inbox, calendar, workspace, finance, general. Reply with only the id."
- Uses the same `MODEL` (`openai/gpt-oss-120b`), `max_tokens` small (~10), no tools.
- On any error / unrecognised output → default to `general` (safe fallback).
- Pure and unit-testable: the classification prompt builder is exported separately
  from the network call.

### 4.2 Agents — `lib/agents.ts`
- An `AGENTS` registry: `Record<AgentId, { id, label, toolNames: string[], promptAddon: string }>`.
- `promptAddon` is a short focusing instruction appended to the shared
  `MINA_SYSTEM_PROMPT` (e.g. Inbox: "You are Jarvis's email specialist. Be precise
  about recipients; never send without the approval gate.").
- `toolsForAgent(id)` returns just that agent's tool defs (filtered from the
  existing `tools.ts` registry — single source of truth, no duplication).
- Memory tools (`remember`/`recall`/`forget`) are appended to every agent's set.

### 4.3 Hub — `lib/brain.ts` (modified, signature unchanged)
`runBrain({ messages, decisions })` internally becomes:
1. If `decisions` present (resolving a previous write) → the agent is already known
   from the prior turn; re-run that agent's loop. (Carry the agent id through the
   returned `messages`/state — see §5.)
2. Else → `const agentId = await route(messages)`.
3. Build the system prompt = `MINA_SYSTEM_PROMPT + nowLine + memBlock + agent.promptAddon`.
4. Build `tools = toolsForAgent(agentId)`.
5. Run the **exact existing think-loop** (stream, accumulate, run reads, stop on
   writes) — unchanged except `tools` and prompt are now agent-scoped.

`BrainResult` gains one optional field: `agent?: AgentId` (for transparency /
display and for resuming the right agent on approval).

## 5. State flow (how the agent id survives a turn)

The approval gate is stateless across HTTP requests — the conversation is carried
in the `messages` array (web re-sends it; Slack encodes it in the button payload).
To resume the **same** agent after approval without re-routing:

- The router decision is recorded as an invisible marker the hub can read back —
  simplest: include `agent` in `BrainResult`, and on the approval round, derive the
  agent from the pending action's tool name (`getAgentForTool(toolName)`) rather
  than re-routing. This needs no schema change to the stored messages and no DB.
- `getAgentForTool(name)` is a pure reverse-lookup over the `AGENTS` registry.

This keeps Phase 3 fully stateless and the channels (`/api/chat`,
`/api/slack/events`, `/api/slack/interactive`) **completely unchanged**.

## 6. Safety model (unchanged — the whole point)

- Specialists **never execute write tools**. A write (`send_email`, `issue_refund`,
  `create_doc`, `append_sheet_row`, `forget`) still bubbles up as a `pendingAction`
  to the hub, which returns it to the channel for approval — identical to today.
- The gate lives at **one point** (the hub). Adding agents does not add enforcement
  points. This preserves the entire existing approval flow (Slack buttons + web
  cards) verbatim.
- Prompt-injection posture (PRD §9a) is unchanged: agents read untrusted content as
  data, and no content-derived write auto-executes.

## 7. Testing

- `router.test.ts` — the classification prompt builder (pure); mocked Groq call
  asserts each vertical routes to the right id, and garbage/empty → `general`.
- `agents.test.ts` — `toolsForAgent` returns the right tool set per agent, memory
  tools always included, `getAgentForTool` reverse-lookup correct for every tool.
- Existing `brain` behaviour: a light integration test that a calendar request
  ends up with only calendar+memory tools in context (mock the Groq client).
- All existing tool/memory tests stay green (no tool logic changes).

## 8. What changes vs. what doesn't

**New files:** `lib/router.ts`, `lib/agents.ts` (+ their tests).
**Modified:** `lib/brain.ts` (route → scope prompt+tools → existing loop),
`lib/types.ts` (add `AgentId`, `agent?` on `BrainResult`).
**Untouched:** all of `tools.ts` logic, `memory.ts`, `slack.ts`, every route
handler, every channel. The refactor hides entirely behind `runBrain`.

## 9. Phase 4 hook (not built now)

Once single-hop is proven, sequencing becomes: let the hub run the router again on
an agent's *output* ("I've drafted the email, now post to Slack"), with each hop
still passing through the one gate. The registry and router built here are the
foundation; Phase 4 adds a controlled loop on top, not a rewrite.
