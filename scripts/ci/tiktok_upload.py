#!/usr/bin/env python3
# Uploads a local video to TikTok via TiktokAutoUploader (makiisthenes), which
# posts through TikTok's upload API using the session cookies — bypassing the
# web "Post" button that TikTok guards against automation.
#
# Injects cookies from TIKTOK_COOKIES_JSON (a Cookie-Editor export) into the
# tool's CookiesDir as a pickled cookie file, so no interactive login is
# needed. Mirrors the proven conversion from the old scripts/post-tiktok-daily.py.
#
# Args: <video-path> <caption>
# Env:  TIKTOK_COOKIES_JSON (required), TIKTOK_UPLOADER_DIR (default
#       ~/TiktokAutoUploader), TIKTOK_LABEL (cookie label / --user, default
#       'tmsport').

import json
import os
import pickle
import subprocess
import sys
from pathlib import Path


def main():
    if len(sys.argv) < 3:
        sys.exit('usage: tiktok_upload.py <video> <caption>')
    video = os.path.abspath(sys.argv[1])
    caption = sys.argv[2][:2200]

    cookies_json = os.environ.get('TIKTOK_COOKIES_JSON')
    if not cookies_json:
        sys.exit('TIKTOK_COOKIES_JSON not set')

    uploader = Path(os.environ.get('TIKTOK_UPLOADER_DIR', str(Path.home() / 'TiktokAutoUploader')))
    label = os.environ.get('TIKTOK_LABEL', 'tmsport')

    cookies = json.loads(cookies_json)
    converted = [
        {
            'name': c['name'],
            'value': c['value'],
            'domain': c['domain'],
            'path': c.get('path', '/'),
            'secure': c.get('secure', False),
            'httpOnly': c.get('httpOnly', False),
            'expiry': int(c['expirationDate']) if c.get('expirationDate') else None,
        }
        for c in cookies
    ]
    cookie_dir = uploader / 'CookiesDir'
    cookie_dir.mkdir(parents=True, exist_ok=True)
    with open(cookie_dir / f'tiktok_session-{label}.cookie', 'wb') as f:
        pickle.dump(converted, f)

    print(f'Uploading to TikTok via TiktokAutoUploader (label={label})...')
    res = subprocess.run(
        ['python3', 'cli.py', 'upload', '--user', label, '-v', video, '-t', caption],
        cwd=str(uploader),
    )
    if res.returncode != 0:
        sys.exit(f'TiktokAutoUploader failed (exit {res.returncode})')
    print('TikTok upload reported success.')


if __name__ == '__main__':
    main()
