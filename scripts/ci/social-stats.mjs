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

function evalJson(js) {
  const raw = ab('eval', js);
  try {
    return {value: JSON.parse(raw)};
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
  ab('wait', '--selector', '[data-e2e="user-post-item"]', '--timeout', '15000');
  ab('wait', '--timeout', '1500');

  const {value: videos, error: gridError} = evalJson(`JSON.stringify([...document.querySelectorAll('[data-e2e="user-post-item"]')].slice(0, ${limit}).map(el => ({
    href: el.querySelector('a')?.getAttribute('href') || '',
    views: el.querySelector('[data-e2e="video-views"]')?.textContent || el.querySelector('strong')?.textContent || '',
  })))`);
  const {value: debugGrid} = evalJson(`JSON.stringify({
    url: location.href,
    title: document.title,
    e2e: [...new Set([...document.querySelectorAll('[data-e2e]')].map((x) => x.getAttribute('data-e2e')))],
    videoLinks: document.querySelectorAll('a[href*="/video/"]').length,
  })`);
  console.error('TIKTOK_GRID_DEBUG', debugGrid);
  if (gridError) {
    ab('close', '--all');
    return {error: 'unexpected response from TikTok profile grid', debug: gridError.slice(0, 2000)};
  }
  if (!videos.length) {
    ab('close', '--all');
    return {error: 'no videos found on TikTok profile'};
  }

  // Likes/comments aren't shown on the profile grid — open each video page.
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
    if (details.length === 0) {
      const {value: debugDetail} = evalJson(
        `JSON.stringify({url: location.href, e2eEls: [...document.querySelectorAll('[data-e2e]')].map((x) => x.getAttribute('data-e2e')).slice(0, 40)})`,
      );
      console.error('TIKTOK_DETAIL_DEBUG', debugDetail);
    }
    const {value: d} = evalJson(`JSON.stringify({
      likes: document.querySelector('[data-e2e="like-count"]')?.textContent || '',
      comments: document.querySelector('[data-e2e="comment-count"]')?.textContent || '',
    })`);
    details.push(d || {});
  }
  ab('close', '--all');

  const rows = items.map((item, i) => ({
    title: item.title.replace(/\s*#Shorts$/i, ''),
    views: videos[i]?.views || '—',
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

  let snap = ab('snapshot', '-i');
  if (isLoginWall(snap)) {
    ab('close', '--all');
    return {error: 'Pinterest session not authenticated (login wall) — re-export PINTEREST_COOKIES_JSON'};
  }

  const {value: profileHref} = evalJson(
    `JSON.stringify(document.querySelector('[data-test-id="header-avatar"] a, [data-test-id="simplified-profile"] a, a[data-test-id="headerProfileLink"]')?.getAttribute('href') || '')`,
  );
  if (!profileHref) {
    ab('close', '--all');
    return {error: 'could not find profile link on Pinterest home (header not loaded)', debug: snap.slice(0, 2000)};
  }

  ab('open', `https://www.pinterest.com${profileHref}_created/`);
  ab('wait', '--load', 'networkidle');
  ab('wait', '--timeout', '2500');

  const {value: pins, error} = evalJson(`JSON.stringify([...document.querySelectorAll('[data-test-id="pin"]')].slice(0, ${limit}).map(el => ({
    title: el.querySelector('img')?.getAttribute('alt') || '',
    href: el.querySelector('a')?.getAttribute('href') || '',
    saves: (el.textContent.match(/([\\d.,]+[KMB]?)\\s*(saves?|saved)/i) || [])[1] || '',
  })))`);
  const {value: debugPin} = evalJson(`JSON.stringify({
    url: location.href,
    title: document.title,
    testIds: [...new Set([...document.querySelectorAll('[data-test-id]')].map((x) => x.getAttribute('data-test-id')))],
  })`);
  console.error('PINTEREST_DEBUG', debugPin);
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
