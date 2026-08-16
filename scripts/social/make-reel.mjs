// Turns a quote into a vertical 1080x1920 MP4 for Reels / TikTok / Shorts.
//
// Why: static feed images get almost no non-follower distribution on Instagram.
// Reels do. Same words, different container, completely different reach.
//
// The text reveals line by line (the thing that actually holds attention in the
// first 3 seconds), then a CTA card. Rendered as a handful of still "states"
// with per-state durations, so it is fast and deterministic.
//
// Usage: node scripts/social/make-reel.mjs "<quote>" out.mp4 [#accent]

import { Resvg } from '@resvg/resvg-js';
import { execFileSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ROOT = process.cwd();
const FONT_DIR = path.join(ROOT, 'assets', 'fonts');
const AVATAR = ['assets/brand/avatar.png', 'assets/brand/avatar.jpg']
    .map((p) => path.join(ROOT, p))
    .find((p) => fs.existsSync(p));

const W = 1080, H = 1920;
const CHAR_W = 0.56;
const esc = (s) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function wrap(text, maxChars) {
    const words = text.split(/\s+/);
    const lines = [];
    let cur = '';
    for (const w of words) {
        const t = cur ? cur + ' ' + w : w;
        if (t.length > maxChars && cur) { lines.push(cur); cur = w; } else { cur = t; }
    }
    if (cur) lines.push(cur);
    return lines;
}

function layout(text, boxW, boxH, maxLines = 8) {
    for (let size = 104; size >= 46; size -= 2) {
        const perLine = Math.floor(boxW / (size * CHAR_W));
        if (perLine < 8) continue;
        const lines = wrap(text, perLine);
        if (lines.length <= maxLines && lines.length * size * 1.2 <= boxH) return { lines, size };
    }
    const size = 46;
    return { lines: wrap(text, Math.floor(boxW / (size * CHAR_W))).slice(0, maxLines), size };
}

function frame({ lines, size, shown, accent, cta }) {
    const PAD = 90;
    const lh = size * 1.2;
    const blockH = lines.length * lh;
    let y = (H - blockH) / 2 + size * 0.86;

    const body = lines
        .map((l, i) => {
            const t = i < shown
                ? `<text x="${PAD}" y="${Math.round(y)}" font-family="Archivo SemiBold" font-size="${size}" fill="#111114">${esc(l)}</text>`
                : '';
            y += lh;
            return t;
        })
        .join('\n  ');

    let avatar = '';
    if (AVATAR) {
        const b64 = fs.readFileSync(AVATAR).toString('base64');
        const mime = AVATAR.endsWith('.png') ? 'png' : 'jpeg';
        avatar = `
  <clipPath id="av"><circle cx="${PAD + 52}" cy="200" r="52"/></clipPath>
  <image x="${PAD}" y="148" width="104" height="104" preserveAspectRatio="xMidYMid slice"
         clip-path="url(#av)" href="data:image/${mime};base64,${b64}"/>`;
    }

    const ctaBlock = cta
        ? `<rect x="0" y="${H - 430}" width="${W}" height="430" fill="#0a0a0b"/>
  <rect x="${PAD}" y="${H - 360}" width="90" height="8" fill="${accent}"/>
  <text x="${PAD}" y="${H - 268}" font-family="Archivo SemiBold" font-size="60" fill="#ffffff">Free 2-minute quiz</text>
  <text x="${PAD}" y="${H - 190}" font-family="Archivo SemiBold" font-size="46" fill="${accent}">thementalsport.com/quiz</text>`
        : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  ${avatar}
  <text x="${PAD + 130}" y="188" font-family="Archivo SemiBold" font-size="42" fill="#111114">Giannis Notaras</text>
  <text x="${PAD + 130}" y="240" font-family="Archivo SemiBold" font-size="34" fill="#6b6b75">@thementalsport</text>
  <rect x="${PAD}" y="300" width="80" height="8" fill="${accent}"/>
  ${body}
  ${ctaBlock}
</svg>`;
}

function png(svg) {
    return new Resvg(svg, {
        fitTo: { mode: 'width', value: W },
        font: { fontDirs: [FONT_DIR], loadSystemFonts: true, defaultFontFamily: 'Archivo SemiBold' },
    }).render().asPng();
}

export function makeReel(quote, outPath, accent = '#dc2626') {
    const { lines, size } = layout(quote.trim(), W - 180, H - 900);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-'));

    // One still per state: each line appearing, a hold, then the CTA.
    const states = [];
    for (let i = 1; i <= lines.length; i++) {
        states.push({ shown: i, cta: false, dur: i === lines.length ? 1.6 : 0.55 });
    }
    states.push({ shown: lines.length, cta: true, dur: 2.2 });

    const list = [];
    states.forEach((s, i) => {
        const f = path.join(dir, `f${String(i).padStart(3, '0')}.png`);
        fs.writeFileSync(f, png(frame({ lines, size, shown: s.shown, accent, cta: s.cta })));
        list.push(`file '${f}'`, `duration ${s.dur}`);
    });
    // concat demuxer needs the final frame repeated to hold its duration
    list.push(`file '${path.join(dir, `f${String(states.length - 1).padStart(3, '0')}.png`)}'`);
    const listFile = path.join(dir, 'list.txt');
    fs.writeFileSync(listFile, list.join('\n'));

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    execFileSync(ffmpeg, [
        '-y', '-f', 'concat', '-safe', '0', '-i', listFile,
        '-vf', 'fps=30,format=yuv420p',
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
        '-movflags', '+faststart',
        outPath,
    ], { stdio: 'pipe' });

    fs.rmSync(dir, { recursive: true, force: true });
    return outPath;
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const [quote, out, accent] = process.argv.slice(2);
    if (!quote || !out) {
        console.error('usage: make-reel.mjs "<quote>" out.mp4 [#accent]');
        process.exit(1);
    }
    makeReel(quote, out, accent || '#dc2626');
    console.log('wrote', out);
}
