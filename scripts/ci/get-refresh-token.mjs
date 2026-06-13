#!/usr/bin/env node
// ONE-TIME SETUP — run this on your own machine (not in CI).
//
// Generates a YouTube Data API refresh token for the channel's Google
// account. The resulting CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN get
// stored as GitHub Actions secrets so the poster workflow can upload
// videos without any further human interaction.
//
// Prerequisites:
//   1. In Google Cloud Console, create (or reuse) a project.
//   2. Enable the "YouTube Data API v3" for that project.
//   3. Create OAuth client credentials of type "Desktop app".
//   4. Run:  YT_CLIENT_ID=... YT_CLIENT_SECRET=... node get-refresh-token.mjs
//   5. Open the printed URL, sign in with the YouTube channel's Google
//      account, and approve access.
//   6. Copy the printed refresh_token into the YT_REFRESH_TOKEN GitHub
//      secret (along with YT_CLIENT_ID / YT_CLIENT_SECRET).

import http from 'node:http';
import {google} from 'googleapis';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

const CLIENT_ID = requireEnv('YT_CLIENT_ID');
const CLIENT_SECRET = requireEnv('YT_CLIENT_SECRET');
const PORT = 53682;
const REDIRECT_URI = `http://127.0.0.1:${PORT}`;

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/youtube.upload'],
});

console.log('\nOpen this URL in a browser, sign in with the YouTube channel account, and approve access:\n');
console.log(authUrl);
console.log('\nWaiting for the redirect...\n');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get('code');

  if (!code) {
    res.writeHead(400).end('No code in callback.');
    return;
  }

  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end('<h1>Success</h1>You can close this tab and return to the terminal.');

  const {tokens} = await oauth2Client.getToken(code);
  console.log('\n=== Save these as GitHub Actions secrets ===');
  console.log(`YT_CLIENT_ID=${CLIENT_ID}`);
  console.log(`YT_CLIENT_SECRET=${CLIENT_SECRET}`);
  console.log(`YT_REFRESH_TOKEN=${tokens.refresh_token}`);
  console.log('=============================================\n');

  server.close();
});

server.listen(PORT);
