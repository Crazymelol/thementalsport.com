#!/usr/bin/env python3
"""
Pinterest daily poster using agent-browser (Rust CLI, no Playwright).
Reads /tmp/daily-manifest.json. Uses ANIM_PATH env for short video.

PATCHED 2026-06-12 — drop-in replacement; needs rotation.py in the same folder.
- Hashtag sets now come from rotation.pick_lru, which cycles through
  HASHTAG_SETS without repeating one before the others are used (the old
  HASHTAG_SETS[day_idx % 4] / [(day_idx+i) % 4] just repeated a 4-day pattern).
"""
import json, os, sys, subprocess, re
from pathlib import Path

from rotation import pick_lru

MANIFEST = '/tmp/daily-manifest.json'
STATE_FILE = Path.home() / '.local/credentials/pinterest_ab_state.json'
COOKIES_FILE = Path.home() / '.local/credentials/pinterest_cookies.json'

HASHTAG_SETS = [
    '#MentalPerformance #SportsPsychology #Athletes',
    '#MindsetTraining #PeakPerformance #MentalToughness',
    '#SportsMotivation #AthleteMotivation #Resilience',
    '#CompetitiveMindset #WinningMindset #SportsMindset',
]

BOOK_TO_BOARD = {
    'competition-protocol':  'mental-performance-for-athletes',
    'mental-blocks':         'mental-performance-for-athletes',
    'unbreakable':           'sports-psychology-quotes',
    'confidence-building':   'confidence-and-mindset',
    'resilient-confidence':  'confidence-and-mindset',
    'nurturing-self-worth':  'sports-psychology-quotes',
    'physiological-peak':    'mental-performance-for-athletes',
    'adhd-athletes':         'mental-performance-for-athletes',
}


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
    state['cookies'].append({
        'name': '_pinterest_pfob', 'value': 'default',
        'domain': '.pinterest.com', 'path': '/',
        'secure': True, 'httpOnly': False, 'sameSite': 'None',
    })
    STATE_FILE.write_text(json.dumps(state, indent=2))


def find_ref(keyword, snapshot):
    for line in snapshot.splitlines():
        if keyword.lower() in line.lower():
            m = re.search(r'@(e\d+)', line)
            if m:
                return '@' + m.group(1)
    return None


def publish_pin(file_path, title, description, link, board='mental-performance-for-athletes'):
    print(f'  Pinning: {os.path.basename(file_path)}')

    ab('state', 'load', str(STATE_FILE))
    ab('open', 'https://www.pinterest.com/pin-creation-tool/')
    ab('wait', '--load', 'networkidle')

    url = ab('get', 'url')
    if 'gr.pinterest.com' in url or '/el/' in url:
        ab('open', 'https://www.pinterest.com/pin-creation-tool/?locale=en_US')
        ab('wait', '--load', 'networkidle')

    # Upload file
    snap = ab('snapshot', '-i')
    upload_ref = find_ref('upload-input', snap) or find_ref('storyboard-upload', snap)
    if not upload_ref:
        upload_ref = '#storyboard-upload-input'
    ab('upload', upload_ref, file_path)

    # Wait for title
    ab('wait', '--selector', '#storyboard-selector-title', '--timeout', '30000')
    ab('wait', '--timeout', '2000')

    # Fill title
    snap2 = ab('snapshot', '-i')
    title_ref = find_ref('Add a title', snap2) or find_ref('storyboard-selector-title', snap2)
    ab('fill', title_ref or '#storyboard-selector-title', title[:100])

    # Fill link
    snap3 = ab('snapshot', '-i')
    link_ref = find_ref('WebsiteField', snap3) or find_ref('Add a link', snap3)
    if link_ref:
        ab('fill', link_ref, link)

    # Description (optional)
    snap4 = ab('snapshot', '-i')
    desc_ref = find_ref('description', snap4) or find_ref('Tell everyone', snap4)
    if desc_ref:
        ab('fill', desc_ref, description[:500])

    # Board dropdown
    snap5 = ab('snapshot', '-i')
    board_btn = find_ref('board-dropdown-select-button', snap5) or find_ref('Choose a board', snap5)
    if board_btn:
        ab('click', board_btn)
        ab('wait', '--timeout', '1000')
        snap6 = ab('snapshot', '-i')
        search_ref = find_ref('Search boards', snap6) or find_ref('board-search', snap6)
        if search_ref:
            ab('fill', search_ref, board.replace('-', ' '))
            ab('wait', '--timeout', '1000')
        snap7 = ab('snapshot', '-i')
        board_ref = find_ref(board.replace('-', ' '), snap7)
        if board_ref:
            ab('click', board_ref)
        else:
            ab('eval', f"Array.from(document.querySelectorAll('[data-test-id=\"board-row\"],[role=\"option\"]')).find(e=>e.textContent.toLowerCase().includes('{board.replace('-',' ')}'))?.click()")
        ab('wait', '--timeout', '1000')

    # Publish
    snap8 = ab('snapshot', '-i')
    pub_ref = find_ref('Publish', snap8) or find_ref('Δημοσίευση', snap8)
    if pub_ref:
        ab('click', pub_ref)
    else:
        ab('eval', "Array.from(document.querySelectorAll('button')).find(b=>/publish|δημοσίευση/i.test(b.textContent))?.click()")

    ab('wait', '--timeout', '4000')
    print(f'  Posted: {os.path.basename(file_path)}')
    return True


def main():
    if not os.path.exists(MANIFEST):
        print(f'ERROR: manifest not found at {MANIFEST}')
        sys.exit(1)

    sync_state()

    m = json.load(open(MANIFEST))
    featured_title = m['book_title']
    featured_url = m['url']
    image_paths = m['image_paths']
    anim_path = os.environ.get('ANIM_PATH', '')
    video_path = anim_path if anim_path and os.path.exists(anim_path) and os.path.getsize(anim_path) > 10000 else m['video_path']
    image_meta = m['image_meta']
    book_id = m.get('book_id', '')
    board = BOOK_TO_BOARD.get(book_id, 'mental-performance-for-athletes')

    print(f"Posting to Pinterest — {featured_title}, board: {board}, {len(image_paths)} images")

    # Ensure clean session start
    subprocess.run(['agent-browser', 'close', '--all'], capture_output=True)

    hashtags = pick_lru('pinterest-hashtags', HASHTAG_SETS)
    video_desc = (f"Today's featured book: {featured_title}\n\n"
                  f"Get it: {featured_url}\n"
                  f"Free guide: thementalsport.com/free\n"
                  f"Full course: thementalsport.com/course\n\n{hashtags}")

    publish_pin(video_path, f'{featured_title} — Mental Performance', video_desc, featured_url, board)

    for i, ((img_path, meta)) in enumerate(zip(image_paths, image_meta)):
        title, url, color, quote, attr = meta
        pin_hashtags = pick_lru('pinterest-hashtags', HASHTAG_SETS)
        desc = f'"{quote}"\n— {attr}\n\nFrom: {title}\nGet it: {url}\n\n{pin_hashtags}'
        publish_pin(img_path, title[:60], desc, url, board)
        print(f'  Image {i+1}/{len(image_paths)}: {title}')

    ab('close', '--all')
    print('All Pinterest posts done.')


if __name__ == '__main__':
    main()
