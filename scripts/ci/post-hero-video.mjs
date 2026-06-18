#!/usr/bin/env node
// Hero / long-form video upload LOOP.
//
// Picks the first pending item from social/youtube-hero-queue/queue.json that
// has a real source_url, downloads the finished video (these are produced
// elsewhere — Higgsfield / ElevenLabs / etc. — NOT rendered here), uploads it
// to YouTube using the same OAuth credentials the daily Shorts poster uses,
// then marks the item "posted". When nothing is ready it does nothing.
//
// Requires env vars: YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN
// (the existing GitHub secrets — same ones post-youtube-short.mjs uses).

import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {google} from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const QUEUE_PATH = path.join(ROOT, 'social/youtube-hero-queue/queue.json');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

// Pull a Drive file id out of any common share/link form.
function extractDriveId(url) {
  let m = url.match(/\/file\/d\/([^/]+)/);
  if (m) return m[1];
  m = url.match(/[?&]id=([^&]+)/);
  if (m) return m[1];
  return null;
}

// Download a finished video to outPath. Handles Google Drive's large-file
// "virus scan" interstitial (confirm token) and plain direct URLs.
function download(url, outPath) {
  const driveId = url.includes('drive.google.com') ? extractDriveId(url) : null;
  if (driveId) {
    const uc = 'https://drive.usercontent.google.com/download';
    const cookie = path.join(os.tmpdir(), 'gd_cookies.txt');
    const page = path.join(os.tmpdir(), 'gd_page.html');
    // First hit may return the file directly, or an HTML confirm page.
    execFileSync('curl', ['-sL', '-c', cookie, `${uc}?id=${driveId}&export=download`, '-o', page]);
    const html = fs.readFileSync(page, 'utf-8');
    const confirm = (html.match(/name="confirm" value="([^"]*)"/) || [])[1];
    const uuid = (html.match(/name="uuid" value="([^"]*)"/) || [])[1];
    if (confirm) {
      const u = `${uc}?id=${driveId}&export=download&confirm=${confirm}${uuid ? `&uuid=${uuid}` : ''}`;
      execFileSync('curl', ['-sL', '-b', cookie, u, '-o', outPath]);
    } else {
      execFileSync('curl', ['-sL', '-b', cookie, `${uc}?id=${driveId}&export=download`, '-o', outPath]);
    }
  } else {
    execFileSync('curl', ['-sL', url, '-o', outPath]);
  }
}

async function main() {
  const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8'));
  const item = queue.items.find((i) => i.status === 'pending');

  if (!item) {
    console.log('No pending hero videos in queue.json. Nothing to upload.');
    return;
  }
  if (!item.source_url || item.source_url.startsWith('PASTE_')) {
    console.log(`Next item ${item.id} has no video link yet — waiting. Nothing to upload.`);
    return;
  }

  const out = path.join(os.tmpdir(), `${item.id}.mp4`);
  console.log(`Downloading ${item.id} from its source link...`);
  download(item.source_url, out);

  if (!fs.existsSync(out) || fs.statSync(out).size < 1_000_000) {
    throw new Error(
      `Download failed or file too small for ${item.id}. If it's a Google Drive link, set the file to "Anyone with the link" and try again.`,
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    requireEnv('YT_CLIENT_ID'),
    requireEnv('YT_CLIENT_SECRET'),
  );
  oauth2Client.setCredentials({refresh_token: requireEnv('YT_REFRESH_TOKEN')});
  const youtube = google.youtube({version: 'v3', auth: oauth2Client});

  const title = item.title.slice(0, 100);
  const description = item.description || '';
  const tags = item.tags || [];
  const categoryId = item.category_id || '22';
  const privacyStatus = item.privacy || 'public';
  const sizeMB = (fs.statSync(out).size / (1024 * 1024)).toFixed(1);

  console.log(`Uploading "${title}" (${sizeMB} MB, ${privacyStatus})...`);
  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {title, description, tags, categoryId},
      status: {privacyStatus, selfDeclaredMadeForKids: false},
    },
    media: {body: fs.createReadStream(out)},
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
      `### ✅ Uploaded to YouTube\n\n**${title}**\n\nhttps://youtube.com/watch?v=${videoId}\n`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
