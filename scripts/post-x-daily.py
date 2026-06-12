#!/usr/bin/env python3
"""
Post today's short video to X (Twitter) via agent-browser (Rust CLI, no Playwright).
Reads /tmp/daily-manifest.json. Uses ANIM_PATH env for short video.

PATCHED 2026-06-12 — drop-in replacement; needs rotation.py in the same folder.
- Caption hook now comes from rotation.pick_lru, which cycles through
  CAPTION_HOOKS without repeating one before the others are used (the old
  CAPTION_HOOKS[day_idx % 8] just repeated the same 8-day pattern forever).
"""
import json, os, sys, subprocess, datetime, re
from pathlib import Path

from rotation import pick_lru

MANIFEST = '/tmp/daily-manifest.json'
COOKIES_FILE = Path.home() / '.local/credentials/x_cookies.json'
STATE_FILE = Path.home() / '.local/credentials/x_ab_state.json'
LOCK_FILE = Path('/tmp/.x_post_lock')

CAPTION_HOOKS = [
    "Your mind is the last frontier 🧠",
    "Champions train the muscle between their ears 💪",
    "Mental edge = competitive edge ⚡",
    "The difference is always mental 🔥",
    "Train your brain like you train your body 🏆",
    "Peak performance starts in the mind 🎯",
    "What separates good from great? Mental toughness.",
    "Your thoughts write your performance 📝",
]


def ab(*args):
    cmd = ['agent-browser'] + [str(a) for a in args]
    r = subprocess.run(cmd, capture_output=True, text=True)
    return (r.stdout + r.stderr).strip()


def sync_state():
    cookies = json.loads(COOKIES_FILE.read_text())
    smap = {'lax': 'Lax', 'strict': 'Strict', 'no_restriction': 'None'}
    state = {'cookies': [], 'origins': []}
    for c in cookies:
        cookie = {
            'name': c['name'], 'value': c['value'],
            'domain': c['domain'], 'path': c.get('path', '/'),
            'secure': c.get('secure', False),
            'httpOnly': c.get('httpOnly', False),
            'sameSite': smap.get(c.get('sameSite', ''), 'None'),
        }
        if c.get('expirationDate'):
            cookie['expires'] = int(c['expirationDate'])
        state['cookies'].append(cookie)
    STATE_FILE.write_text(json.dumps(state, indent=2))


def main():
    today = str(datetime.date.today())
    if LOCK_FILE.exists() and LOCK_FILE.read_text().strip() == today:
        print(f'X: already posted today ({today}), skipping')
        return

    if not os.path.exists(MANIFEST):
        print(f'ERROR: manifest not found at {MANIFEST}')
        sys.exit(1)

    sync_state()

    m = json.load(open(MANIFEST))
    hook = pick_lru('x-caption', CAPTION_HOOKS)

    anim_path = os.environ.get('ANIM_PATH', '')
    video_path = anim_path if anim_path and os.path.exists(anim_path) and os.path.getsize(anim_path) > 10000 else None

    text = (
        f'{hook}\n\n'
        f'{m["book_title"]}\n\n'
        f'🧠 Free guide → thementalsport.com/free\n\n'
        f'#SportsPsychology #MentalPerformance #Athletes #MentalToughness #PeakPerformance'
    )[:280]

    print(f'Posting to X — {m["book_title"]}')

    subprocess.run(['agent-browser', 'close', '--all'], capture_output=True)
    ab('state', 'load', str(STATE_FILE))
    ab('open', 'https://x.com/compose/post')
    ab('wait', '--load', 'networkidle')
    ab('wait', '--timeout', '2000')

    # Fill compose box — agent-browser fill triggers React synthetic events
    ab('fill', '[data-testid="tweetTextarea_0"]', text)
    ab('wait', '--timeout', '2000')

    if video_path:
        # Find file input via snapshot (Choose Files button)
        snap = ab('snapshot', '-i')
        file_ref = None
        for line in snap.splitlines():
            if 'choose files' in line.lower() or ('file' in line.lower() and 'ref=e' in line.lower()):
                m2 = re.search(r'ref=(e\d+)', line)
                if m2:
                    file_ref = '@' + m2.group(1)
                    break
        ab('upload', file_ref or 'input[type="file"]', video_path)
        print(f'  Attached: {os.path.basename(video_path)}')
        ab('wait', '--selector', '[data-testid="tweetButtonInline"]:not([aria-disabled="true"])', '--timeout', '120000')

    ab('click', '[data-testid="tweetButtonInline"]')
    ab('wait', '--timeout', '5000')
    url = ab('eval', 'location.href')
    if 'graduated-access' in url:
        print('ERROR: X account restricted (graduated access / phone verification required)')
        print('  Fix: go to x.com/settings and verify phone number')
        subprocess.run(['agent-browser', 'close', '--all'], capture_output=True)
        sys.exit(1)
    print('  Posted to X')

    subprocess.run(['agent-browser', 'close', '--all'], capture_output=True)
    LOCK_FILE.write_text(today)
    print('X: done')


if __name__ == '__main__':
    main()
