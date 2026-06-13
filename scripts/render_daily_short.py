#!/usr/bin/env python3
"""
Render today's chosen Shorts script via Remotion and print the output path.

This is the missing piece behind the "Prefer the Remotion short" / ANIM_PATH
checks already present in post-youtube-daily.py, post-x-daily.py,
post-pinterest-daily.py and (after this patch) post-tiktok-daily.py: those
scripts have always been ready to use a pre-rendered short, but nothing ever
produced one, so they fell back to the book-promo video (or, for TikTok,
make-tiktok-7sec.py's plain white clip).

Picks the same item yt_dedup.choose_title's primary path would pick (first
queue item whose title hasn't been posted yet), renders it with the Remotion
project in ../remotion, and prints the .mp4 path on stdout.

Usage, near the top of post-all-platforms.sh, before the 4 poster scripts
(optional — see below):

    export ANIM_PATH=$(python3 /path/to/scripts/render_daily_short.py)

Prints nothing (exit 0) if there's nothing fresh to render or the render
fails — every poster script already handles an empty/missing ANIM_PATH by
falling back to its existing behavior, so this is safe to wire in.

PATCHED 2026-06-13 — also importable as a module. post-tiktok-daily.py calls
get_short_path() directly when ANIM_PATH isn't set, so this renderer runs
on its own with no post-all-platforms.sh changes required.
"""
import json
import os
import subprocess
import sys
from pathlib import Path

from yt_dedup import _load_log

REPO_ROOT = Path(__file__).resolve().parent.parent
QUEUE_PATH = REPO_ROOT / 'social/youtube-queue/queue.json'
REMOTION_DIR = REPO_ROOT / 'remotion'


def next_item():
    log = _load_log()
    posted = set(log['posted_titles'])
    queue = json.loads(QUEUE_PATH.read_text())
    for item in queue['items']:
        if item['status'] == 'pending' and item['title'] not in posted:
            return item
    return None


def get_short_path():
    """Render the next pending queue item and return its .mp4 Path, or None.

    Self-contained: installs Remotion's node_modules on first call if
    missing, so callers (e.g. post-tiktok-daily.py) don't need any prior
    setup step beyond having this repo's scripts/ and remotion/ folders.
    """
    item = next_item()
    if item is None:
        return None

    env = os.environ.copy()
    env['PATH'] = '/home/notaras/.nvm/versions/node/v24.12.0/bin:' + env.get('PATH', '')

    if not (REMOTION_DIR / 'node_modules').exists():
        subprocess.run(['npm', 'install'], cwd=str(REMOTION_DIR),
                        capture_output=True, text=True, timeout=600, env=env)

    out_path = REMOTION_DIR / 'out' / f"{item['id']}.mp4"
    result = subprocess.run(
        ['npx', 'tsx', 'src/render-queue.ts', item['id']],
        cwd=str(REMOTION_DIR), capture_output=True, text=True, timeout=300, env=env)

    if result.returncode != 0 or not (out_path.exists() and out_path.stat().st_size > 10000):
        print(result.stderr[-500:], file=sys.stderr)
        return None

    return out_path


def main():
    out_path = get_short_path()
    if out_path is not None:
        print(str(out_path))


if __name__ == '__main__':
    main()
