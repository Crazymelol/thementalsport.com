"""Dedup guard for post-youtube-daily.py — guarantees each title posts EXACTLY ONCE.

Drop this file next to post-youtube-daily.py, then in its main():

    from yt_dedup import choose_title, mark_posted

    title = choose_title(book, hooks)          # instead of random.choice(hooks[book])
    if title is None:
        print('Nothing new to post — skipping. (Better silent than duplicate.)')
        sys.exit(0)
    ...
    # after the upload succeeds:
    mark_posted(title)

Selection order:
1. Fresh scripts from the GitHub queue (social/youtube-queue/queue.json) not yet posted.
2. Fallback: hooks from the local list that have NEVER been posted (tracked in a local log).
3. Nothing left -> returns None -> the bot posts NOTHING. It can never repeat itself.

Also enforces a hard cap of MAX_PER_DAY uploads per rolling 24h.
"""
import json
import time
import urllib.request
from pathlib import Path

POSTED_LOG = Path.home() / '.local/state/yt-posted-log.json'
QUEUE_RAW_URL = ('https://raw.githubusercontent.com/Crazymelol/'
                 'thementalsport.com/master/social/youtube-queue/queue.json')
MAX_PER_DAY = 3


def _load_log():
    if POSTED_LOG.exists():
        return json.loads(POSTED_LOG.read_text())
    return {'posted_titles': [], 'timestamps': []}


def _save_log(log):
    POSTED_LOG.parent.mkdir(parents=True, exist_ok=True)
    POSTED_LOG.write_text(json.dumps(log, indent=2))


def _daily_cap_reached(log):
    cutoff = time.time() - 86400
    return len([t for t in log['timestamps'] if t > cutoff]) >= MAX_PER_DAY


def choose_title(book, hooks):
    """Return a never-posted title, or None when there is nothing new to post."""
    log = _load_log()
    if _daily_cap_reached(log):
        return None

    # 1) Fresh scripts from the GitHub queue (works only if the repo is public;
    #    any failure just falls through to the local-hooks path).
    try:
        with urllib.request.urlopen(QUEUE_RAW_URL, timeout=10) as r:
            queue = json.loads(r.read())
        for item in queue['items']:
            if item['status'] == 'pending' and item['title'] not in log['posted_titles']:
                return item['title']
    except Exception:
        pass

    # 2) Local hooks for this book, never-posted only.
    for h in hooks.get(book, []):
        full = f'{h} #Shorts'
        if full not in log['posted_titles'] and h not in log['posted_titles']:
            return full

    # 3) Everything has been posted once already.
    return None


def mark_posted(title):
    log = _load_log()
    log['posted_titles'].append(title)
    log['timestamps'].append(time.time())
    _save_log(log)
