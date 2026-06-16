# YouTube Strategy — 2026-06-16 (reassessment #2)

_Builds on the first 2026-06-16 report. Focus: the kinetic-hook experiment is now
live — what's readable, what to watch, and the next lever now that the format fix
shipped._

## What changed since report #1
- The **kinetic stop-power hook** merged to master and went live ~24h ago.
  **short-009 and short-010 are the first two Shorts rendered with it** (per-word
  spring stamp-in + gold accent bar + floating motion, replacing the static text
  wall). short-001–008 are the old static format; short-011+ are pending and will
  render kinetic.
- 10 Shorts posted total.

## ⚠️ #1 prerequisite: set `YT_API_KEY`
We are flying blind. The YouTube section of `STATUS.md` is empty — **zero**
per-video views, retention, or CTR. Every number below is owner-reported, not
measured. Until `YT_API_KEY` (a YouTube Data API key) is set as a repo secret,
**none of the experiment below is verifiable**. This is the single
highest-leverage action; it gates the entire readout.

## Diagnosis
- Baseline (owner-reported): recent text-card Shorts ~6–8 views; all-time anchors
  **Tyson = 1,180** and "Nurturing Self-Worth" = 385; avg view duration **~0:08**
  on ~50s videos.
- **The format fix was necessary, not sufficient.** Motion fixes the static-wall
  problem; it does not fix a weak topic or an unrecognizable name. Tyson hit 1,180
  on the *old* format because the name carried it. So the next lever is topic/name
  selection, not more motion.

## Kinetic-hook experiment — status: PENDING (not readable yet)
- short-009/010 have been live <24h. YouTube needs ~24–72h to push a Short through
  its first test cohort and surface trustworthy retention. **Do not judge or roll
  back the format before ~2026-06-18.**
- **Metric to watch:** average view duration on short-009 + short-010 vs the 0:08
  baseline (check Studio at 48h, then 72h).
- **Decision rule:**
  - Clears **~0:12–0:15+** → format works; keep it, scale, move to topic/name as
    the next lever.
  - Stays **~0:08** → the bottleneck is content (topic / name / first *spoken*
    sentence), not motion.
  - **Split** (one clears, one doesn't) → it's the spoken first line. short-009
    opens on scene-setting ("Cup final. Everything you trained for."); short-010
    opens on a direct provocation ("You'd never let a teammate talk to you the way
    you talk to yourself."). A gap between them confirms the first sentence matters
    more than the visual.

## The next lever (now that format shipped): a known name / number in frame 1
Your own data says recognizable specificity wins. The pending bank from short-012+
mostly opens on abstract situations. The fastest win: front-load a known name or a
concrete number into the first on-screen word + first spoken word.

- **Already in the bank and ideal for this:** **short-037** (a concrete 10-second
  physical trick — "just squeezing a ball") and **short-038** ("the stat nobody
  tells you — *almost everyone* chokes"). Both are QA-approved and
  specificity-led. **I've bumped them to the front of the posting queue** (see
  "auto-applied" below) so they land inside the live experiment window.

## Hook tightenings for pending items (PROPOSALS — you approve public copy)
Front-load the punch; lead with a number where the script supports it. These use
**no invented facts**:

| Item | Current first line | Tighter open | Why |
|---|---|---|---|
| short-012 | "One early mistake. And now your whole game is unraveling." | "One mistake, first minute. Here's the 10-second reset." | concrete promise + number instead of abstraction |
| short-013 | "You didn't lose because you weren't ready. Your brain hijacked your body…" | "Your brain chokes on purpose. Here's the science." | counterintuitive claim first; drops the runway |
| short-016 | "Heart pounding, mind racing, two minutes before you compete. Do this." | "60 seconds before you compete: do this. It's just breathing." | time-specific + "it's just breathing" invites the skeptic the script then resolves |

> **Fact-check guardrail.** The strategist also proposed name-led hooks citing
> specific claims (e.g. a player "losing his dribble for six months," another
> "practicing losing on purpose," a "notebook of every mistake," "can't sleep
> before finals"). **None of those are sourced — I did not enshrine them.** Treat
> every name+claim as **[VERIFY]**; do not script or post any anecdote we can't
> verify. A fabricated sports "fact" in athlete-facing content is a credibility
> risk that outweighs the hook gain. Name-led hooks are great *when the claim is
> true* — the LeBron (short-004) and Giannis (short-007) ones were real and
> on-brand; that's the bar.

## Format / retention actions
1. Check short-009/010 avg view duration in Studio at **48h (≈2026-06-18)** before
   touching the format. Iterate on the number, not a guess.
2. ~~Bump short-037 + short-038 to the front of the queue~~ — **done** (below).
3. Verify **audio↔visual sync** on the kinetic format: the first spoken word and
   the first stamped-in word should hit within ~0.2s. (Most common kinetic-format
   failure.)
4. Don't raise cadence above the 3/day cap until at least one Short clears ~0:12 —
   volume at 0:08 compounds the negative channel signal.

## Next topics (lead with a name/number — VERIFY every claim before scripting)
Safe, evergreen, verifiable angles (no unsourced anecdote):
1. "The 6-Second Routine Free-Throw Shooters Use" (athletes) — number + specificity.
2. "What Pros Do In The 10 Seconds Before Pressure" (athletes) — number + gap.
3. "The 3 Words That Turn A Kid's Panic Into Focus" (parents) — concrete deliverable; pairs with short-039.
4. Name-led options (e.g. Jordan being cut from varsity — *that one is true*) — only after fact-checking the specific claim.

## Prioritized action list
1. **Set `YT_API_KEY`** — unblocks all measurement. Highest leverage.
2. **Check short-009/010 retention at 48h (2026-06-18)** and apply the decision
   rule. Don't touch the format before then.
3. ✅ **short-037/038/039 bumped to the front** of the posting queue (auto-applied
   — QA-approved, specificity-led, no copy changed).
4. **Approve/adjust the 3 hook tightenings** above (public copy — your call). Skip
   any anecdote we can't source.
5. **Verify kinetic audio↔visual sync** on short-009/010.
6. Hold the 3/day cap until a Short clears ~0:12 retention.

---
_Auto-applied this run (mechanical, no public copy changed): reordered the posting
queue so the QA-approved, specificity-led short-037/038/039 post next, inside the
live kinetic-hook experiment window. Everything creative above is a proposal
awaiting your approval._
