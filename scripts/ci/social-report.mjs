#!/usr/bin/env node
// Reporting agent: compiles each platform's progress + the latest posts'
// stats into STATUS.md (committed by .github/workflows/report.yml so it's
// always current on GitHub, and relayed in chat).
//
// Progress comes from the shared queue. YouTube stats (channel subscribers +
// per-video views/likes — the monetization metrics) come from the free
// YouTube Data API via the same OAuth the poster uses (YT_CLIENT_ID/SECRET/
// REFRESH_TOKEN). X / TikTok / Pinterest per-post stats need scraping and are
// a later addition; for now those rows show progress only.

import fs from 'node:fs';
import path from 'node:path';
import {google} from 'googleapis';
import {loadQueue, ROOT} from './social-post-helpers.mjs';
import {pinterestStats, tiktokStats, xStats} from './social-stats.mjs';

const PLATFORMS = [
  {name: '🎥 YouTube', status: 'status', at: 'posted_at'},
  {name: '🐦 X', status: 'x_status', at: 'x_posted_at'},
  {name: '📌 Pinterest', status: 'pinterest_status', at: 'pinterest_posted_at'},
  {name: '🎵 TikTok', status: 'tiktok_status', at: 'tiktok_posted_at'},
];

const fmtWhen = (s) => (s ? s.slice(0, 16).replace('T', ' ') : '—');
const clip = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + '…' : s || '—');

function progressRows(items) {
  return PLATFORMS.map((p) => {
    const done = items.filter((i) => i[p.status] === 'posted');
    const last = done[done.length - 1];
    return `| ${p.name} | ${done.length} | ${clip(last && last.title.replace(/\s*#Shorts$/i, ''), 34)} | ${fmtWhen(last && last[p.at])} |`;
  }).join('\n');
}

async function youtubeSection(items) {
  const ytIds = items.filter((i) => i.status === 'posted' && i.youtube_id).map((i) => i.youtube_id);
  // A YouTube Data API key reads public channel + video stats without the
  // OAuth read scope (the poster's token is upload-only). Free to create.
  const key = process.env.YT_API_KEY;
  if (!key) {
    return '\n## 🎥 YouTube performance\n_Set the `YT_API_KEY` secret (a YouTube Data API key) to show channel + video stats._\n';
  }
  const youtube = google.youtube({version: 'v3', auth: key});

  let out = '\n## 🎥 YouTube performance (monetization tracking)\n';
  let channelId = null;
  let views = 0;
  let likes = 0;
  const rows = [];
  if (ytIds.length) {
    try {
      const vids = await youtube.videos.list({part: ['statistics', 'snippet'], id: ytIds});
      for (const v of vids.data.items || []) {
        const st = v.statistics || {};
        channelId = channelId || v.snippet.channelId;
        views += Number(st.viewCount || 0);
        likes += Number(st.likeCount || 0);
        rows.push(
          `| ${clip(v.snippet.title.replace(/\s*#Shorts$/i, ''), 38)} | ${Number(st.viewCount || 0).toLocaleString()} | ${st.likeCount || 0} | ${st.commentCount || 0} |`,
        );
      }
    } catch (e) {
      out += `\n_(video stats error: ${e.message})_\n`;
    }
  }
  if (channelId) {
    try {
      const ch = await youtube.channels.list({part: ['statistics'], id: [channelId]});
      const s = ch.data.items?.[0]?.statistics;
      if (s) {
        const subs = Number(s.subscriberCount);
        out +=
          `\n**Channel:** ${subs.toLocaleString()} subscribers · ` +
          `${Number(s.viewCount).toLocaleString()} total views · ${s.videoCount} videos\n` +
          `**Toward monetization:** ${subs}/1,000 subscribers (${((subs / 1000) * 100).toFixed(1)}%)\n`;
      }
    } catch (e) {
      out += `\n_(channel stats error: ${e.message})_\n`;
    }
  }
  if (rows.length) {
    out +=
      `\n| Video | Views | Likes | Comments |\n|---|---|---|---|\n${rows.join('\n')}\n` +
      `\n**Totals:** ${views.toLocaleString()} views · ${likes.toLocaleString()} likes across ${rows.length} Shorts\n`;
  }
  return out;
}

// Renders a stats table for X / TikTok / Pinterest (social-stats.mjs), which
// all share the {rows: [{title, ...metrics}]} | {error} | null shape.
function statsSection(emoji, name, envVar, result, columns) {
  if (!result) {
    return `\n## ${emoji} ${name} performance\n_Set the \`${envVar}\` secret to show post stats._\n`;
  }
  if (result.error) {
    if (result.debug) console.error(`[${name} debug]\n${result.debug}\n`);
    return `\n## ${emoji} ${name} performance\n_${result.error}_\n`;
  }
  if (!result.rows.length) return '';
  const header = `| Post | ${columns.map((c) => c.label).join(' | ')} |\n|---|${columns.map(() => '---').join('|')}|`;
  const body = result.rows
    .map((r) => `| ${clip(r.title, 34)} | ${columns.map((c) => r[c.key] ?? '—').join(' | ')} |`)
    .join('\n');
  return `\n## ${emoji} ${name} performance\n${header}\n${body}\n`;
}

async function main() {
  const queue = loadQueue();
  const items = queue.items;
  const voiced = fs.existsSync(path.join(ROOT, 'remotion/public/audio'))
    ? fs.readdirSync(path.join(ROOT, 'remotion/public/audio')).filter((d) => /^short-/.test(d)).length
    : 0;

  const yt = await youtubeSection(items);
  const x = statsSection('🐦', 'X', 'X_COOKIES_JSON', await xStats(queue), [
    {key: 'views', label: 'Views'},
    {key: 'likes', label: 'Likes'},
    {key: 'replies', label: 'Replies'},
    {key: 'reposts', label: 'Reposts'},
  ]);
  const pinterest = statsSection('📌', 'Pinterest', 'PINTEREST_COOKIES_JSON', await pinterestStats(queue), [
    {key: 'saves', label: 'Saves'},
  ]);
  const tiktok = statsSection('🎵', 'TikTok', 'TIKTOK_COOKIES_JSON', await tiktokStats(queue), [
    {key: 'views', label: 'Views'},
    {key: 'likes', label: 'Likes'},
    {key: 'comments', label: 'Comments'},
  ]);

  const report =
    `# 📊 thementalsport.com — Social Report\n\n` +
    `_Updated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC_\n\n` +
    `## Progress\n\n` +
    `| Platform | Posted | Last post | When (UTC) |\n|---|---|---|---|\n` +
    `${progressRows(items)}\n` +
    yt +
    x +
    pinterest +
    tiktok +
    `\n## 🔊 Voiceover\n${voiced}/${items.length} shorts narrated in cloned voice` +
    `${voiced >= items.length ? ' ✅' : ''}\n`;

  fs.writeFileSync(path.join(ROOT, 'STATUS.md'), report);
  console.log(report);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
