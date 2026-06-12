# FIX THE YOUTUBE SHORTS BOT — duplicate-upload bug
*2026-06-12 · Why the channel gets 37 views/video and +3 subs/month despite 275 uploads in 30 days*

## The bug
All the bots built on May 15 pick content like this (verbatim from `01-seo-article-generator.json` / `02-social-media-autoposter.json`):

```js
const pick = topics[Math.floor(Math.random() * topics.length)];
```

**Random pick from a small fixed list, with no memory of what was already posted.** The YouTube Shorts bot on your n8n instance uses the same pattern, firing every ~2 hours. Result in the last 30 days: the SAME video uploaded as "new" up to **10 times** ("How To Raise A Mentally Tough Athlete" ×10, "7 Days Before Your Race" ×10, three identical uploads within one hour on June 7). YouTube's repetitive-content systems suppress the whole channel for this, and it risks a "repetitious content" strike that blocks monetization outright.

## Step 1 — TODAY: pause the bot (2 minutes)
Open your n8n (the same instance that runs the daily LinkedIn poster) → **Workflows** → find the one that uploads to YouTube (search "youtube" / "shorts" / "video") → toggle it **Inactive**. Every day it stays on adds ~9 more duplicates.

## Step 2 — Clean the channel (~30 min)
YouTube Studio → Content → Shorts → sort/search by title → for each duplicated title, **keep the single best-performing copy, delete the rest**. Also delete the same-script "— Animated" twin when it posted seconds after the original.

## Step 3 — Switch the bot to the queue (one-time, ~15 min)
This repo now contains the fix:

- **`social/youtube-queue/queue.json`** — a content queue with **18 fresh, unique, ready-to-render Shorts scripts** (title, hook, full script, CTA, description with funnel links, tags). Each item has `status: "pending"`.
- **`n8n-workflows/05-youtube-shorts-queue-poster.json`** — import this into n8n. What it does:
  1. Runs every 8 hours (max 3 posts/day — more than enough; volume was never the problem).
  2. Fetches `queue.json` from GitHub.
  3. Picks the **FIRST item with `status: "pending"`** — deterministic, never random.
  4. **If nothing is pending it posts NOTHING** — it will never loop old content.
  5. Renders + uploads (see below), then commits the item back as `status: "posted"` so it can never be picked again. The dedup state lives in git — visible, auditable, survives restarts.

**The one manual wiring step:** the imported workflow has a placeholder node named **"REPLACE ME"**. Open your OLD YouTube workflow, copy its render + YouTube-upload nodes (the part that turns a script into a video and uploads it), and paste them in place of the placeholder. They'll receive the script as `$json.item` (fields: `title`, `hook`, `script`, `cta`, `description`, `tags`). Then activate 05 and delete/keep-disabled the old workflow.

It needs the same `GITHUB_TOKEN` env var the LinkedIn bot (workflow 02) already uses — write access to this repo.

## How the queue stays full
Claude refills `queue.json` with new scripts in future sessions (the 4 long-form scripts + strategy live in `social/YOUTUBE-RELAUNCH.md`). You can also add items by hand — copy any item block, change `id`, `status: "pending"`. **If the queue runs dry the bot simply goes quiet** — silence is recoverable, duplicate spam is what got the channel buried.

## Also fixed in this commit
The same random-pick bug existed in the two committed sibling bots — both now use deterministic rotation (no repeats until the full list cycles):
- `n8n-workflows/01-seo-article-generator.json` (was re-generating duplicate articles on random topics)
- `n8n-workflows/02-social-media-autoposter.json` (was re-posting random old articles to LinkedIn)

**Re-import both into n8n to replace the running copies** — the fix only takes effect when the running workflows are updated.
