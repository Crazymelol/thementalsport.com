# Mike Self-Improving Prompts (Gated) — Design

**Date:** 2026-06-03
**Status:** Approved (design), pending implementation plan
**Builds on:** Phase 3 orchestrator (`2026-06-03-jarvis-orchestrator-design.md`) and the
existing write-approval gate + Upstash memory layer.

## 1. Goal

Give Mike durable, gated **self-improvement**: it can propose refinements to its own
instructions, you approve them with one tap, and from then on it behaves better —
permanently. The loop:

> You correct Mike ("you keep forgetting timezones") → Mike recognizes the pattern →
> proposes a prompt addendum → you approve (Slack button / web card) → the addendum is
> persisted and applied to every future turn.

This is genuine self-improvement that stays **fully under human control**: it rides the
existing write-approval gate, so nothing about Mike's behavior changes without you.

**Decided scope:** self-edit of *prompts only* (not code, not routing). **Additive-only**,
**transparent**, and **individually toggleable**.

## 2. Non-Goals

- Mike modifying its own source code (explicitly rejected — unsafe).
- Auto-tuning routing/controller decisions (a separate possible feature).
- Editing or removing the base system prompt or any safety rule (impossible by design —
  see §4).
- Auto-applying any addendum without explicit human approval.

## 3. Architecture

Prompts today are hardcoded and immutable at runtime (`MINA_SYSTEM_PROMPT` in
`systemPrompt.ts`, each agent's `promptAddon` in `agents.ts`). Phase adds a **mutable
overrides layer** in Upstash Redis (same store as memory). The effective system prompt
composed at the hub becomes:

```
base MINA_SYSTEM_PROMPT (code, immutable)
  + agent.promptAddon       (code, immutable)
  + approved active addenda (Redis, learned)   ← NEW, appended last
```

Addenda are appended **after** the base, so they can add guidance but can never shadow
or delete the safety rules that precede them.

### 3.1 Prompt store — `lib/promptStore.ts` (new)

Redis-backed, keyed by target. Each addendum record:

```ts
type PromptAddendum = {
  id: string;            // stable id (for toggle/revert)
  target: "global" | AgentId;
  text: string;          // the appended guidance
  rationale: string;     // why Mike proposed it (shown on approval + in list)
  enabled: boolean;      // toggle without deleting
  createdAt: string;
};
```

Functions (all additive-only by construction — there is no API that touches the base
prompt):
- `addAddendum(rec): Promise<void>` — append a new record.
- `listAddenda(): Promise<PromptAddendum[]>` — all records (for transparency + toggle).
- `setEnabled(id, enabled): Promise<boolean>` — flip the toggle.
- `removeAddendum(id): Promise<boolean>` — delete (revert).
- `addendaBlock(target): Promise<string>` — render the **enabled** addenda for a target
  (global + that agent) into the string appended to the system prompt. Mirrors
  `memoryBlock()`.

Storage: a Redis list/hash `mike:prompt_addenda` (consistent with `mike:memories`).

### 3.2 Tools — `lib/tools.ts` (new tools)

Cross-cutting (memory-class), available to **every** agent via `agents.ts` like
`remember`/`recall`/`forget`:

| Tool | Tier | Purpose |
|---|---|---|
| `propose_prompt_improvement(target, text, rationale)` | **write** | Propose an addendum. Bubbles up through the gate; on approval, `addAddendum`. |
| `revert_prompt_improvement(id)` | **write** | Delete an addendum. Gated. |
| `toggle_prompt_improvement(id, enabled)` | **write** | Enable/disable without deleting. Gated. |
| `list_prompt_improvements()` | **read** | Return all addenda (id, target, text, rationale, enabled). Auto-runs; "what have you learned about yourself?" |

Each write tool implements `summarize()` so the approval card is meaningful (shows the
proposed text + rationale, or which addendum is being reverted/toggled).

### 3.3 Hub — `lib/brain.ts` (modified)

Where the system prompt is composed, append the rendered addenda:

```
content: MINA_SYSTEM_PROMPT + nowLine + memBlock + agent.promptAddon
         + await addendaBlock(agentId)
```

One extra Redis read per turn (same cost profile as `memoryBlock()`); negligible.

## 4. Safety model

- **Additive-only by construction.** The store exposes no operation that edits or
  deletes the base prompt. Addenda are concatenated *after* the immutable base + safety
  rules, so a learned line can add behavior but cannot override a guardrail or the
  approval gate. This is enforced structurally, not by instruction.
- **Every change is human-gated.** `propose_/revert_/toggle_prompt_improvement` are
  **write** tools → they pass through the existing single hub gate (Slack buttons / web
  cards). Mike can never silently alter its own behavior.
- **Transparent.** `list_prompt_improvements` lets you audit everything Mike has taught
  itself at any time.
- **Reversible.** Toggle off (instant disable, keeps the record) or revert (delete).
- **Prompt-injection posture unchanged.** A proposal triggered by untrusted content
  still cannot self-apply — it stops at the gate like any other write.

## 5. State & channels

- Addenda live in Redis (cross-channel, persistent), exactly like memories.
- **Zero changes** to channel handlers or the approval roundtrip — the new tools reuse
  the Phase 3 write-gate plumbing verbatim.
- `getAgentForTool` reverse-lookup on approval re-run: like the memory tools, these
  cross-cutting tools are appended to every agent's set rather than listed in any single
  agent's `toolNames`. So `getAgentForTool` returns the `"general"` fallback for them —
  which is correct and harmless, because the write (persisting/toggling an addendum) is
  agent-independent. No special placement needed.

## 6. Testing

- `promptStore.test.ts` — add/list/toggle/remove round-trips; `addendaBlock` renders only
  **enabled** addenda for the matching target (global + agent); a disabled or
  other-agent addendum is excluded; empty store → empty block.
- Tool tests — the four tools registered; write tools carry `summarize()`;
  `list_prompt_improvements` is a read (auto-runs, no gate); writes are gated.
- `brain` integration — effective system prompt includes an enabled global addendum and
  excludes a disabled one; base prompt + safety text always present and never mutated.
- Existing memory/router/agents/tools tests stay green.

## 7. What changes vs. what doesn't

**New:** `lib/promptStore.ts` (+ test), four tools in `tools.ts`, agent wiring in
`agents.ts`.
**Modified:** `lib/brain.ts` (append `addendaBlock` to the system prompt).
**Untouched:** `router.ts`, base `systemPrompt.ts` content, every channel handler, the
approval flow, and the Phase 4 spec (independent).

## 8. Relationship to Phase 4

Independent of Phase 4 multi-hop sequencing; either can ship first. They compose cleanly:
in a chain, any hop can propose an improvement, and it still pauses at the one gate.
