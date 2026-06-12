"""Least-recently-used picker for caption/hashtag rotation lists.

Drop-in fix for `items[day_idx % len(items)]`-style patterns, which can
collapse onto a handful of indices when callers run multiple times per day
or skip days. pick_lru() persists which items have already been used in
~/.local/state/<list_id>-rotation.json and always returns the
least-recently-used item, cycling back to the start once every item in the
list has been used. Unlike yt_dedup.choose_title (unique content, never
repeats), this is for flavor variations where cycling forever is correct.
"""
import json
from pathlib import Path

STATE_DIR = Path.home() / '.local/state'


def pick_lru(list_id, items):
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    state_file = STATE_DIR / f'{list_id}-rotation.json'
    used = json.loads(state_file.read_text()) if state_file.exists() else []
    used = [u for u in used if u in items]
    remaining = [i for i in items if i not in used]
    if not remaining:
        used = []
        remaining = items
    pick = remaining[0]
    used.append(pick)
    state_file.write_text(json.dumps(used))
    return pick
