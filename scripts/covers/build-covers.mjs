// Book cover generator. Renders 1600x2560 (2:3, Kindle/ebook standard) covers
// for every title in one consistent brand system: black ground, per-book accent
// glow, huge Anton display type. Designed to stay legible at thumbnail size,
// which is how buyers actually see a cover on Gumroad and Amazon.
//
// Offline (SVG -> PNG via resvg) with fonts vendored in assets/fonts, so it runs
// anywhere including CI. Run: node scripts/covers/build-covers.mjs

import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const FONT_DIR = path.join(ROOT, 'assets', 'fonts');
const OUT_DIR = path.join(ROOT, 'public', 'covers');

const W = 1600, H = 2560;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Anton is condensed: roughly 0.42 of font size per character at these weights.
const ANTON_CHAR_W = 0.44;

function fitLines(words, maxWidth, targetLines) {
    // Greedy wrap at a given font size; returns lines.
    const lines = [];
    let cur = '';
    for (const w of words) {
        const test = cur ? cur + ' ' + w : w;
        if (test.length > maxWidth && cur) { lines.push(cur); cur = w; } else { cur = test; }
    }
    if (cur) lines.push(cur);
    return lines;
}

// Choose the largest font size where the title fits the box in <= maxLines.
function layoutTitle(title, boxW, maxLines) {
    const words = title.toUpperCase().split(/\s+/);
    for (let size = 230; size >= 70; size -= 2) {
        const charsPerLine = Math.floor(boxW / (size * ANTON_CHAR_W));
        if (charsPerLine < 3) continue;
        const lines = fitLines(words, charsPerLine, maxLines);
        const longest = Math.max(...lines.map((l) => l.length));
        if (lines.length <= maxLines && longest * size * ANTON_CHAR_W <= boxW) {
            return { lines, size };
        }
    }
    const size = 70;
    return { lines: fitLines(words, Math.floor(boxW / (size * ANTON_CHAR_W)), maxLines), size };
}

function wrapPlain(text, maxChars) {
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

export function coverSvg(book) {
    const accent = book.accent;
    const light = book.theme === 'light';
    const bg = light ? '#f7f5f1' : '#0a0a0b';
    const fg = light ? '#14141a' : '#ffffff';
    const muted = light ? '#4b4b55' : '#a7a7b0';

    const PAD = 110;
    const boxW = W - PAD * 2;
    const { lines, size } = layoutTitle(book.displayTitle, boxW, book.maxLines || 4);
    const lh = size * 1.0;

    const subLines = wrapPlain(book.subtitle, 44).slice(0, 3);
    const SUB_LH = 70, RULE_GAP = 56, SUB_GAP = 74, BADGE_GAP = 64, BADGE_H = 66;

    // Measure the whole middle block, then center it between the header and the
    // author footer so short and long titles both sit balanced.
    const titleH = lines.length * lh;
    const subH = subLines.length * SUB_LH;
    const blockH = titleH + RULE_GAP + 4 + SUB_GAP + subH + (book.badge ? BADGE_GAP + BADGE_H : 0);
    const zoneTop = 420, zoneBottom = H - 400;
    const start = zoneTop + (zoneBottom - zoneTop - blockH) / 2;

    let y = start + size * 0.82;
    const titleSvg = lines
        .map((l) => {
            const t = `<text x="${PAD}" y="${Math.round(y)}" font-family="Anton" font-size="${size}" fill="${fg}">${esc(l)}</text>`;
            y += lh;
            return t;
        })
        .join('\n  ');

    const ruleY = Math.round(start + titleH + RULE_GAP);
    let sy = ruleY + SUB_GAP + 40;
    const subSvg = subLines
        .map((l) => {
            const t = `<text x="${PAD}" y="${Math.round(sy)}" font-family="Oswald" font-size="52" fill="${muted}">${esc(l)}</text>`;
            sy += SUB_LH;
            return t;
        })
        .join('\n  ');

    const badgeY = Math.round(sy - SUB_LH + BADGE_GAP);
    const badge = book.badge
        ? `<rect x="${PAD}" y="${badgeY}" width="${book.badge.length * 24 + 60}" height="${BADGE_H}" fill="${accent}"/>
  <text x="${PAD + 30}" y="${badgeY + 46}" font-family="Archivo SemiBold" font-size="30" fill="#ffffff" letter-spacing="3">${esc(book.badge.toUpperCase())}</text>`
        : '';

    // Optional athlete photography. Embedded as a data URI (renderer has no
    // network), desaturated and tinted toward the accent so it reads as one
    // brand system, then darkened enough that the type stays legible.
    let photoLayer = '';
    if (book.photo && fs.existsSync(book.photo)) {
        const b64 = fs.readFileSync(book.photo).toString('base64');
        const mime = book.photo.endsWith('.jpg') || book.photo.endsWith('.jpeg') ? 'jpeg' : 'png';
        photoLayer = `
  <g>
    <image x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"
           href="data:image/${mime};base64,${b64}" filter="url(#duo)"/>
    <rect width="${W}" height="${H}" fill="${accent}" opacity="0.20"/>
    <rect width="${W}" height="${H}" fill="url(#scrim)"/>
  </g>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="76%" cy="16%" r="82%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="${light ? 0.5 : 0.55}"/>
      <stop offset="60%" stop-color="${bg}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${bg}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${bg}" stop-opacity="0.85"/>
    </linearGradient>
    <filter id="duo"><feColorMatrix type="saturate" values="0.15"/></filter>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${bg}" stop-opacity="0.86"/>
      <stop offset="45%" stop-color="${bg}" stop-opacity="0.62"/>
      <stop offset="100%" stop-color="${bg}" stop-opacity="0.95"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="${bg}"/>
  ${photoLayer}
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect y="${H * 0.55}" width="${W}" height="${H * 0.45}" fill="url(#fade)"/>

  <!-- accent spine -->
  <rect x="0" y="0" width="26" height="${H}" fill="${accent}"/>

  <!-- imprint -->
  <text x="${PAD}" y="220" font-family="Archivo SemiBold" font-size="36" fill="${fg}" letter-spacing="12">THE MENTAL SPORT</text>
  <rect x="${PAD}" y="266" width="150" height="10" fill="${accent}"/>

  ${titleSvg}

  <rect x="${PAD}" y="${ruleY}" width="${boxW}" height="4" fill="${accent}" opacity="0.65"/>
  ${subSvg}

  ${badge}

  <rect x="${PAD}" y="${H - 300}" width="120" height="10" fill="${accent}"/>
  <text x="${PAD}" y="${H - 190}" font-family="Anton" font-size="88" fill="${fg}">GIANNIS NOTARAS</text>
</svg>`;
}

// Gumroad requires a SQUARE thumbnail, so the 2:3 cover can't be reused. Same
// brand system, recomposed for 1:1.
export function thumbSvg(book) {
    const S = 1200;
    const accent = book.accent;
    const light = book.theme === 'light';
    const bg = light ? '#f7f5f1' : '#0a0a0b';
    const fg = light ? '#14141a' : '#ffffff';

    const PAD = 90;
    const boxW = S - PAD * 2;
    const { lines, size } = layoutTitle(book.displayTitle, boxW, 3);
    const lh = size * 1.0;
    const blockH = lines.length * lh;
    let y = (S - blockH) / 2 + size * 0.82;
    const titleSvg = lines
        .map((l) => {
            const t = `<text x="${PAD}" y="${Math.round(y)}" font-family="Anton" font-size="${size}" fill="${fg}">${esc(l)}</text>`;
            y += lh;
            return t;
        })
        .join('\n  ');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <radialGradient id="g" cx="78%" cy="16%" r="80%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.55"/>
      <stop offset="62%" stop-color="${bg}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${S}" height="${S}" fill="${bg}"/>
  <rect width="${S}" height="${S}" fill="url(#g)"/>
  <rect x="0" y="0" width="20" height="${S}" fill="${accent}"/>
  <text x="${PAD}" y="150" font-family="Archivo SemiBold" font-size="30" fill="${fg}" letter-spacing="10">THE MENTAL SPORT</text>
  <rect x="${PAD}" y="188" width="120" height="8" fill="${accent}"/>
  ${titleSvg}
  <rect x="${PAD}" y="${S - 190}" width="100" height="8" fill="${accent}"/>
  <text x="${PAD}" y="${S - 110}" font-family="Anton" font-size="60" fill="${fg}">GIANNIS NOTARAS</text>
</svg>`;
}

export function renderThumb(book, outPath) {
    const png = new Resvg(thumbSvg(book), {
        fitTo: { mode: 'width', value: 1200 },
        font: { fontDirs: [FONT_DIR], loadSystemFonts: true, defaultFontFamily: 'Archivo SemiBold' },
    })
        .render()
        .asPng();
    fs.writeFileSync(outPath, png);
    return outPath;
}

export function renderCover(book, outPath) {
    const svg = coverSvg(book);
    const png = new Resvg(svg, {
        fitTo: { mode: 'width', value: W },
        font: { fontDirs: [FONT_DIR], loadSystemFonts: true, defaultFontFamily: 'Archivo SemiBold' },
    })
        .render()
        .asPng();
    fs.writeFileSync(outPath, png);
    return outPath;
}

export const BOOKS = [
    {
        id: 'the-competition-protocol', file: 'the-competition-protocol.png', accent: '#dc2626',
        displayTitle: 'The Competition Protocol', maxLines: 3,
        subtitle: 'The 7-day system to stop choking when it counts',
        badge: '7-Day System',
    },
    {
        id: 'mental-blocks', file: 'overcoming-mental-blocks.png', accent: '#f59e0b',
        displayTitle: 'Overcoming Mental Blocks', maxLines: 3,
        subtitle: 'Silence the inner critic that costs you games',
        badge: 'Peak Performance',
    },
    {
        id: 'unbreakable', file: 'unbreakable.png', accent: '#0ea5e9', theme: 'light',
        displayTitle: 'Unbreakable', maxLines: 2,
        subtitle: "Teach your child to bounce back from anything",
        badge: 'Ages 6-9',
    },
    {
        id: 'confidence-building', file: 'confidence-building.png', accent: '#22c55e',
        displayTitle: 'The Confidence Workbook', maxLines: 3,
        subtitle: 'The exercises that turn self-doubt into belief',
        badge: 'Exercises Inside',
    },
    {
        id: 'resilient-confidence', file: 'resilient-confidence.png', accent: '#eab308',
        displayTitle: 'Resilient Confidence', maxLines: 2,
        subtitle: 'Build confidence that survives a loss',
        badge: 'Perform Under Pressure',
    },
    {
        id: 'nurturing-self-worth', file: 'nurturing-self-worth.png', accent: '#ef4444',
        displayTitle: 'Nurturing Self-Worth', maxLines: 2,
        subtitle: "Raise a child whose worth is not the scoreboard",
        badge: 'For Parents',
    },
    {
        id: 'physiological-performance', file: 'physiological-performance.png', accent: '#8b5cf6',
        displayTitle: 'Peak Performance Blueprint', maxLines: 3,
        subtitle: "Train the systems behind strength and endurance",
        badge: 'Science-Driven',
    },
    {
        id: 'adhd-athletes-edge', file: 'adhd-athletes-edge.png', accent: '#ec4899',
        displayTitle: "The ADHD Athlete's Edge", maxLines: 3,
        subtitle: 'Turn distraction into your unfair advantage',
        badge: 'Train With Your Brain',
    },
];

// Art direction for the athlete photography layer. Feed these to an image
// generator at 2:3, save to assets/cover-photos/<id>.png, then set `photo` on
// the book above and re-run. Deliberately no text, no faces of real people, and
// dark/high-contrast so the scrim and type sit on top cleanly.
export const PHOTO_PROMPTS = {
    'the-competition-protocol': 'Lone athlete alone in a dark stadium tunnel before competition, backlit, deep shadows, dramatic rim light, cinematic, high contrast, no text',
    'mental-blocks': 'Athlete sitting alone on an empty bench in a dark gym, head down, single hard light from above, heavy shadow, cinematic, high contrast, no text',
    'unbreakable': 'Two young children in sports kit climbing a hill at sunrise, bright optimistic light, wide shot, warm, storybook feel, no text',
    'confidence-building': 'Athlete standing tall alone in an empty arena, low camera angle looking up, powerful posture, dramatic side light, cinematic, high contrast, no text',
    'resilient-confidence': 'Runner mid-stride on a wet track at night under floodlights, water spray, motion energy, dramatic backlight, cinematic, high contrast, no text',
    'nurturing-self-worth': 'Parent kneeling to talk with a young athlete on the sideline at golden hour, warm backlight, tender, shallow depth of field, no text',
    'physiological-performance': 'Close detail of a powerful athlete mid-effort, sweat and muscle definition, hard directional light, anatomical and scientific mood, cinematic, no text',
    'adhd-athletes-edge': 'Athlete in explosive motion with light-trail streaks around them, energetic, kinetic blur, dark background, vivid rim light, cinematic, no text',
};

if (import.meta.url === `file://${process.argv[1]}`) {
    const outDir = process.argv[2] || OUT_DIR;
    fs.mkdirSync(outDir, { recursive: true });
    const thumbDir = path.join(outDir, 'thumbs');
    fs.mkdirSync(thumbDir, { recursive: true });
    for (const b of BOOKS) {
        renderCover(b, path.join(outDir, b.file));
        renderThumb(b, path.join(thumbDir, b.file));
        console.log(`  wrote ${b.file} (+ thumbs/${b.file})`);
    }
    console.log(`Done. ${BOOKS.length} covers + ${BOOKS.length} square thumbnails.`);
}
