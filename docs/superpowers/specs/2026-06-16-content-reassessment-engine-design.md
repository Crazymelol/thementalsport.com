# Content Reassessment Engine + Retention System — Design

**Date:** 2026-06-16
**Status:** Built autonomously overnight per owner instruction ("you continue
autonomously"); tooling shipped to master, retention prototype held on branch
for owner greenlight. Spec is here for owner review.
**Owner ask:** "I want results — views. You autonomously find the solutions.
Each platform has its agent for reassessment." Plus two reference videos to
"watch and learn" from (transcripts pasted; YouTube egress is blocked here).

## 1. Goal

Drive **views**, not tooling. Two coupled pieces:

1. **Per-platform reassessment agents** — each reads that platform's real
   performance + the queue, diagnoses *why* posts win/lose, and emits concrete,
   platform-specific changes. Built on the data `social-report.mjs` already
   gathers (→ `STATUS.md`). YouTube first (only platform with autonomous data +
   the live channel), then replicate the pattern.
2. **The retention fix** — the actual view-driver. The channel's bottleneck is
   `0:08` average view duration (people leave after the first sentence), so the
   algorithm stops pushing and reach collapses to single digits.

## 2. What the data says (the diagnosis)

- Recent text-card Shorts (short-002/004/006) get **6–8 views** each.
- The channel's older winners — a Mike-Tyson-thumbnail Short (**1,180**) and
  "Nurturing Self-Worth" (**385**) — massively outperformed. Faces / stronger
  packaging won.
- Average view duration is **0:08** on ~50s videos (~15–30% retention).
- So the levers, in order: **(1) title/packaging, (2) hook writing, (3) on-screen
  retention, (4) format.** Backend (QA gate, voice cloning) is already solid and
  is *not* the bottleneck.

## 3. Lessons applied from the two reference videos

The owner sent a dropshipping guru video (mostly affiliate-shilling — ignored,
except "model what's already winning") and a **faceless-YouTube** video, which is
directly on-model. The legit, transferable tactics adopted here:

- **Model proven winners:** find recently-started in-niche channels with millions
  of views and *more views than subscribers* (algorithm-driven, not audience-
  loyalty). Copy their topic/title structure; attack gaps; out-volume.
- **Titles = one-variable swaps on proven viral titles** ("birds at *night*" →
  "birds at *sunrise*"). Highest-leverage, lowest-effort change.
- **Curiosity-gap hook in the first 2 seconds**, payoff-teased-not-given.
- **Dynamic retention** (motion, pace) over static text cards.

These are encoded into the youtube-strategist agent's rubric so every
reassessment applies them.

## 4. Components

### 4.1 `youtube-strategist` agent (`.claude/agents/youtube-strategist.md`)
Reads `STATUS.md` (YouTube section) + `social/youtube-queue/queue.json`. Ranks
posted videos, infers win/lose patterns (title, hook, topic, audience, format),
and outputs a structured strategy report: what won, what lost, **concrete title +
hook rewrites** for upcoming items (using the modeling + curiosity-gap method),
and a prioritized action list. Judge/advisor — proposes creative changes, never
silently rewrites public-facing titles/hooks (those need owner approval).

### 4.2 `/reassess` command (`.claude/commands/reassess.md`)
Runs the strategist(s) on current data, writes `social/strategy/<platform>.md`
(a living, versioned playbook), and commits. Auto-applies only **safe mechanical**
changes (e.g., caption-hook bank rotation); creative changes (titles, hooks,
format) are surfaced for owner approval, not auto-applied.

### 4.3 First strategy report (`social/strategy/youtube.md`)
The first real reassessment output — the diagnosis above plus concrete before→after
title/hook rewrites for the next batch. This is the immediately-usable artifact.

### 4.4 Retention fix (Remotion) — prototype, held for greenlight
`ShortVideo.tsx`'s `HookScreen` is the first 3s where retention dies: a static
uppercase wall with a gentle pop-in. The prototype reworks it for stop-power
(payoff/big-number first frame, motion, curiosity-gap emphasis) within the
faceless format (owner's autonomous+cloud choice — no filming, no stock egress).
Rendered + self-QA'd, committed to the branch only; **not merged/posted** because
public creative direction is the owner's call.

## 5. Scope / order (anti-ruflo: prove before scaling)

1. YouTube strategist + first report + retention prototype. (this session)
2. Owner greenlights the retention format + title/hook direction.
3. Replicate the strategist pattern to X / TikTok / Pinterest / LinkedIn.
4. Strategic candidate (owner decision): a **long-form faceless track** for RPM/
   monetization — Shorts build reach but pay ~nothing; the reference channel's
   ~$18K/mo came from long-form. Not built now; flagged as the next big lever.

## 6. Non-goals

- No dropshipping pivot. No new MCP/agent swarm. No auto-changing public titles.
- No paid tools (Higgsfield/Winning Hunter/etc.) — the existing Remotion + cloned-
  voice pipeline already covers production; adding paid AI-gen is a separate,
  owner-budgeted decision.
