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
  // Pinterest hides the real <input type=file> behind a styled "File Upload"
  // button; target the input directly. (Uploading to the button leaves the
  // form disabled with "No file chosen".)
  ab('upload', 'input[type="file"]', videoPath);
  console.log(`  Attached: ${path.basename(videoPath)}`);

  // The whole form stays disabled until Pinterest finishes transcoding the
  // video. Poll until the Title field becomes editable (up to ~2.5 min).
  let titleRef = null;
  for (let i = 0; i < 15; i++) {
    ab('wait', '--timeout', '10000');
    snap = ab('snapshot', '-i');
    const line = snap.split('\n').find((l) => /textbox "title"/i.test(l));
    if (line && !/disabled/i.test(line)) {
      const m = line.match(/ref=(e\d+)/);
      titleRef = m && '@' + m[1];
      break;
    }
  }
  if (!titleRef) fail('Pinterest form never became editable — upload/transcode likely failed', snap);
  console.error('=== PINTEREST ENABLED FORM ===\n' + snap + '\n=== END ===');

  ab('click', titleRef);
  ab('fill', titleRef, title);

  // IMPORTANT: agent-browser refs are snapshot-specific and go stale after
  // interactions, so re-snapshot before every lookup. (Reusing the poll-loop
  // snapshot pointed a stale ref at the account-menu button and opened it.)

  // Destination link → /free (drives signup clicks).
  snap = ab('snapshot', '-i');
  const linkRef = findRef(snap, ['textbox', /\blink\b/i]);
  if (linkRef) {
    ab('click', linkRef);
    ab('fill', linkRef, FREE_GUIDE_URL);
  } else {
    console.warn('  (destination-link field not found — posting without it)');
  }

  // Pinterest requires a board before it will publish. Open the board
  // dropdown (fresh snapshot) and pick the first real board.
  snap = ab('snapshot', '-i');
  const boardBtn = findRef(snap, ['button', /choose a board|select board/i]);
  if (boardBtn) {
    ab('click', boardBtn);
    ab('wait', '--timeout', '2500');
    const boardSnap = ab('snapshot', '-i');
    console.error('=== PINTEREST BOARD DROPDOWN ===\n' + boardSnap + '\n=== END ===');
    const boardOpt =
      findRef(boardSnap, ['option']) || findRef(boardSnap, ['button', /save to|board/i]);
    if (boardOpt) {
      ab('click', boardOpt);
      ab('wait', '--timeout', '1500');
    }
  }

  // Publish — the button is "Create new Pin". Don't click it while it's
  // disabled (that would false-positive mark the item posted), and verify we
  // actually left the create page afterward.
  snap = ab('snapshot', '-i');
  const pubLine = snap.split('\n').find((l) => /button "create new pin/i.test(l));
  if (!pubLine) fail('Could not find the "Create new Pin" button', snap);
  if (/disabled/i.test(pubLine)) {
    fail('"Create new Pin" still disabled (board not chosen or upload incomplete)', snap);
  }
  ab('click', '@' + pubLine.match(/ref=(e\d+)/)[1]);
  ab('wait', '--timeout', '12000');
  const afterUrl = ab('eval', 'location.href');
  if (/pin-creation-tool|pin-builder/i.test(afterUrl)) {
    fail('Pin did not publish (still on the create page after clicking)', ab('snapshot', '-i'));
  }

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
