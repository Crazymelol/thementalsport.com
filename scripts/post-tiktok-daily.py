#!/usr/bin/env python3
"""
Upload today's video to TikTok via TiktokAutoUploader (stealth browser).
Reads /tmp/daily-manifest.json for video path and book details.

PATCHED 2026-06-12 — drop-in replacement; needs rotation.py in the same folder.
- TIKTOK_LOCK is now actually checked at the top of main() — previously it was
  written but never read, so the "one video per day" comment was not enforced
  and every cron slot would post again.
- Caption hook now comes from rotation.pick_lru, which cycles through
  CAPTION_HOOKS without repeating one before the others are used (the old
  CAPTION_HOOKS[day_idx % 7] just repeated the same 7-day pattern forever).

PATCHED 2026-06-13 — now prefers ANIM_PATH (a Remotion-rendered short, see
render-daily-short.py) over make-tiktok-7sec.py, which was producing a plain
white generic clip. make-tiktok-7sec.py is now only a fallback for days
ANIM_PATH isn't set.
"""
import json, os, sys, subprocess, pickle
from pathlib import Path

from rotation import pick_lru

MANIFEST = '/tmp/daily-manifest.json'
UPLOADER_DIR = Path.home() / 'TiktokAutoUploader'
COOKIES_SRC = Path.home() / '.local/credentials/tiktok_cookies.json'
COOKIE_FILE = UPLOADER_DIR / 'CookiesDir/tiktok_session-giannisnotaras3.cookie'
ACCOUNT = 'giannisnotaras3'

def refresh_cookies():
    cookies = json.loads(COOKIES_SRC.read_text())
    converted = [{'name':c['name'],'value':c['value'],'domain':c['domain'],
                  'path':c.get('path','/'),'secure':c.get('secure',False),
                  'httpOnly':c.get('httpOnly',False),
                  'expiry':int(c['expirationDate']) if c.get('expirationDate') else None}
                 for c in cookies]
    COOKIE_FILE.parent.mkdir(exist_ok=True)
    with open(COOKIE_FILE,'wb') as f:
        pickle.dump(converted, f)

TIKTOK_LOCK = Path('/tmp/tiktok-posted-today.txt')  # one video per day

CAPTION_HOOKS = [
    "Most athletes choke under pressure for this one reason 👇",
    "I worked with 400+ athletes. This mental mistake kills performance every time.",
    "Your nerves before competition aren't weakness. Here's what they actually are 👇",
    "Elite athletes don't feel confident. They do this instead.",
    "The week before competition, most athletes do the worst thing possible.",
    "Why you perform worse when it matters most (and exactly how to fix it).",
    "This 60-second protocol drops heart rate before any competition.",
]

def main():
    import datetime
    now = datetime.datetime.now()
    today = str(now.date())

    if TIKTOK_LOCK.exists() and TIKTOK_LOCK.read_text().strip() == today:
        print(f'TikTok: already posted today ({today}), skipping')
        return

    if not os.path.exists(MANIFEST):
        print(f'ERROR: {MANIFEST} not found'); sys.exit(1)

    m = json.load(open(MANIFEST))
    anim_path = os.environ.get('ANIM_PATH', '')
    if anim_path and os.path.exists(anim_path) and os.path.getsize(anim_path) > 10000:
        # Prefer the Remotion short (on-brand vertical caption video, see
        # render-daily-short.py) over make-tiktok-7sec.py's plain white clip.
        tiktok_video = anim_path
        print(f'TikTok: using Remotion short {tiktok_video}')
    else:
        comp = os.environ.get('TIKTOK_COMP', 'Confidence')
        tiktok_video = '/tmp/tiktok-7sec.mp4'
        sub = subprocess.run(
            ['python3', str(Path(__file__).parent / 'make-tiktok-7sec.py'), comp, tiktok_video, anim_path],
            capture_output=True, text=True, timeout=300)
        print(sub.stdout.strip())
        if sub.returncode != 0 or not (os.path.exists(tiktok_video) and os.path.getsize(tiktok_video) > 10000):
            print('STDERR:', sub.stderr[-300:])
            tiktok_video = m['video_path']
            print(f'TikTok: 7sec build failed, falling back to {tiktok_video}')
    hook = pick_lru('tiktok-caption', CAPTION_HOOKS)
    caption = (
        f'{hook}\n\n'
        f'Free guide → thementalsport.com/free\n\n'
        f'#sportpsychology #mentalcoach #athletemindset #mentaltoughness #peakperformance'
    )

    refresh_cookies()

    env = os.environ.copy()
    env['PATH'] = '/home/notaras/.nvm/versions/node/v24.12.0/bin:' + env.get('PATH', '')

    result = subprocess.run(
        ['python3', 'cli.py', 'upload', '--user', ACCOUNT,
         '-v', tiktok_video, '-t', caption[:2200]],
        cwd=str(UPLOADER_DIR),
        capture_output=True, text=True, timeout=300,
        env=env
    )
    print(result.stdout)
    if result.returncode != 0:
        print('STDERR:', result.stderr[-300:])
        sys.exit(1)

    TIKTOK_LOCK.write_text(today)
    print(f'TikTok: posted successfully, locked for today ({today})')

if __name__ == '__main__':
    main()
