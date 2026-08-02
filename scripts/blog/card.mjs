// Renders a branded 1080x1350 "quote card" PNG from a Short's hook line, for
// posting alongside the video/script on social. Offline (SVG -> PNG via resvg),
// so it runs in CI like the rest of the pipeline. On-brand, always legible.

import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';

const esc = (s) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function wrapText(text, maxChars) {
    const words = text.split(/\s+/);
    const lines = [];
    let cur = '';
    for (const w of words) {
        if ((cur + ' ' + w).trim().length > maxChars) {
            if (cur) lines.push(cur);
            cur = w;
        } else {
            cur = (cur + ' ' + w).trim();
        }
    }
    if (cur) lines.push(cur);
    return lines;
}

export function cardSvg({ hook, label = 'Sport Psychology', accent = '#dc2626' }) {
    const W = 1080, H = 1350;
    // Strip a leading "Hook (0-3s):" and any markdown emphasis.
    const clean = hook.replace(/^\**\s*hook[^:]*:\s*\**/i, '').replace(/[*_`#]/g, '').trim();

    let maxChars = 18, size = 92;
    if (clean.length > 130) { maxChars = 25; size = 58; }
    else if (clean.length > 90) { maxChars = 22; size = 68; }
    else if (clean.length > 55) { maxChars = 20; size = 80; }

    const lines = wrapText(clean, maxChars).slice(0, 7);
    const lh = size * 1.14;
    const blockH = lines.length * lh;
    let y = H * 0.5 - blockH / 2 + size * 0.8;
    const tspans = lines
        .map((l) => {
            const t = `<text x="80" y="${Math.round(y)}" font-family="DejaVu Sans" font-weight="bold" font-size="${size}" fill="#ffffff" letter-spacing="-1">${esc(l)}</text>`;
            y += lh;
            return t;
        })
        .join('\n  ');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="g" cx="78%" cy="20%" r="85%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.45"/>
      <stop offset="55%" stop-color="#0a0a0b" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#0a0a0b"/>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <text x="80" y="120" font-family="DejaVu Sans" font-weight="bold" font-size="30" fill="#ffffff" letter-spacing="6">THE MENTAL SPORT</text>
  <text x="80" y="176" font-family="DejaVu Sans" font-weight="bold" font-size="26" fill="${accent}" letter-spacing="5">${esc(label.toUpperCase())}</text>
  <rect x="80" y="212" width="120" height="8" fill="${accent}"/>
  ${tspans}
  <rect x="80" y="${H - 240}" width="120" height="8" fill="${accent}"/>
  <text x="80" y="${H - 158}" font-family="DejaVu Sans" font-weight="bold" font-size="40" fill="#ffffff" letter-spacing="1">TAKE THE FREE 2-MIN QUIZ</text>
  <text x="80" y="${H - 100}" font-family="DejaVu Sans" font-size="34" fill="${accent}" letter-spacing="1">thementalsport.com/quiz</text>
</svg>`;
}

export function renderCard(opts) {
    const svg = cardSvg(opts);
    const png = new Resvg(svg, {
        fitTo: { mode: 'width', value: 1080 },
        font: { loadSystemFonts: true, defaultFontFamily: 'DejaVu Sans' },
    })
        .render()
        .asPng();
    if (opts.outPath) fs.writeFileSync(opts.outPath, png);
    return png;
}
