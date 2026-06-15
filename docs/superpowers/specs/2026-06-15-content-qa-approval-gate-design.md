# Content QA Approval Gate — Design

**Date:** 2026-06-15
**Status:** Approved (design), implementing
**Owner ask:** "before posting anything I want an agent that uses Claude Code video
vision to approve the creation (image + sound) and give the green light to be
posted" — and "this will apply to all posts and the long post we do daily."

## 1. Goal

Nothing publishes until a video-vision agent has watched the **final, narrated
render** and approved it. One gate mechanism, applied to every posting surface:

- Shorts → YouTube, X, Pinterest, TikTok (the `social/youtube-queue` pipeline).
- The daily long-form LinkedIn post (`scripts/generate-daily-content.py`).

## 2. Non-goals

- Not a quality *fixer*. The agent judges and records a verdict; it does not
  re-render, re-script, or edit captions.
- Not a new render path. We gate the renders that already exist.
- Not retroactive. Items already in the queue with no `qa_status` keep flowing
  (grandfathered) so the gate doesn't silently halt the live pipeline. Only
  content created from now on (which carries `qa_status`) is gated. The owner
  can opt into strict mode (gate everything) later — see §7.

## 3. The gate flag

Each content item carries one field:

| Field           | Values                              | Meaning |
|-----------------|-------------------------------------|---------|
| `qa_status`     | `pending` / `approved` / `rejected` | green-light state |
| `qa_notes`      | string                              | the agent's verdict summary |
| `qa_reviewed_at`| ISO timestamp                       | when reviewed |

New queue items are created with `qa_status: "pending"`. Posters only publish an
item that is **QA-cleared**:

```js
// social-post-helpers.mjs
export function isQaCleared(item) {
  // Legacy items (added before the gate) have no qa_status and post as before;
  // anything created with the gate must be QA-approved first.
  return item.qa_status === undefined || item.qa_status === 'approved';
}
```

## 4. The reviewer — `.claude/agents/video-qa-approver.md`

A subagent that watches a rendered `.mp4` with the claude-video-vision tools and
returns a structured verdict against four checks:

1. **Visuals & text legibility** — captions on-screen, readable, not clipped/overlapping.
2. **Audio health** — narration present, loudness sane (~-14 to -16 LUFS), no
   long silence, no clipping.
3. **Caption–voice sync** — the spoken words track the on-screen caption screens.
4. **Branding / CTA & content match** — book title, CTA, footer present; the
   video actually matches the item's script (no wrong-content mixups).

It returns `APPROVED` or `REJECTED` plus a one-line reason per check. It does
**not** touch the queue — recording the verdict is the caller's job (separation
of concerns; the agent is a pure judge).

## 5. The driver — `/qa-shorts` command

Given item id(s) (default: every `qa_status: "pending"` item that has narration):

1. Render with voice: `npx tsx src/render-queue.ts <id>` (produces `out/<id>.mp4`).
2. Dispatch `video-qa-approver` on the file.
3. Write the verdict back to `queue.json` (`qa_status`, `qa_notes`,
   `qa_reviewed_at`) and commit.

So the human-in-the-loop is: run `/qa-shorts`, read the verdicts, done. Approved
items flow to the posters on their normal cron; rejected ones stay put.

## 6. Poster gating (surgical)

Each poster's existing one-line selector gains `&& isQaCleared(i)`:

| Poster                  | Before                          | After |
|-------------------------|---------------------------------|-------|
| `post-youtube-short.mjs`| `i.status === 'pending'`        | `… && isQaCleared(i)` |
| `post-x-update.mjs`     | `i.x_status !== 'posted'`       | `… && isQaCleared(i)` |
| `post-pinterest-update` | `i.pinterest_status !== 'posted'`| `… && isQaCleared(i)` |
| `post-tiktok-update.mjs`| `i.tiktok_status !== 'posted'`  | `… && isQaCleared(i)` |

## 7. Daily LinkedIn post (phase 2)

`scripts/generate-daily-content.py` currently generates 9 quote-images + 1 video
and posts to LinkedIn in one run, fired by n8n cron on the owner's server. To
gate it we split it into two phases sharing the same flag:

- **generate + stage** — produce the assets, write a sidecar manifest with
  `qa_status: "pending"`, do **not** post.
- **post-if-approved** — a second entrypoint that posts only when the manifest is
  `approved`.

The QA step between them runs the same `video-qa-approver` on the staged video.
The orchestration (n8n pause-step vs. a small approved-queue the owner clears) is
an implementation detail deferred to phase 2 — it does not change the gate.
Shorts ship first (§3–6) because three new items are mid-flight and need it now.

## 8. Rollout

1. Land the flag, helper, agent, command, and poster gating (this commit).
2. Mark short-037/038/039 `qa_status: "pending"`, QA them as the first real run.
3. Phase 2: split the LinkedIn generator behind the same flag.
