#!/usr/bin/env node
// Posts the next pinterest-pending item from social/youtube-queue/queue.json
// to Pinterest via agent-browser + cookies, tracked via `pinterest_status`.
//
// This replaces the old API-based post-pinterest-pin.mjs: the Pinterest API
// "quick-start" access tokens expire every ~30 days and the unattended
// refresh flow needs an approved Pinterest app, so we drive the web
// pin-builder with a logged-in cookie session instead — same approach as the
// X and TikTok posters.
//
// Auth: PINTEREST_COOKIES_JSON — a Cookie-Editor JSON export of a logged-in
// pinterest.com session (array of cookie objects). If unset, this script logs
// and exits 0 so the scheduled run isn't marked failed while credentials are
// being set up.
//
// NOTE: Pinterest's pin-builder uses hashed/obfuscated class names that change
// often, so the title/description/link fields and the Publish button are found
// by scanning an `agent-browser snapshot -i` for role/text hints rather than
// fixed CSS selectors. If a lookup fails the snapshot is dumped to stderr so
// the matchers below can be fixed from the dump — expect this to need a
// follow-up pass once a real session is available (the other posters did too).

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

const FREE_GUIDE_URL = 'https://thementalsport.com/free';

const CAPTION_HOOKS = [
  'The mental game most athletes never train',
  'Why pressure makes some athletes choke — and how to stop it',
  'Sports psychology tips that actually work under pressure',
  'How elite athletes stay calm when it matters most',
  'The pre-competition routine that drops nerves fast',
  'Mental toughness for athletes: where it really comes from',
  'What every sports parent should say after a tough game',
];

function fail(message, snapshot) {
  if (snapshot) console.error(`--- agent-browser snapshot ---\n${snapshot}\n--- end snapshot ---`);
  ab('close', '--all');
  throw new Error(message);
}

async function main() {
  const cookiesJson = process.env.PINTEREST_COOKIES_JSON;
  if (!cookiesJson) {
    console.log('Pinterest: PINTEREST_COOKIES_JSON not set — skipping (credentials not configured yet).');
    return;
  }

  const queue = loadQueue();
  const item = queue.items.find((i) => i.pinterest_status !== 'posted');
  if (!item) {
    console.log('No pinterest-pending items in queue.json. Nothing to post.');
    return;
  }

  const videoPath = ensureRendered(item);

  const hook = pickRotation(queue, 'pinterest', CAPTION_HOOKS);
  const title = item.title.replace(/\s*#Shorts$/i, '').slice(0, 100);
  const description = (
    `${hook}\n\n` +
    `Free mental-game guide → thementalsport.com/free\n\n` +
    `#sportspsychology #mentaltoughness #athletemindset #peakperformance #sportsparents`
  ).slice(0, 500);

  const stateFile = path.join(os.tmpdir(), 'pinterest_ab_state.json');
  fs.writeFileSync(stateFile, JSON.stringify(cookiesToStorageState(cookiesJson)));

  console.log(`Posting to Pinterest — ${item.title}`);

  ab('close', '--all');
  ab('state', 'load', stateFile);
  ab('open', 'https://www.pinterest.com/pin-creation-tool/');
  ab('wait', '--load', 'networkidle');
  ab('wait', '--timeout', '3000');

  let snap = ab('snapshot', '-i');
  if (isLoginWall(snap)) {
    fail(
      'Pinterest session not authenticated (landed on the login page). The ' +
        'PINTEREST_COOKIES_JSON secret is missing/expired — re-export ' +
        'pinterest.com with Cookie-Editor (JSON) and update the secret.',
      snap,
    );
  }
  const fileRef = findFileInputRef(snap);
  ab('upload', fileRef || 'input[type="file"]', videoPath);
  console.log(`  Attached: ${path.basename(videoPath)}`);

  // Pinterest transcodes the uploaded video before the form is fully usable;
  // for a short vertical clip this is typically 30-90s.
  ab('wait', '--timeout', '60000');

  snap = ab('snapshot', '-i');
  const titleRef = findRef(snap, [/title/i]);
  if (!titleRef) fail('Could not find Pinterest title field', snap);
  ab('click', titleRef);
  ab('fill', titleRef, title);

  const descRef = findRef(snap, [/description|tell everyone|about your pin/i]);
  if (descRef) {
    ab('click', descRef);
    ab('fill', descRef, description);
  } else {
    console.warn('  (description field not found — posting without it)');
  }

  // Destination link drives signups (outbound clicks → /free).
  const linkRef = findRef(snap, [/destination link|add a destination|add a link/i]);
  if (linkRef) {
    ab('click', linkRef);
    ab('fill', linkRef, FREE_GUIDE_URL);
  } else {
    console.warn('  (destination-link field not found — posting without it)');
  }

  snap = ab('snapshot', '-i');
  const publishRef = findRef(snap, ['button', /publish|save/i]);
  if (!publishRef) fail('Could not find Pinterest Publish button', snap);
  ab('click', publishRef);
  ab('wait', '--timeout', '10000');

  console.log('  Posted to Pinterest');
  ab('close', '--all');

  advanceRotation(queue, 'pinterest', CAPTION_HOOKS);
  item.pinterest_status = 'posted';
  item.pinterest_posted_at = new Date().toISOString();
  saveQueue(queue);
  console.log(`Marked ${item.id} as posted on Pinterest.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
