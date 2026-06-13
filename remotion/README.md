# Shorts video renderer

Turns items from `../social/youtube-queue/queue.json` into vertical
(1080x1920) "text statement" videos — bold animated captions over a dark,
on-brand background, matching thementalsport.com's look. No voice/audio
track; designed as a silent, caption-driven format (common on
Shorts/Reels/TikTok) that's a separate format from the XTTS-narrated videos
the daily bots produce.

Each video has 3 parts, timed automatically from the script length:
1. **Hook** (3s) — audience tag + the hook line
2. **Captions** — the `script` field, split into ~9-word chunks, one per
   screen
3. **CTA** (~3.3s) — book title, `cta` text, and the `thementalsport.com/free`
   button

## Setup

```bash
cd remotion
npm install
```

## Preview / edit in Studio

```bash
npm run studio
```

## Render one item

```bash
npx tsx src/render-queue.ts short-001
```

## Render all pending items in the queue

```bash
npm run render-queue
```

Output goes to `out/<id>.mp4` (gitignored — these are binary artifacts, not
committed).

## Network-restricted environments

Remotion normally downloads its own "chrome-headless-shell" on first render.
If that host is blocked by your egress policy, point Remotion at any
Chrome/Chromium build that supports the new headless mode (e.g. Playwright's
bundled Chromium) via env vars:

```bash
export REMOTION_BROWSER_EXECUTABLE=/path/to/chrome
export REMOTION_CHROME_MODE=chrome-for-testing
npm run render-queue
```

On a normal machine with unrestricted internet, omit both and Remotion
downloads/uses its default browser.

## Editing the look

- `src/ShortVideo.tsx` — composition (hook/caption/CTA screens, timing
  constants)
- `src/theme.ts` — colors and font stack (deliberately system fonts, not
  Google Fonts, so rendering works offline)
- `src/splitScript.ts` — how `script` text is broken into caption chunks
