#!/usr/bin/env node
// ONE-TIME SETUP — generates a Pinterest API refresh token for posting Pins.
// The resulting CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN / BOARD_ID get
// stored as GitHub Actions secrets so the poster workflow
// (scripts/ci/post-pinterest-pin.mjs) can create Pins with no further human
// interaction.
//
// Prerequisites:
//   1. Create an app at https://developer.pinterest.com/apps/
//   2. In the app's settings, add this exact Redirect URI:
//        https://thementalsport.com/
//   3. Note the app's "App ID" (client id) and "App secret" (client secret).
//
// Step 1 — print the consent URL:
//   PINTEREST_CLIENT_ID=... PINTEREST_CLIENT_SECRET=... node get-pinterest-refresh-token.mjs
//
// Step 2 — open the printed URL, sign in with the Pinterest account, and
// approve access. Pinterest redirects to https://thementalsport.com/?code=...
// — copy the `code` value from the resulting address bar.
//
// Step 3 — exchange the code for tokens:
//   PINTEREST_CLIENT_ID=... PINTEREST_CLIENT_SECRET=... node get-pinterest-refresh-token.mjs <code>
//
// This prints the secrets to save in GitHub, plus a list of the account's
// boards so you can pick a PINTEREST_BOARD_ID.

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

const CLIENT_ID = requireEnv('PINTEREST_CLIENT_ID');
const CLIENT_SECRET = requireEnv('PINTEREST_CLIENT_SECRET');
const REDIRECT_URI = 'https://thementalsport.com/';
const SCOPES = ['boards:read', 'pins:read', 'pins:write'].join(',');

const code = process.argv[2];

if (!code) {
  const authUrl = `https://www.pinterest.com/oauth/?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPES)}`;
  console.log('\nOpen this URL, sign in with the Pinterest account, and approve access:\n');
  console.log(authUrl);
  console.log(`\nPinterest will redirect to ${REDIRECT_URI}?code=...`);
  console.log('Copy the "code" value from the address bar, then re-run:');
  console.log('  PINTEREST_CLIENT_ID=... PINTEREST_CLIENT_SECRET=... node get-pinterest-refresh-token.mjs <code>\n');
  process.exit(0);
}

const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
const tokenRes = await fetch('https://api.pinterest.com/v5/oauth/token', {
  method: 'POST',
  headers: {
    Authorization: `Basic ${basic}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
  }),
});

if (!tokenRes.ok) {
  throw new Error(`Token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`);
}

const tokens = await tokenRes.json();
console.log('\n=== Save these as GitHub Actions secrets ===');
console.log(`PINTEREST_CLIENT_ID=${CLIENT_ID}`);
console.log(`PINTEREST_CLIENT_SECRET=${CLIENT_SECRET}`);
console.log(`PINTEREST_REFRESH_TOKEN=${tokens.refresh_token}`);
console.log('=============================================\n');

console.log('Boards (pick one for PINTEREST_BOARD_ID):\n');
const boardsRes = await fetch('https://api.pinterest.com/v5/boards', {
  headers: {Authorization: `Bearer ${tokens.access_token}`},
});
if (!boardsRes.ok) {
  throw new Error(`Listing boards failed: ${boardsRes.status} ${await boardsRes.text()}`);
}
const boards = await boardsRes.json();
for (const board of boards.items ?? []) {
  console.log(`${board.id}  ${board.name}`);
}
