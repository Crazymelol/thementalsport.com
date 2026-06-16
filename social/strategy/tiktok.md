# TikTok Strategy — 2026-06-16

_First TikTok reassessment. Views are unreadable in our scrape; this leans on
likes/comments + the shared YouTube retention read (same vertical Remotion render
feeds both)._

## Diagnosis
- **Ranking (by likes — the only signal we can read; views are blank):** "You
  Finally Won — So Why Do You Feel Empty?" (2) edges "LeBron Doesn't Calm Down" and
  "Train Your Kid For Penalty Pressure" (1 each). 4 posts, all ~1–2 likes / 0
  comments. No spike, no tail — a flat, thin floor. **Likes at this volume are
  noise, not signal.**
- **Pattern:** every TikTok posted so far (short-001 → short-004) is a
  **pre-kinetic render** — the static-text-wall open that capped YouTube retention
  at ~0:08 — so the first frame gave the FYP algorithm nothing to hold in the first
  3 seconds.
- **Bottleneck = 3-second retention + completion rate.** A static first frame kills
  both. We can't read TikTok views, but the read transfers: it's the *same* render
  that posts to YouTube Shorts, and that retention wall is the documented problem.
- **The fix is already live (don't re-decide it):** the **kinetic stop-power hook**
  shipped ~24h ago and feeds this same TikTok render. The job this cycle is to
  **measure completion**, not re-argue the change.

## First-frame / hook fixes (PROPOSALS — you approve public copy)
The 4 posted TikToks were rendered before the kinetic hook. Re-cut from the live
kinetic template so frame one carries motion + a name/number:

| Item | Current open | Rewritten (first on-screen line) | Why |
|---|---|---|---|
| short-002 | "You finally won... so why do you feel empty?" | "YOU WON. SO WHY THE EMPTY FEELING?" | strips the ellipsis stall; full gap visible in frame one |
| short-004 | "LeBron doesn't calm down under pressure. He slows down." | "LeBRON DOESN'T CALM DOWN." → "HE SLOWS DOWN." | known name as the thumbnail; contrast is the gap. **[VERIFY]** the LeBron framing before re-post |
| short-003 | "Your kid WILL face a penalty, a free throw, a match point." | "YOUR KID *WILL* CHOKE UNDER PRESSURE." → "TRAIN IT NOW." | sharper stakes word + controllable promise |
| short-001 | "What you say in the car after the game matters more than anything the coach said." | "THE CAR RIDE HOME BREAKS MORE ATHLETES THAN ANY COACH." | front-loads the provocative claim |

## Format / retention actions
1. **Re-cut short-001 → short-004 on the kinetic template** — the only static-wall
   TikToks live; everything pending already renders kinetic.
2. **Confirm burned-in, word-by-word captions on the TikTok export** (parity with
   the QA'd YouTube render). Sound-off is the default scroll.
3. **Cut dead air / push sub-30s.** Shorter completes better, and completion is the
   FYP lever. The 3-step "list" scripts (short-003 penalty, short-012
   error-recovery, short-016 breathing) have a built-in payoff cadence — prioritize
   them.
4. **Add a low trending sound under the cloned VO** — keep narration primary (brand
   voice, 39/39 narrated); a quiet trending bed can lift FYP eligibility.
5. **No slow fades anywhere** — first frame = motion + name/number, every time.

## Growth lever (what actually moves FYP)
- **Completion rate is the whole game.** With the kinetic hook live, the one
  measurable win is whether avg watch / completion climbs on the first kinetic
  TikToks vs the static four. Pull it from TikTok native analytics next cycle —
  it's the proxy we can eventually read; likes are too thin.
- **Model the proven structures:** across the queue the two repeatable shapes are
  **specificity/number-led** (short-037's "10-second trick", short-038's "the stat
  nobody tells you — *almost everyone* chokes" — note: **no percentage in the
  script; don't invent one**) and **named-athlete** (LeBron/Giannis/Yamal — each
  **[VERIFY]** before posting). Lead the next batch with these.
- **Cadence:** TikTok is at 4 posts vs YouTube's 10. Work toward 1/day of
  kinetic-rendered posts (under the 3/day cap) to give FYP enough at-bats.
- **Replays beat likes.** Sub-30s "list" cuts are most likely to loop; a loop is
  two completions. Favor them when choosing what to post next.

## Prioritized action list
1. **Re-cut & re-post short-001 → short-004 from the live kinetic template** —
   highest leverage (only static-wall TikToks live).
2. **Verify burned-in word-by-word captions on the TikTok export.**
3. **Next batch = specificity/number-led + named-athlete hooks**, sub-30s,
   list-structure first (short-037, short-016, short-012). **[VERIFY]** all name
   claims; **don't invent stats.**
4. **Pull completion / avg-watch from TikTok native analytics next cycle** and
   compare kinetic vs static — the real scoreboard while views stay unreadable.
5. **Add a low trending sound bed** under the cloned VO on TikTok exports.
6. **Ramp toward 1 kinetic post/day** (within the 3/day cap).
