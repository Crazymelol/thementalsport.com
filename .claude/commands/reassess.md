---
description: "Reassess a platform's performance and write a concrete, view-driving strategy report (diagnosis + title/hook rewrites + actions)"
argument-hint: "[platform] (default: youtube — the only platform with autonomous stats today)"
---

# Reassess

Runs the per-platform strategist on current performance data and writes a fresh
strategy report the owner can act on. The point is **views**, not process.

## Steps

1. Parse `$ARGUMENTS` for a platform (default `youtube`). Only `youtube` has a
   strategist today; others are added by replicating `youtube-strategist.md`.
2. Make sure the data is current: if `STATUS.md` is stale or missing, mention it
   (it's refreshed by `.github/workflows/report.yml` / `social-report.mjs` in CI).
3. Dispatch the `<platform>-strategist` agent (Agent tool,
   `subagent_type: youtube-strategist`). It reads `STATUS.md` + the queue and
   returns the strategy report.
4. Write the report to `social/strategy/<platform>.md` (overwrite — it's a living
   doc) and commit: `reassess: <platform> strategy <date>`.
5. **Apply only safe mechanical changes** automatically (e.g., rotate a poster's
   caption-hook bank toward what's winning). **Surface creative changes** — title
   rewrites, hook rewrites, format changes — as a short list for the owner to
   approve. Never auto-edit public-facing titles/hooks in `queue.json`.
6. Report a tight summary: the one-sentence diagnosis, the top 3 actions, and what
   (if anything) was auto-applied vs. awaiting approval.

Do not post anything. Posting stays on the scheduled workflows + the QA gate.
