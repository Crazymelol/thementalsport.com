// "Quote card" — the white, tweet-style format (avatar + handle + one big line
// of black text) that performs well on IG/TikTok feeds. Deliberately plain: the
// sentence is the whole design.
//
// Drop a real headshot at assets/brand/avatar.(png|jpg) and it is used
// automatically; until then a monogram circle stands in.

import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const FONT_DIR = path.join(ROOT, 'assets', 'fonts');
const AVATAR_CANDIDATES = [
    'assets/brand/avatar.png',
    'assets/brand/avatar.jpg',
    'assets/brand/avatar.jpeg',
];

const esc = (s) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Archivo at these sizes averages ~0.52 of the font size per character.
const CHAR_W = 0.56;

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

// Largest size where the quote fits the box within maxLines.
function layoutQuote(text, boxW, boxH, maxLines = 9) {
    for (let size = 108; size >= 42; size -= 2) {
        const perLine = Math.floor(boxW / (size * CHAR_W));
        if (perLine < 8) continue;
        const lines = wrap(text, perLine);
        if (lines.length <= maxLines && lines.length * size * 1.18 <= boxH) {
            return { lines, size };
        }
    }
    const size = 42;
    return { lines: wrap(text, Math.floor(boxW / (size * CHAR_W))).slice(0, maxLines), size };
}

function findAvatar() {
    for (const p of AVATAR_CANDIDATES) {
        const full = path.join(ROOT, p);
        if (fs.existsSync(full)) return full;
    }
    return null;
}

export function quoteCardSvg({
    quote,
    name = 'Giannis Notaras',
    handle = '@thementalsport',
    accent = '#dc2626',
    // Vertical focal point of the avatar photo: 0 = top, 0.5 = centre, 1 = bottom.
    // Lets an uncropped photo be aimed at the face without editing the file.
    avatarFocusY = 0.5,
    avatarZoom = 1,
}) {
    const W = 1080, H = 1350;
    const PAD = 84;
    const boxW = W - PAD * 2;

    // Header block
    const avatarPath = findAvatar();
    const cx = PAD + 56, cy = 150, r = 56;
    let avatar;
    if (avatarPath) {
        const b64 = fs.readFileSync(avatarPath).toString('base64');
        const mime = avatarPath.endsWith('.png') ? 'png' : 'jpeg';
        // Oversize the image, then shift it so the chosen focal point lands in
        // the middle of the circle.
        const d = r * 2 * avatarZoom;
        const ax = cx - d / 2;
        const ay = cy - d / 2 - (avatarFocusY - 0.5) * d;
        avatar = `
  <clipPath id="av"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
  <image x="${ax}" y="${ay}" width="${d}" height="${d}"
         preserveAspectRatio="xMidYMid slice" clip-path="url(#av)"
         href="data:image/${mime};base64,${b64}"/>`;
    } else {
        const initials = name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
        avatar = `
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${accent}"/>
  <text x="${cx}" y="${cy + 18}" text-anchor="middle" font-family="Archivo SemiBold" font-size="48" fill="#ffffff">${esc(initials)}</text>`;
    }

    // Quote fills the space between header and footer.
    const quoteTop = 330;
    const quoteBox = H - quoteTop - 190;
    const { lines, size } = layoutQuote(quote.trim(), boxW, quoteBox);
    const lh = size * 1.18;
    // Centre the block in the available space so short and long quotes both sit
    // balanced instead of hugging the top.
    let y = quoteTop + (quoteBox - lines.length * lh) / 2 + size * 0.86;
    const quoteSvg = lines
        .map((l) => {
            const t = `<text x="${PAD}" y="${Math.round(y)}" font-family="Archivo SemiBold" font-size="${size}" fill="#111114">${esc(l)}</text>`;
            y += lh;
            return t;
        })
        .join('\n  ');

    const nameX = PAD + 140;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  ${avatar}
  <text x="${nameX}" y="${cy - 6}" font-family="Archivo SemiBold" font-size="46" fill="#111114">${esc(name)}</text>
  <circle cx="${nameX + name.length * 25 + 36}" cy="${cy - 22}" r="17" fill="#1d9bf0"/>
  <path d="M ${nameX + name.length * 25 + 28} ${cy - 22} l 6 7 l 12 -13" stroke="#ffffff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="${nameX}" y="${cy + 44}" font-family="Archivo SemiBold" font-size="38" fill="#6b6b75">${esc(handle)}</text>

  ${quoteSvg}

  <rect x="${PAD}" y="${H - 132}" width="88" height="8" fill="${accent}"/>
  <text x="${PAD}" y="${H - 70}" font-family="Archivo SemiBold" font-size="32" fill="#6b6b75" letter-spacing="3">THEMENTALSPORT.COM</text>
</svg>`;
}

export function renderQuoteCard(opts) {
    const png = new Resvg(quoteCardSvg(opts), {
        fitTo: { mode: 'width', value: 1080 },
        font: { fontDirs: [FONT_DIR], loadSystemFonts: true, defaultFontFamily: 'Archivo SemiBold' },
    })
        .render()
        .asPng();
    if (opts.outPath) fs.writeFileSync(opts.outPath, png);
    return png;
}
