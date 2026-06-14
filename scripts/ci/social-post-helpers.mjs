// Shared helpers for the agent-browser-based CI posters (X, TikTok).
//
// Both posters follow the same shape as post-pinterest-pin.mjs: pick the
// next item from social/youtube-queue/queue.json whose platform-specific
// `*_status` field isn't 'posted', render it with Remotion if needed, post
// it, then write the status/timestamp back so the same item is never
// re-posted to that platform.
//
// Caption rotation can't use rotation.py's ~/.local/state file (CI runners
// are ephemeral), so `pickRotation`/`advanceRotation` persist a per-platform
// index in queue.json's `caption_rotation` object instead — same
// no-repeat-until-cycle-completes behavior as rotation.pick_lru.

import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, '../..');
export const QUEUE_PATH = path.join(ROOT, 'social/youtube-queue/queue.json');
export const REMOTION_DIR = path.join(ROOT, 'remotion');

export function loadQueue() {
  return JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8'));
}

export function saveQueue(queue) {
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2) + '\n');
}

export function ensureRendered(item) {
  const videoPath = path.join(REMOTION_DIR, 'out', `${item.id}.mp4`);
  if (!fs.existsSync(videoPath)) {
    console.log(`Rendering ${item.id}: "${item.title}"`);
    execFileSync('npx', ['tsx', 'src/render-queue.ts', item.id], {
      cwd: REMOTION_DIR,
      stdio: 'inherit',
    });
  }
  if (!fs.existsSync(videoPath)) {
    throw new Error(`Render did not produce ${videoPath}`);
  }
  return videoPath;
}

export function pickRotation(queue, key, items) {
  queue.caption_rotation ||= {};
  const idx = (queue.caption_rotation[key] || 0) % items.length;
  return items[idx];
}

export function advanceRotation(queue, key, items) {
  queue.caption_rotation ||= {};
  const idx = (queue.caption_rotation[key] || 0) % items.length;
  queue.caption_rotation[key] = (idx + 1) % items.length;
}

// Cookie-Editor JSON export -> Playwright storage state, for `agent-browser
// state load`. Mirrors sync_state() in the old post-x-daily.py /
// post-pinterest-daily.py scripts.
const SAME_SITE = {lax: 'Lax', strict: 'Strict', no_restriction: 'None'};

export function cookiesToStorageState(cookiesJson) {
  const cookies = JSON.parse(cookiesJson);
  return {
    cookies: cookies.map((c) => {
      const cookie = {
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path || '/',
        secure: !!c.secure,
        httpOnly: !!c.httpOnly,
        sameSite: SAME_SITE[c.sameSite] || 'None',
      };
      if (c.expirationDate) cookie.expires = Math.floor(c.expirationDate);
      return cookie;
    }),
    origins: [],
  };
}

// Never throws — agent-browser commands return non-zero on plenty of
// non-fatal "not found" cases, and callers want stdout+stderr either way.
export function ab(...args) {
  const res = spawnSync('agent-browser', args.map(String), {encoding: 'utf-8'});
  return ((res.stdout || '') + (res.stderr || '')).trim();
}

// Finds a `ref=eNN` in an `agent-browser snapshot -i` dump for a line that
// looks like a file-upload input (hidden inputs included). Same heuristic as
// the old post-x-daily.py's file-input search.
export function findFileInputRef(snapshot) {
  for (const line of snapshot.split('\n')) {
    const lower = line.toLowerCase();
    if (lower.includes('choose file') || (lower.includes('file') && lower.includes('ref=e'))) {
      const m = line.match(/ref=(e\d+)/);
      if (m) return '@' + m[1];
    }
  }
  return null;
}

// Finds the first ref whose line matches ALL given substrings/regexes
// (case-insensitive for strings). Used for TikTok's caption box / Post
// button, whose class names are hashed and change often.
export function findRef(snapshot, matchers) {
  for (const line of snapshot.split('\n')) {
    const lower = line.toLowerCase();
    const ok = matchers.every((m) => (m instanceof RegExp ? m.test(line) : lower.includes(m.toLowerCase())));
    if (ok) {
      const m = line.match(/ref=(e\d+)/);
      if (m) return '@' + m[1];
    }
  }
  return null;
}
