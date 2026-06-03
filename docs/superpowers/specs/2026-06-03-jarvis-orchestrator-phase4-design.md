# Jarvis Orchestrator (Phase 4) — Autonomous Multi-Hop Sequencing

**Date:** 2026-06-03
**Status:** Approved (design), pending implementation plan
**Roadmap:** PRD §0a Phase 4 — multi-agent sequencing on top of the Phase 3 router.
**Builds on:** `docs/superpowers/specs/2026-06-03-jarvis-orchestrator-design.md`

## 1. Goal

Let Mike chain **multiple specialists within a single turn**, autonomously. Example:
"Email me this month's revenue" → Finance agent fetches revenue → Inbox agent drafts
the email. Phase 3 was deliberately single-hop; Phase 4 adds a controlled
orchestration loop on top of the existing router + agent registry — not a rewrite.

**Decided behavior:**
- **Fully autonomous** — Mike decides on its own when to hand off; no plan-then-confirm.
- **Max 3 hops** per turn — predictable cost/latency ceiling; covers virtually all real tasks.
- **Hub-controlled handoffs** — the "who goes next" decision lives at the hub, not inside agents.
- **Safety gate unchanged** — any write still pauses the whole chain for explicit approval.

## 2. Non-Goals

- Parallel fan-out (multiple agents at once). Still sequential.
- Agent-driven handoff tools (Swarm-style). Rejected: spreads routing across all 5
  agents and complicates the single-gate safety reasoning. Hub stays in control.
- Upfront whole-chain planning. Rejected: plans go stale once real data returns mid-chain.
- New specialist agents or new tools. Pure orchestration change behind `runBrain`.

## 3. Architecture

```
   You (web / Slack / voice)
            │
            ▼
      ┌───────────────────────────────────────┐
      │  JARVIS hub — runBrain() (unchanged sig)│
      │                                         │
      │  for hop in 1..MAX_HOPS:                │
      │    1. route()/continue → agent id       │
      │    2. run specialist think-loop         │  ← existing Phase 3 logic, unchanged
      │    3. write tool? → pendingActions,     │  ← THE GATE: pause whole chain
      │       PAUSE & return                    │
      │    4. else → decideNext(goal, work)     │  ← NEW controller call
      │       "done"? break : loop to next agent│
      └───────────────────────────────────────┘
```

### 3.1 Orchestration loop — `lib/brain.ts` (modified)

`runBrain` wraps the existing single-agent flow in an outer loop, `MAX_HOPS = 3`:

1. **First hop:** `agentId = await route(messages)` (Phase 3, unchanged).
2. Run that specialist's think-loop exactly as today (stream, run reads, stop on writes).
3. **Write encountered** → return `pendingActions` immediately, pausing the entire
   chain (identical to Phase 3). See §4 for resume.
4. **Specialist produced a final answer (no pending write)** → call
   `decideNext(goal, transcript)`:
   - Returns `"done"` → break the loop, return the final result.
   - Returns an `AgentId` → that becomes the next hop's agent; append a brief
     internal continuation note and loop. The accumulated `messages` carry context.
5. Loop terminates on `done`, on reaching `MAX_HOPS`, or on a write-pause.

`goal` = the most recent user message (the turn's request). `transcript` = the
assistant/tool messages produced so far this turn.

### 3.2 Controller — `lib/controller.ts` (new)

`decideNext(goal: string, transcript: ApiMessage[]): Promise<AgentId | "done">`

- Mirrors `router.ts`: fast model (`llama-3.1-8b-instant`), `maxRetries: 0`,
  4s hard timeout via `Promise.race`.
- System prompt: classify whether the goal is fully satisfied by the work so far.
  Reply with `done`, or exactly one of the agent ids if another specialist is needed.
- **Fail-safe = stop.** Any error, timeout, missing key, or unrecognized output →
  return `"done"`. We never loop on uncertainty.
- Pure prompt builder (`buildControllerMessages`) exported separately for unit tests,
  same split as the router.

### 3.3 Bounds

- `MAX_HOPS = 3` constant in `brain.ts`, applied per `runBrain` invocation.
- Hop count is loop-local, **not persisted**. An approval re-run is a fresh
  invocation and receives a fresh 3-hop budget — acceptable because a human just
  approved an action, so resetting the leash is intentional and safe.

## 4. Safety model (unchanged — the whole point)

- The write gate stays at the **single hub point**. A write in any hop bubbles up as
  `pendingActions` and pauses the chain before executing anything. Chaining adds no
  new write path and no second enforcement point.
- **Resume after approval:** on the decisions re-run, the hub recovers the agent via
  `getAgentForTool(firstToolName)` (Phase 3), executes the approved write, then
  **re-enters the orchestration loop** to run any remaining hops (fresh budget per
  §3.3). If the controller says `done`, it simply returns.
- Prompt-injection posture (PRD §9a) unchanged: agents read untrusted content as
  data; no content-derived write auto-executes; every write is human-gated.

## 5. State flow & channels

- `messages` already carries the full turn across hops — no schema change.
- `BrainResult.agent` now reports the **last** specialist that acted this turn.
- **Zero changes** to `/api/chat`, `/api/slack/events`, `/api/slack/interactive`, or
  the approval roundtrip. The multi-hop loop hides entirely behind `runBrain`.

## 6. Testing

- `controller.test.ts` — `buildControllerMessages` (pure); mocked calls assert a
  satisfied goal → `done`, an unmet goal → correct next agent id, and
  garbage/empty/no-key/timeout → `done` (fail-safe).
- `brain` integration — mock the Groq client + controller to assert:
  - a 2-hop chain routes A→B then terminates on `done`;
  - reaching `MAX_HOPS` terminates cleanly with the work so far;
  - a write mid-chain still returns `pendingActions` and pauses (no extra hops run);
  - approval re-run executes the write and then continues the chain.
- All existing Phase 3 router/agents/tools/memory tests stay green (no changes there).

## 7. What changes vs. what doesn't

**New:** `lib/controller.ts` (+ `controller.test.ts`).
**Modified:** `lib/brain.ts` (wrap existing flow in the `MAX_HOPS` loop + controller
call + resume-into-loop on approval).
**Untouched:** `router.ts`, `agents.ts`, `tools.ts`, `memory.ts`, `types.ts` (no new
types needed — controller returns `AgentId | "done"`), every channel handler, the
approval flow.

## 8. Phase 5 hook (not built now)

Once sequential chaining is proven, parallel fan-out (dispatch independent sub-tasks
to multiple agents at once, then merge) becomes the next step — built on the same
hub-controlled model, with the gate still mediating every write.
