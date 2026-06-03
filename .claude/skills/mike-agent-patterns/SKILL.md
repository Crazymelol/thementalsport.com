---
name: mike-agent-patterns
description: Use when adding, modifying, or debugging Mike's assistant tools or agents (router + specialist agents in mina/src/lib), especially write tools, the approval gate, or agent routing.
---

# Mike Agent Patterns

## Overview

Mike is a JARVIS-style voice-first assistant using an **orchestrator-worker** pattern: a fast LLM router picks ONE specialist agent per turn, that agent runs the think-loop with a scoped tool set, and every write tool bubbles up through a **single safety gate** for explicit user approval. All channels (web, Slack) call `runBrain()` — its signature never changes.

**Core principle:** The approval gate lives at exactly one point. Adding agents or tools must never add a second enforcement point.

## The Files (single source of truth)

| File | Role |
|---|---|
| `mina/src/lib/router.ts` | `route(messages)` → `AgentId`. Fast model (`llama-3.1-8b-instant`), 4s hard timeout, falls back to `general`. |
| `mina/src/lib/agents.ts` | `AGENTS` registry, `toolsForAgent(id)`, `getAgentForTool(name)`. |
| `mina/src/lib/tools.ts` | `TOOLS[]` registry — every tool's `run`, `summarize`, write-flag. |
| `mina/src/lib/brain.ts` | The hub: route → scope → think-loop → gate. |
| `mina/src/lib/types.ts` | `AgentId`, `BrainResult.agent?`. |

## Adding a Tool — the bidirectional rule

A tool is invisible unless registered in **BOTH** places:

1. **`tools.ts`** — add to `TOOLS[]` with `run`, and (for writes) `summarize` + write tier.
2. **`agents.ts`** — add the tool name to a specialist's `toolNames`.

Memory tools (`remember`/`recall`/`forget`) are auto-appended to every agent — don't list them per-agent.

## The Write-Tool Flow (three phases)

```
Phase 1  fresh turn → route() picks agent → toolsForAgent() scopes tools →
         think-loop → isWrite() true? → return pendingActions, PAUSE
Phase 2  channel shows approval cards → user approves/rejects →
         re-POST same messages + decisions:{toolCallId:bool}
Phase 3  re-run → getAgentForTool(firstToolName) recovers agent (stateless) →
         approved? tool.run() : "user declined" message → continue loop
```

The gate is `brain.ts` ~line 184: `toolCalls.filter(isWrite)` → if any, return with `pendingActions` **before executing anything**. Approved writes only run when `decisions[tc.id] === true`.

## Gotchas (what developers get wrong)

- **Forgot `agents.ts`?** The tool exists but is never in scope → model can't call it, and approval re-run's `getAgentForTool()` falls back to `general` (which won't have it). Re-run silently breaks.
- **No `summarize()` on a write tool?** Approval card shows raw JSON arguments. Every write tool needs one.
- **Routing is lossy on timeout** — a write tool that lives ONLY in a specialist becomes unreachable if `route()` times out and falls back to `general`. Keep `general` able to reach truly critical actions, or accept the fallback.
- **System prompt is stripped from returned messages** (`messages.slice(1)`) — tools can't read their own role text.
- **Writes have no transaction/retry semantics** — once approved, `run()` fires once. Make write tools idempotent if a double-fire would harm.
- **Never bypass the gate.** Don't add a write that self-executes inside the loop. Untrusted content (emails, web pages) is read as DATA and must never trigger an auto-write (prompt-injection posture).

## Verifying a Change

```bash
cd mina && npm test          # agents.test.ts + router.test.ts + tools.test.ts must stay green
```

Add a registry test in `agents.test.ts` for any new tool↔agent mapping, and assert `getAgentForTool("your_tool")` returns the right agent.
