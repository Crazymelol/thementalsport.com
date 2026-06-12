# FIX THE YOUTUBE SHORTS BOT — duplicate-upload bug
*2026-06-12 · Why the channel gets 37 views/video and +3 subs/month despite 275 uploads in 30 days*

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

## STEP 2 — at the PC: apply the dedup patch (5 min)
This repo now contains **`scripts/yt_dedup.py`**. Copy it next to `post-youtube-daily.py`, then in that script's `main()`:

```python
from yt_dedup import choose_title, mark_posted

title = choose_title(book, hooks)      # replaces random.choice(hooks[book])
if title is None:
    print('Nothing new to post — skipping.')
    sys.exit(0)
# ... after the upload succeeds:
mark_posted(title)
```

What it guarantees:
- Every title posts **exactly once, ever** (log at `~/.local/state/yt-posted-log.json`)
- Hard cap **3 uploads/day** (volume was never the problem)
- Pulls **fresh scripts first** from `social/youtube-queue/queue.json` in this repo (18 new unique Shorts, ready: title/hook/script/CTA/description/tags) — Claude keeps refilling it
- Queue empty + all hooks used → it posts **nothing**. Silence is recoverable; duplicate spam is what buried the channel.

Apply the same `choose_title`/`mark_posted` pattern to the TikTok, Pinterest and X bots (same bug).

*Alternative architecture (optional): `n8n-workflows/05-youtube-shorts-queue-poster.json` does the same queue logic in n8n, if you ever move the pipeline there.*

## STEP 3 — clean the channel (~30 min, can wait until PC)
YouTube Studio → Content → Shorts → search each duplicated title → **keep the single best-performing copy, delete the rest** (including same-script "— Animated" twins posted seconds apart).

## STEP 4 — re-authorize and restart
Re-grant YouTube access (run the bot once manually — it triggers the OAuth flow), re-enable cron. From then on it can physically never repeat itself.

## Also fixed in this commit
The two committed n8n sibling bots had the identical random-pick bug — both now use deterministic rotation:
- `n8n-workflows/01-seo-article-generator.json`
- `n8n-workflows/02-social-media-autoposter.json`

(If those run anywhere, re-import them so the running copies get the fix.)
