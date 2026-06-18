#!/usr/bin/env node
// Hero / long-form video RENDER + upload LOOP.
//
// Renders the first pending item from social/youtube-hero-queue/queue.json with
// Remotion (the 1920x1080 HeroVideo composition, narrated in Giannis's cloned
// voice), uploads it to YouTube, and marks the item "posted". Same proven
// machinery as post-youtube-short.mjs — just long-form instead of a Short.
//
// Narration is produced by scripts/voiceover/generate.py (Chatterbox) before
// this runs; if it is missing, the render still succeeds with the silent,
// text-timed fallback layout.
//
// Requires env vars: YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN
// (the existing GitHub secrets — the same ones post-youtube-short.mjs uses).

import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {google} from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const QUEUE_PATH = path.join(ROOT, 'social/youtube-hero-queue/queue.json');
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
  const item = queue.items.find((i) => i.status === 'pending' && i.script);

  if (!item) {
    console.log('No pending hero videos to render. Nothing to do.');
    return;
  }

  console.log(`Rendering ${item.id}: "${item.title}"`);
  execFileSync('npx', ['tsx', 'src/render-hero.ts', item.id], {
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
  const sizeMB = (fs.statSync(videoPath).size / (1024 * 1024)).toFixed(1);

  console.log(`Uploading "${title}" (${sizeMB} MB, ${item.privacy || 'public'})...`);
  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title,
        description: item.description || `${item.hook}\n\n${item.cta}`,
        tags: item.tags || [],
        categoryId: item.category_id || '22',
      },
      status: {
        privacyStatus: item.privacy || 'public',
        selfDeclaredMadeForKids: false,
      },
    },
    media: {body: fs.createReadStream(videoPath)},
  });

  const videoId = res.data.id;
  console.log(`Uploaded: https://youtube.com/watch?v=${videoId}`);

  item.status = 'posted';
  item.posted_at = new Date().toISOString();
  item.youtube_id = videoId;
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2) + '\n');
  console.log(`Marked ${item.id} as posted.`);

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `### ✅ Uploaded long-form to YouTube\n\n**${title}**\n\nhttps://youtube.com/watch?v=${videoId}\n`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
