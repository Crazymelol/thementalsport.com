# FIX THE YOUTUBE SHORTS BOT — duplicate-upload bug
*2026-06-12 · Why the channel gets 37 views/video and +3 subs/month despite 275 uploads in 30 days*

**STATUS: patched scripts are ready in `scripts/` in this repo.** All 4 platform
bots (YouTube, X, Pinterest, TikTok) are pre-fixed and committed — STEP 2 is now
just "copy files over", no manual code editing required. STEP 2.5 (new) fixes
TikTok's plain white generic video by wiring in a real renderer — that one
needs one new line in `post-all-platforms.sh`.

## What's happening
The uploader is **`post-youtube-daily.py`** running on your machine via cron (`post-all-platforms.sh` orchestrates it; backups of all of it are in your Google Drive "scripts" folder). It picks a video title **at random from a small hardcoded hooks list** with no memory of what it already posted — same `random.choice` pattern as every bot built on May 15. Result in the last 30 days: the SAME title uploaded as a "new" video up to **10 times** ("How To Raise A Mentally Tough Athlete" ×10, "7 Days Before Your Race" ×10, three identical uploads within one hour on June 7). YouTube suppresses the whole channel for this and it risks a "repetitious content" strike that blocks monetization outright. The TikTok / Pinterest / X sibling bots share the same flaw.

## STEP 0 — FROM YOUR PHONE, RIGHT NOW (2 min): revoke the bot's YouTube access
You don't need your PC to stop the uploads — kill the bot's key instead of the bot:

1. On your phone, open **myaccount.google.com/connections** (Google Account → Security → "Third-party apps & services").
2. Find the entry that has **YouTube** access — it's the custom OAuth app the uploader uses (named after your Google Cloud project, e.g. something like "thementalsport" / "YouTube upload" — NOT "Windsor.ai", NOT "Anthropic/Claude").
3. Tap it → **Remove access / Delete all connections**.

From the next cron run, every upload fails (`creds.refresh` dies). Nothing else breaks: site, books, email, LinkedIn untouched; Windsor keeps reading analytics (its own separate grant). When you're back at the PC, re-authorizing takes 2 minutes — AFTER the dedup fix below is in place.

⚠️ If you see two custom entries with YouTube access and can't tell which is which — remove both. Re-auth later is cheap; another week of duplicate spam is not.

## STEP 1 — at the PC: pause the cron
`crontab -e` → comment out (`#`) the line running `post-all-platforms.sh` (or just the YouTube line inside that script).

## STEP 2 — at the PC: copy the pre-patched scripts (2 min)
This repo's **`scripts/`** folder now contains ready-to-drop-in replacements for
all 4 platform bots, plus two small helper modules they import — everything is
already wired up, no code editing needed:

- `post-youtube-daily.py` — title selection now goes through `yt_dedup.choose_title`
- `post-x-daily.py`, `post-pinterest-daily.py`, `post-tiktok-daily.py` — caption/hashtag
  rotation now goes through `rotation.pick_lru`
- `yt_dedup.py` — new helper used by the YouTube bot
- `rotation.py` — new helper used by the X/Pinterest/TikTok bots
- `render-daily-short.py` — new helper used by STEP 2.5 below

Copy all of `scripts/*.py` from this repo over the matching files in your
existing scripts folder (same place `post-all-platforms.sh` already calls
them from). Keep `make-tiktok-7sec.py`, `generate-daily-content.py`, etc. —
only the 4 poster scripts and the 3 new helpers are part of this fix.

What it guarantees:
- **YouTube**: every title posts **exactly once, ever** (log at `~/.local/state/yt-posted-log.json`),
  hard cap **3 uploads/day**, pulls fresh scripts first from
  `social/youtube-queue/queue.json` in this repo (18 new unique Shorts,
  title/hook/script/CTA/description/tags — Claude keeps refilling it). Queue
  empty + all hooks used → posts **nothing**. Silence is recoverable; duplicate
  spam is what buried the channel.
- **X / Pinterest**: caption hooks and hashtag sets now cycle through their
  full list (8, 4, and 7 items respectively) before any repeat — the old
  `list[day_idx % len(list)]` pattern repeated the same N-day cycle forever.
- **TikTok**: same caption-rotation fix, *plus* its daily-cap lock
  (`TIKTOK_LOCK` / `/tmp/tiktok-posted-today.txt`) is now actually checked at
  the top of `main()` — previously it was written but never read, so "one
  video per day" was not enforced. *Plus* (after STEP 2.5) it posts the same
  on-brand Remotion video as the other platforms instead of
  `make-tiktok-7sec.py`'s plain white clip.

Root cause recap for YouTube specifically: `post-all-platforms.sh` exports
`BOOK_SLOT` to `generate-daily-content.py` but **never** to
`post-youtube-daily.py`, so the old `(day_idx*12+slot) % 15` always saw
`slot=0` — reaching only 5 of 15 titles per book and producing the *same*
title on every same-day cron run. `yt_dedup.choose_title` removes the slot
dependency entirely.

*Alternative architecture (optional): `n8n-workflows/05-youtube-shorts-queue-poster.json` does the same queue logic in n8n, if you ever move the pipeline there.*

## STEP 2.5 — fix TikTok's plain white generic video (one-time, ~5 min)

`post-youtube-daily.py`, `post-x-daily.py` and `post-pinterest-daily.py` were
all already written to "prefer the Remotion short" via an `ANIM_PATH` env var
— but nothing ever set `ANIM_PATH`, because the Remotion renderer didn't
exist yet. TikTok instead ran `make-tiktok-7sec.py` first, which produces a
plain white generic clip. The renderer now exists (`remotion/`, this repo) and
`post-tiktok-daily.py` now prefers `ANIM_PATH` too — it just needs to be set.

1. One-time setup on your machine:
   ```bash
   cd remotion && npm install
   ```
   (downloads Remotion's headless Chrome on first run — needs normal internet,
   no special env vars on a non-sandboxed machine.)

2. In `post-all-platforms.sh`, near the top, **before** the 4 poster scripts
   run, add:
   ```bash
   export ANIM_PATH=$(python3 /path/to/scripts/render-daily-short.py)
   ```
   This renders the same script `post-youtube-daily.py` is about to post
   (1080x1920, on-brand dark caption video, ~30-40s, takes ~1 min to render)
   and points all 4 bots at it. If it prints nothing — queue exhausted or
   render failed — every bot falls back to its previous behavior, so this is
   safe to add even if something goes wrong.

## STEP 3 — clean the channel (~30 min, can wait until PC)
YouTube Studio → Content → Shorts → search each duplicated title → **keep the single best-performing copy, delete the rest** (including same-script "— Animated" twins posted seconds apart).

## STEP 4 — re-authorize and restart
Re-grant YouTube access (run the bot once manually — it triggers the OAuth flow), re-enable cron. From then on it can physically never repeat itself.

## Also fixed in this commit
The two committed n8n sibling bots had the identical random-pick bug — both now use deterministic rotation:
- `n8n-workflows/01-seo-article-generator.json`
- `n8n-workflows/02-social-media-autoposter.json`

(If those run anywhere, re-import them so the running copies get the fix.)
