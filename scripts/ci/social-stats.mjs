#!/usr/bin/env node
// Per-platform engagement scrapers (views/likes/comments) for STATUS.md.
//
// Unlike YouTube (free read-only Data API), X / TikTok / Pinterest have no
// public stats API for a personal account, so these load the same
// *_COOKIES_JSON session the posters use via agent-browser and read the
// numbers off the creator's own profile using each platform's stable
// automation attributes (data-testid / data-e2e), the same kind of selector
// the posters already rely on (e.g. `[data-testid="tweetTextarea_0"]`).
//
// Each function returns:
//   null            - the *_COOKIES_JSON secret isn't set (not configured yet)
//   {error, debug?} - configured but scraping failed (login wall, layout
//                      change, etc.) — surfaced in STATUS.md so it's visible
//                      without digging through Action logs
//   {rows: [...]}   - one row per recently-posted item (most recent first),
//                      each `{title, ...platform metrics}`
//
// Posts are matched to queue items positionally: the Nth most recent post on
// the profile corresponds to the Nth most recently `*_posted_at` queue item
// (at most one post/platform/day, so ordering lines up).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {ab, cookiesToStorageState, isLoginWall} from './social-post-helpers.mjs';

function loadCookieState(envVar, filename) {
  const cookiesJson = process.env[envVar];
  if (!cookiesJson) return null;
  const stateFile = path.join(os.tmpdir(), filename);
  fs.writeFileSync(stateFile, JSON.stringify(cookiesToStorageState(cookiesJson)));
  return {cookiesJson, stateFile};
}

function platformItems(queue, statusKey, atKey, limit) {
  return queue.items
    .filter((i) => i[statusKey] === 'posted')
    .sort((a, b) => new Date(b[atKey]) - new Date(a[atKey]))
    .slice(0, limit);
}

// agent-browser eval double-encodes its output: the printed text is
// JSON.stringify(<result of the page expression>), and our page expressions
// themselves return JSON.stringify(...) text. So a single JSON.parse only
// unwraps the outer layer, leaving a JSON-text string rather than the value
// (e.g. an empty string round-trips as the 2-char string '""', which is
// truthy). Parse twice to recover the actual value.
function evalJson(js) {
  const raw = ab('eval', js);
  try {
    return {value: JSON.parse(JSON.parse(raw))};
  } catch {
    return {error: raw};
  }
}

export async function xStats(queue, limit = 3) {
  const state = loadCookieState('X_COOKIES_JSON', 'x_stats_state.json');
  if (!state) return null;

  const items = platformItems(queue, 'x_status', 'x_posted_at', limit);
  if (!items.length) return {rows: []};

  const cookies = JSON.parse(state.cookiesJson);
  const twid = cookies.find((c) => c.name === 'twid');
  const idMatch = twid && decodeURIComponent(twid.value).match(/u=(\d+)/);
  if (!idMatch) {
    return {error: 'X_COOKIES_JSON has no usable `twid` cookie — re-export with Cookie-Editor'};
  }

  ab('close', '--all');
  ab('state', 'load', state.stateFile);
  ab('open', `https://x.com/i/user/${idMatch[1]}`);
  ab('wait', '--load', 'networkidle');

  const snap = ab('snapshot', '-i');
  if (isLoginWall(snap)) {
    ab('close', '--all');
    return {error: 'X session not authenticated (login wall) — re-export X_COOKIES_JSON'};
  }

  ab('wait', '--selector', '[data-testid="tweet"]', '--timeout', '15000');
  ab('wait', '--timeout', '1500');

  const {value: tweets, error} = evalJson(`JSON.stringify([...document.querySelectorAll('[data-testid="tweet"]')].slice(0, ${limit}).map(a => ({
    text: (a.querySelector('[data-testid="tweetText"]')?.textContent || '').slice(0, 100),
    replies: a.querySelector('[data-testid="reply"]')?.textContent || '0',
    reposts: a.querySelector('[data-testid="retweet"]')?.textContent || '0',
    likes: a.querySelector('[data-testid="like"]')?.textContent || '0',
    views: (a.querySelector('a[href$="/analytics"]')?.getAttribute('aria-label') || '').match(/^[\\d.,]+[kmb]?/i)?.[0] || '',
  })))`);
  ab('close', '--all');

  if (error) return {error: 'unexpected response from X profile timeline', debug: error.slice(0, 2000)};
  if (!tweets.length) return {error: 'no tweets found on profile (timeline empty or not loaded)'};

  const rows = items.map((item, i) => ({
    title: item.title.replace(/\s*#Shorts$/i, ''),
    views: tweets[i]?.views || '—',
    likes: tweets[i]?.likes || '0',
    replies: tweets[i]?.replies || '0',
    reposts: tweets[i]?.reposts || '0',
  }));
  return {rows};
}

export async function tiktokStats(queue, limit = 3) {
  const state = loadCookieState('TIKTOK_COOKIES_JSON', 'tiktok_stats_state.json');
  if (!state) return null;

  const items = platformItems(queue, 'tiktok_status', 'tiktok_posted_at', limit);
  if (!items.length) return {rows: []};

  ab('close', '--all');
  ab('state', 'load', state.stateFile);
  ab('open', 'https://www.tiktok.com/');
  ab('wait', '--load', 'networkidle');

  let snap = ab('snapshot', '-i');
  if (isLoginWall(snap)) {
    ab('close', '--all');
    return {error: 'TikTok session not authenticated (login wall) — re-export TIKTOK_COOKIES_JSON'};
  }

  const {value: handleHref} = evalJson(
    `JSON.stringify(document.querySelector('a[data-e2e="nav-profile"]')?.getAttribute('href') || '')`,
  );
  if (!handleHref) {
    ab('close', '--all');
    return {error: 'could not find profile link on TikTok home (nav not loaded)', debug: snap.slice(0, 2000)};
  }

  ab('open', `https://www.tiktok.com${handleHref}`);
  ab('wait', '--load', 'networkidle');
  ab('wait', '--selector', 'a[href*="/video/"]', '--timeout', '15000');
  ab('wait', '--timeout', '1500');

  // `[data-e2e="user-post-item"]` is no longer present on the profile grid
  // (confirmed via debug: e2e list has user/profile attrs but not this one,
  // while `a[href*="/video/"]` finds 12 links). The first such link can be an
  // inbox/notification anchor (data-e2e="inbox-list-item") rather than a grid
  // item, with no `<strong>` view count nearby. Just collect hrefs, deduped,
  // for navigation; views (no reliable selector found on the grid or the
  // detail page — see below) fall back to '—'.
  const {value: videos, error: gridError} = evalJson(`JSON.stringify((() => {
    const seen = new Set();
    const out = [];
    for (const a of document.querySelectorAll('a[href*="/video/"]')) {
      const href = a.getAttribute('href') || '';
      if (!href || seen.has(href)) continue;
      seen.add(href);
      out.push({href});
    }
    return out.slice(0, ${limit});
  })())`);
  if (gridError) {
    ab('close', '--all');
    return {error: 'unexpected response from TikTok profile grid', debug: gridError.slice(0, 2000)};
  }
  if (!videos.length) {
    ab('close', '--all');
    return {error: 'no videos found on TikTok profile'};
  }

  // Likes/comments aren't shown on the profile grid — open each video page.
  // Also try the view count here (debug showed no data-e2e id containing
  // "view" on the detail page for this account, so this is best-effort and
  // currently falls back to '—').
  const details = [];
  for (const v of videos) {
    if (!v.href) {
      details.push({});
      continue;
    }
    ab('open', v.href.startsWith('http') ? v.href : `https://www.tiktok.com${v.href}`);
    ab('wait', '--load', 'networkidle');
    ab('wait', '--selector', '[data-e2e="like-count"]', '--timeout', '15000');
    ab('wait', '--timeout', '1000');
    const {value: d} = evalJson(`JSON.stringify({
      likes: document.querySelector('[data-e2e="like-count"]')?.textContent || '',
      comments: document.querySelector('[data-e2e="comment-count"]')?.textContent || '',
      views: document.querySelector('[data-e2e="video-views"], [data-e2e="browse-video-views"]')?.textContent || '',
    })`);
    details.push(d || {});
  }
  ab('close', '--all');

  const rows = items.map((item, i) => ({
    title: item.title.replace(/\s*#Shorts$/i, ''),
    views: details[i]?.views || '—',
    likes: details[i]?.likes || '—',
    comments: details[i]?.comments || '—',
  }));
  return {rows};
}

export async function pinterestStats(queue, limit = 3) {
  const state = loadCookieState('PINTEREST_COOKIES_JSON', 'pinterest_stats_state.json');
  if (!state) return null;

  const items = platformItems(queue, 'pinterest_status', 'pinterest_posted_at', limit);
  if (!items.length) return {rows: []};

  ab('close', '--all');
  ab('state', 'load', state.stateFile);
  ab('open', 'https://www.pinterest.com/');
  ab('wait', '--load', 'networkidle');
  // The business-hub header (with the profile link) hydrates after
  // networkidle — wait for it explicitly, like X/TikTok wait for their
  // feed/grid selectors before querying.
  ab('wait', '--selector', '[data-test-id="header-profile"]', '--timeout', '10000');

  let snap = ab('snapshot', '-i');
  if (isLoginWall(snap)) {
    ab('close', '--all');
    return {error: 'Pinterest session not authenticated (login wall) — re-export PINTEREST_COOKIES_JSON'};
  }

  // The cookie session lands on the business/partner hub
  // (gr.pinterest.com/business/hub/), not the consumer home feed, so the
  // original consumer-UI selectors (header-avatar, simplified-profile,
  // headerProfileLink) don't exist there. Hub-specific testIds added below
  // (header-profile, business-hub-profile-header, pro-partner-header) — debug
  // dumps confirm [data-test-id="header-profile"] does contain an
  // <a href="/handle/">, but querySelector for it here still comes back empty
  // even with an explicit wait for that element. Hydration/timing quirk on
  // this page that needs live access to diagnose further; left as a graceful
  // error for now.
  const {value: profileHref} = evalJson(
    `JSON.stringify(document.querySelector('[data-test-id="header-avatar"] a, [data-test-id="simplified-profile"] a, a[data-test-id="headerProfileLink"], [data-test-id="header-profile"] a, a[data-test-id="header-profile"], [data-test-id="business-hub-profile-header"] a, [data-test-id="pro-partner-header"] a')?.getAttribute('href') || '')`,
  );
  if (!profileHref) {
    ab('close', '--all');
    return {error: 'could not find profile link on Pinterest home (header not loaded)', debug: snap.slice(0, 2000)};
  }

  const handle = profileHref.replace(/\/$/, '');
  ab('open', `https://www.pinterest.com${handle}/_created/`);
  ab('wait', '--load', 'networkidle');
  ab('wait', '--timeout', '2500');

  const {value: pins, error} = evalJson(`JSON.stringify([...document.querySelectorAll('[data-test-id="pin"]')].slice(0, ${limit}).map(el => ({
    title: el.querySelector('img')?.getAttribute('alt') || '',
    href: el.querySelector('a')?.getAttribute('href') || '',
    saves: (el.textContent.match(/([\\d.,]+[KMB]?)\\s*(saves?|saved)/i) || [])[1] || '',
  })))`);
  ab('close', '--all');

  if (error) return {error: 'unexpected response from Pinterest profile', debug: error.slice(0, 2000)};
  if (!pins.length) return {error: 'no created pins found on profile'};

  const rows = items.map((item, i) => ({
    title: item.title.replace(/\s*#Shorts$/i, ''),
    saves: pins[i]?.saves || '—',
    link: pins[i]?.href ? `https://www.pinterest.com${pins[i].href}` : null,
  }));
  return {rows};
}
