#!/usr/bin/env node
// Posts the next x-pending item from social/youtube-queue/queue.json to X
// (Twitter) via agent-browser, tracked independently via `x_status` (same
// pattern as Pinterest's `pinterest_status` — see post-pinterest-pin.mjs).
//
// Auth: X_COOKIES_JSON — a Cookie-Editor JSON export of a logged-in x.com
// session (array of cookie objects), converted to Playwright storage state
// and loaded via `agent-browser state load`. If unset, this script logs and
// exits 0 so the scheduled run doesn't show as failed while credentials are
// still being set up.
//
// NOTE: this X account previously showed "graduated access" (requires phone
// verification at x.com/settings before ANY posting works, automated or
// manual). If posting fails with that, re-verify the phone number first —
// no script change will fix it.
//
// Ported from scripts/post-x-daily.py, which has the same selectors working
// against a real logged-in session.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  ab,
  advanceRotation,
  cookiesToStorageState,
  ensureRendered,
  findFileInputRef,
  loadQueue,
  pickRotation,
  saveQueue,
} from './social-post-helpers.mjs';

const CAPTION_HOOKS = [
  'Your mind is the last frontier 🧠',
  'Champions train the muscle between their ears 💪',
  'Mental edge = competitive edge ⚡',
  'The difference is always mental 🔥',
  'Train your brain like you train your body 🏆',
  'Peak performance starts in the mind 🎯',
  'What separates good from great? Mental toughness.',
  'Your thoughts write your performance 📝',
];

async function main() {
  const cookiesJson = process.env.X_COOKIES_JSON;
  if (!cookiesJson) {
    console.log('X: X_COOKIES_JSON not set — skipping (credentials not configured yet).');
    return;
  }

  const queue = loadQueue();
  const item = queue.items.find((i) => i.x_status !== 'posted');
  if (!item) {
    console.log('No x-pending items in queue.json. Nothing to post.');
    return;
  }

  const videoPath = ensureRendered(item);

  const hook = pickRotation(queue, 'x', CAPTION_HOOKS);
  const title = item.title.replace(/\s*#Shorts$/i, '');
  const text = (
    `${hook}\n\n` +
    `${title}\n\n` +
    `🧠 Free guide → thementalsport.com/free\n\n` +
    `#SportsPsychology #MentalPerformance #Athletes #MentalToughness #PeakPerformance`
  ).slice(0, 280);

  const stateFile = path.join(os.tmpdir(), 'x_ab_state.json');
  fs.writeFileSync(stateFile, JSON.stringify(cookiesToStorageState(cookiesJson)));

  console.log(`Posting to X — ${item.title}`);

  ab('close', '--all');
  ab('state', 'load', stateFile);
  ab('open', 'https://x.com/compose/post');
  ab('wait', '--load', 'networkidle');
  ab('wait', '--timeout', '2000');

  // Fill compose box — agent-browser fill triggers React synthetic events
  ab('fill', '[data-testid="tweetTextarea_0"]', text);
  ab('wait', '--timeout', '2000');

  // Find file input via snapshot (Choose Files button)
  const snap = ab('snapshot', '-i');
  const fileRef = findFileInputRef(snap);
  ab('upload', fileRef || 'input[type="file"]', videoPath);
  console.log(`  Attached: ${path.basename(videoPath)}`);
  ab('wait', '--selector', '[data-testid="tweetButtonInline"]:not([aria-disabled="true"])', '--timeout', '120000');

  ab('click', '[data-testid="tweetButtonInline"]');
  ab('wait', '--timeout', '5000');
  const url = ab('eval', 'location.href');
  if (url.includes('graduated-access')) {
    ab('close', '--all');
    throw new Error(
      'X account restricted (graduated access / phone verification required). ' +
        'Fix: go to x.com/settings and verify phone number.',
    );
  }
  console.log('  Posted to X');
  ab('close', '--all');

  advanceRotation(queue, 'x', CAPTION_HOOKS);
  item.x_status = 'posted';
  item.x_posted_at = new Date().toISOString();
  saveQueue(queue);
  console.log(`Marked ${item.id} as posted on X.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
