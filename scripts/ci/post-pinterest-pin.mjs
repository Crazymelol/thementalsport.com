#!/usr/bin/env node
// Renders the next pinterest-pending item from social/youtube-queue/queue.json
// with Remotion, uploads it to Pinterest as a video Pin, and marks the item
// posted (tracked separately from the YouTube `status` field via
// `pinterest_status`, so the same queue feeds both platforms independently).
//
// Auth (two supported modes):
//   - Unattended (preferred): PINTEREST_CLIENT_ID + PINTEREST_CLIENT_SECRET +
//     PINTEREST_REFRESH_TOKEN — refreshes its own access token every run, so
//     it keeps posting forever without human touch.
//   - Quick start: PINTEREST_ACCESS_TOKEN — a token pasted straight from the
//     Pinterest developer dashboard. Works immediately but expires, so it
//     needs periodic manual renewal. Used only if no refresh token is set.
//
// PINTEREST_BOARD_ID is optional: if unset, the poster reuses the account's
// first board (or creates one named "Mental Sport").
// (see scripts/ci/get-pinterest-refresh-token.mjs for the refresh-token setup.)

import {execFileSync} from 'node:child_process';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const QUEUE_PATH = path.join(ROOT, 'social/youtube-queue/queue.json');
const REMOTION_DIR = path.join(ROOT, 'remotion');
const DEST_LINK = 'https://thementalsport.com/start-here';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function getAccessToken() {
  // Refresh-token mode is preferred (unattended forever). If no refresh token
  // is configured, fall back to a directly-supplied access token so the poster
  // can run before the full OAuth setup is in place.
  if (!process.env.PINTEREST_REFRESH_TOKEN && process.env.PINTEREST_ACCESS_TOKEN) {
    return process.env.PINTEREST_ACCESS_TOKEN;
  }

  const clientId = requireEnv('PINTEREST_CLIENT_ID');
  const clientSecret = requireEnv('PINTEREST_CLIENT_SECRET');
  const refreshToken = requireEnv('PINTEREST_REFRESH_TOKEN');

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch('https://api.pinterest.com/v5/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error(`Pinterest token refresh failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function registerVideoUpload(accessToken) {
  const res = await fetch('https://api.pinterest.com/v5/media', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({media_type: 'video'}),
  });

  if (!res.ok) {
    throw new Error(`Pinterest media register failed: ${res.status} ${await res.text()}`);
  }

  return res.json(); // {media_id, upload_url, upload_parameters}
}

async function uploadVideoFile(uploadUrl, uploadParameters, videoPath) {
  const form = new FormData();
  for (const [key, value] of Object.entries(uploadParameters)) {
    form.append(key, value);
  }
  form.append('file', new Blob([fs.readFileSync(videoPath)]), path.basename(videoPath));

  const res = await fetch(uploadUrl, {method: 'POST', body: form});
  if (!res.ok) {
    throw new Error(`Pinterest video upload failed: ${res.status} ${await res.text()}`);
  }
}

async function waitForMediaReady(accessToken, mediaId) {
  for (let i = 0; i < 30; i++) {
    const res = await fetch(`https://api.pinterest.com/v5/media/${mediaId}`, {
      headers: {Authorization: `Bearer ${accessToken}`},
    });
    if (!res.ok) {
      throw new Error(`Pinterest media status check failed: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    if (data.status === 'succeeded') return;
    if (data.status === 'failed') {
      throw new Error(`Pinterest media processing failed: ${JSON.stringify(data)}`);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error('Pinterest media processing timed out');
}

async function resolveBoardId(accessToken) {
  if (process.env.PINTEREST_BOARD_ID) {
    return process.env.PINTEREST_BOARD_ID;
  }

  const res = await fetch('https://api.pinterest.com/v5/boards?page_size=25', {
    headers: {Authorization: `Bearer ${accessToken}`},
  });
  if (!res.ok) {
    throw new Error(`Pinterest list-boards failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  if (data.items && data.items.length > 0) {
    console.log(`Using existing board: "${data.items[0].name}" (${data.items[0].id})`);
    return data.items[0].id;
  }

  console.log('No boards found; creating "Mental Sport"...');
  const createRes = await fetch('https://api.pinterest.com/v5/boards', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Mental Sport',
      description: 'Sports psychology & mental-performance tips for athletes, parents and coaches.',
    }),
  });
  if (!createRes.ok) {
    throw new Error(`Pinterest create-board failed: ${createRes.status} ${await createRes.text()}`);
  }
  const board = await createRes.json();
  console.log(`Created board: "${board.name}" (${board.id})`);
  return board.id;
}

function extractCoverImage(videoPath, outPath) {
  // ffmpeg-static ships a binary so we don't depend on the runner having one.
  const ffmpeg = ffmpegStatic || 'ffmpeg';
  execFileSync(ffmpeg, [
    '-y',
    '-i', videoPath,
    '-ss', '00:00:00.5',
    '-vframes', '1',
    outPath,
  ], {stdio: 'inherit'});
}

async function main() {
  const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8'));
  const item = queue.items.find((i) => i.pinterest_status !== 'posted');

  if (!item) {
    console.log('No pinterest-pending items in queue.json. Nothing to post.');
    return;
  }

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

  const coverPath = path.join(REMOTION_DIR, 'out', `${item.id}-cover.jpg`);
  extractCoverImage(videoPath, coverPath);

  const accessToken = await getAccessToken();
  const boardId = await resolveBoardId(accessToken);

  console.log('Registering video upload...');
  const {media_id, upload_url, upload_parameters} = await registerVideoUpload(accessToken);

  console.log('Uploading video...');
  await uploadVideoFile(upload_url, upload_parameters, videoPath);

  console.log('Waiting for Pinterest to process video...');
  await waitForMediaReady(accessToken, media_id);

  const title = item.title.replace(/\s*#Shorts$/i, '').slice(0, 100);
  const description = `${item.hook}\n\n${item.cta}`.slice(0, 800);

  console.log('Creating pin...');
  const pinRes = await fetch('https://api.pinterest.com/v5/pins', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      board_id: boardId,
      title,
      description,
      link: DEST_LINK,
      media_source: {
        source_type: 'video_id',
        media_id,
        cover_image_content_type: 'image/jpeg',
        cover_image_data: fs.readFileSync(coverPath).toString('base64'),
      },
    }),
  });

  if (!pinRes.ok) {
    throw new Error(`Pinterest pin creation failed: ${pinRes.status} ${await pinRes.text()}`);
  }

  const pin = await pinRes.json();
  console.log(`Pinned: https://pinterest.com/pin/${pin.id}`);

  item.pinterest_status = 'posted';
  item.pinterest_posted_at = new Date().toISOString();
  item.pinterest_pin_id = pin.id;

  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2) + '\n');
  console.log(`Marked ${item.id} as posted on Pinterest.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
