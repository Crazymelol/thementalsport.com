#!/usr/bin/env node
// Posts the next tiktok-pending item from social/youtube-queue/queue.json to
// TikTok via agent-browser, tracked independently via `tiktok_status` (same
// pattern as Pinterest's `pinterest_status` — see post-pinterest-pin.mjs).
//
// Auth: TIKTOK_COOKIES_JSON — a Cookie-Editor JSON export of a logged-in
// tiktok.com session (array of cookie objects), converted to Playwright
// storage state and loaded via `agent-browser state load`. If unset, this
// script logs and exits 0 so the scheduled run doesn't show as failed while
// credentials are still being set up.
//
// NOTE: TikTok's upload page uses hashed/obfuscated class names that change
// often, so the caption box and Post button are found by scanning an
// `agent-browser snapshot -i` for role/text hints rather than fixed CSS
// selectors. If either lookup fails, the snapshot is dumped to stderr so the
// selectors in findRef() below can be fixed from the dump — expect this to
// need at least one follow-up pass once a real session is available
// (the Pinterest poster took several iterations too).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  ab,
  advanceRotation,
  cookiesToStorageState,
  ensureRendered,
  findFileInputRef,
  findRef,
  isLoginWall,
  loadQueue,
  pickRotation,
  saveQueue,
} from './social-post-helpers.mjs';

const CAPTION_HOOKS = [
  'Most athletes choke under pressure for this one reason 👇',
  'I worked with 400+ athletes. This mental mistake kills performance every time.',
  "Your nerves before competition aren't weakness. Here's what they actually are 👇",
  "Elite athletes don't feel confident. They do this instead.",
  'The week before competition, most athletes do the worst thing possible.',
  'Why you perform worse when it matters most (and exactly how to fix it).',
  'This 60-second protocol drops heart rate before any competition.',
];

function fail(message, snapshot) {
  if (snapshot) console.error(`--- agent-browser snapshot ---\n${snapshot}\n--- end snapshot ---`);
  ab('close', '--all');
  throw new Error(message);
}

async function main() {
  const cookiesJson = process.env.TIKTOK_COOKIES_JSON;
  if (!cookiesJson) {
    console.log('TikTok: TIKTOK_COOKIES_JSON not set — skipping (credentials not configured yet).');
    return;
  }

  const queue = loadQueue();
  const item = queue.items.find((i) => i.tiktok_status !== 'posted');
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

  const stateFile = path.join(os.tmpdir(), 'tiktok_ab_state.json');
  fs.writeFileSync(stateFile, JSON.stringify(cookiesToStorageState(cookiesJson)));

  // Diagnostic (names only, no values): confirms whether the secret actually
  // contains the login cookies. If sessionid/sid_guard are present but we
  // still hit the login wall, TikTok is rejecting the replayed session
  // (datacenter IP / device binding) rather than the export being incomplete.
  const cookieNames = JSON.parse(cookiesJson).map((c) => c.name);
  const hasSession = ['sessionid', 'sid_guard', 'sid_tt'].filter((n) => cookieNames.includes(n));
  console.log(`TikTok cookies in secret: ${cookieNames.length} cookies; login cookies present: [${hasSession.join(', ') || 'NONE'}]`);

  console.log(`Posting to TikTok — ${item.title}`);

  ab('close', '--all');
  ab('state', 'load', stateFile);
  ab('open', 'https://www.tiktok.com/tiktokstudio/upload');
  ab('wait', '--load', 'networkidle');
  ab('wait', '--timeout', '3000');

  let snap = ab('snapshot', '-i');
  if (isLoginWall(snap)) {
    fail(
      'TikTok session not authenticated (landed on the login page). The ' +
        'TIKTOK_COOKIES_JSON secret is missing/expired — re-export tiktok.com ' +
        'with Cookie-Editor (JSON) from a logged-in tab and update the secret.',
      snap,
    );
  }
  const fileRef = findFileInputRef(snap);
  ab('upload', fileRef || 'input[type="file"]', videoPath);
  console.log(`  Attached: ${path.basename(videoPath)}`);

  // Wait for TikTok to upload + process the video — the caption editor only
  // becomes interactive once that's done, which can take 30-90s for a short
  // vertical clip.
  ab('wait', '--timeout', '60000');

  snap = ab('snapshot', '-i');
  const captionRef = findRef(snap, [/textbox|caption/i]);
  if (!captionRef) fail('Could not find TikTok caption input', snap);
  ab('click', captionRef);
  ab('fill', captionRef, caption);

  snap = ab('snapshot', '-i');
  const postRef = findRef(snap, ['button', /^(?!.*schedule).*\bpost\b/i]);
  if (!postRef) fail('Could not find TikTok Post button', snap);
  ab('click', postRef);
  ab('wait', '--timeout', '10000');

  console.log('  Posted to TikTok');
  ab('close', '--all');

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
