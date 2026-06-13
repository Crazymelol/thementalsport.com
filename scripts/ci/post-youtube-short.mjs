#!/usr/bin/env node
// Renders the next pending item from social/youtube-queue/queue.json with
// Remotion, uploads it to YouTube as a Short, and marks the item "posted".
//
// Requires env vars: YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN
// (see scripts/ci/get-refresh-token.mjs for how to obtain the refresh token).

import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {google} from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const QUEUE_PATH = path.join(ROOT, 'social/youtube-queue/queue.json');
const REMOTION_DIR = path.join(ROOT, 'remotion');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function main() {
  const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8'));
  const item = queue.items.find((i) => i.status === 'pending');

  if (!item) {
    console.log('No pending items in queue.json. Nothing to post.');
    return;
  }

  console.log(`Rendering ${item.id}: "${item.title}"`);
  execFileSync('npx', ['tsx', 'src/render-queue.ts', item.id], {
    cwd: REMOTION_DIR,
    stdio: 'inherit',
  });

  const videoPath = path.join(REMOTION_DIR, 'out', `${item.id}.mp4`);
  if (!fs.existsSync(videoPath)) {
    throw new Error(`Render did not produce ${videoPath}`);
  }

  const oauth2Client = new google.auth.OAuth2(
    requireEnv('YT_CLIENT_ID'),
    requireEnv('YT_CLIENT_SECRET'),
  );
  oauth2Client.setCredentials({refresh_token: requireEnv('YT_REFRESH_TOKEN')});

  const youtube = google.youtube({version: 'v3', auth: oauth2Client});

  const title = item.title.slice(0, 100);
  const description = item.description || `${item.hook}\n\n${item.cta}`;

  console.log(`Uploading "${title}" to YouTube...`);
  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title,
        description,
        tags: item.tags,
        categoryId: '22', // People & Blogs
      },
      status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: fs.createReadStream(videoPath),
    },
  });

  const videoId = res.data.id;
  console.log(`Uploaded: https://youtube.com/watch?v=${videoId}`);

  item.status = 'posted';
  item.posted_at = new Date().toISOString();
  item.youtube_id = videoId;

  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2) + '\n');
  console.log(`Marked ${item.id} as posted.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
