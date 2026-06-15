#!/usr/bin/env node
// Posts the next tiktok-pending item from social/youtube-queue/queue.json to
// TikTok, tracked via `tiktok_status` (same pattern as the other posters).
//
// Posting goes through TiktokAutoUploader (scripts/ci/tiktok_upload.py), which
// uploads via TikTok's API using the session cookies. We switched to this from
// agent-browser UI automation because TikTok guards the web "Post" button
// against automation (login + upload + caption all worked, but the final
// publish click was always ignored) — the API path has no such button.
//
// Auth: TIKTOK_COOKIES_JSON — a Cookie-Editor JSON export of a logged-in
// tiktok.com session. If unset, this logs and exits 0 so the run isn't marked
// failed while credentials are being set up.

import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  advanceRotation,
  ensureRendered,
  isQaCleared,
  loadQueue,
  pickRotation,
  saveQueue,
} from './social-post-helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CAPTION_HOOKS = [
  'Most athletes choke under pressure for this one reason 👇',
  'I worked with 400+ athletes. This mental mistake kills performance every time.',
  "Your nerves before competition aren't weakness. Here's what they actually are 👇",
  "Elite athletes don't feel confident. They do this instead.",
  'The week before competition, most athletes do the worst thing possible.',
  'Why you perform worse when it matters most (and exactly how to fix it).',
  'This 60-second protocol drops heart rate before any competition.',
];

async function main() {
  if (!process.env.TIKTOK_COOKIES_JSON) {
    console.log('TikTok: TIKTOK_COOKIES_JSON not set — skipping (credentials not configured yet).');
    return;
  }

  const queue = loadQueue();
  const item = queue.items.find((i) => i.tiktok_status !== 'posted' && isQaCleared(i));
  if (!item) {
    console.log('No tiktok-pending items in queue.json. Nothing to post.');
    return;
  }

  const videoPath = ensureRendered(item);

  const hook = pickRotation(queue, 'tiktok', CAPTION_HOOKS);
  const caption = (
    `${hook}\n\n` +
    `Free guide → thementalsport.com/free\n\n` +
    `#sportpsychology #mentalcoach #athletemindset #mentaltoughness #peakperformance`
  ).slice(0, 2200);

  console.log(`Posting to TikTok — ${item.title}`);
  // Throws on non-zero exit, so a failed upload leaves the item un-posted.
  execFileSync('python3', [path.join(__dirname, 'tiktok_upload.py'), videoPath, caption], {
    stdio: 'inherit',
  });

  advanceRotation(queue, 'tiktok', CAPTION_HOOKS);
  item.tiktok_status = 'posted';
  item.tiktok_posted_at = new Date().toISOString();
  saveQueue(queue);
  console.log(`Marked ${item.id} as posted on TikTok.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
