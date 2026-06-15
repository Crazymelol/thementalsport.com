---
description: "Render queued Shorts with voice, QA them with the video-qa-approver agent, and record the green-light verdict in the queue"
argument-hint: "[short-id ...] (default: every qa_status:pending item that has narration)"
---

# QA Shorts

Drives the publishing gate: render → review → record. Approved items then flow to
the posters on their normal cron; rejected ones stay put until re-rendered.

## Inputs

Parse `$ARGUMENTS` for explicit short ids. If none given, select every item in
`social/youtube-queue/queue.json` where `qa_status === "pending"` **and** all its
narration exists under `remotion/public/audio/<id>/` (hook + caption-N + cta
mp3s). Skip pending items with no narration yet — they need the Voiceover
Generator workflow first; report them as skipped.

## Per item

1. **Render with voice:**
   ```
   cd remotion && npx tsx src/render-queue.ts <id>
   ```
   On a network-restricted box, set the browser env first (the binary path is
   ephemeral — re-find it under `/opt/pw-browsers`):
   ```
   REMOTION_BROWSER_EXECUTABLE=<…/headless_shell> REMOTION_CHROME_MODE=headless-shell
   ```
   Confirm `remotion/out/<id>.mp4` exists.

2. **Review:** dispatch the `video-qa-approver` agent (Agent tool,
   `subagent_type: video-qa-approver`). Pass the absolute mp4 path and the item's
   `id`, `title`, `audience`, `hook`, `script`, `cta` so it can check
   content-match.

3. **Record the verdict** back into the item in `queue.json`:
   - `qa_status`: `"approved"` or `"rejected"` (from the agent's VERDICT)
   - `qa_notes`: the agent's Notes line (or the failing checks)
   - `qa_reviewed_at`: current ISO timestamp

   Write with 2-space indent + trailing newline (match the existing file).

## Finish

Commit the queue change: `QA: <approved/rejected> short-NNN[, …]`. Then report a
one-line-per-item summary table (id → verdict → note) and which items, if any,
were skipped for missing narration. Do **not** post anything — posting stays on
the scheduled workflows, which now require `qa_status === "approved"`.
