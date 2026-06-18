import path from 'path';
import fs from 'fs';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {FPS} from './ShortVideo';
import {loadAudio} from './voiceover';

// Long-form / hero render. Same engine as render-queue.ts (the Shorts), but
// reads the hero queue and renders the 1920x1080 HeroVideo composition.
const QUEUE_PATH = path.join(__dirname, '../../social/youtube-hero-queue/queue.json');
const OUT_DIR = path.join(__dirname, '../out');
const PUBLIC_DIR = path.join(__dirname, '../public');
const ENTRY = path.join(__dirname, 'index.ts');

type QueueItem = {
  id: string;
  status: string;
  audience: string;
  title: string;
  book_title?: string;
  hook: string;
  script: string;
  cta: string;
};

// Override on machines without Remotion's default headless-shell (same escape
// hatch the Shorts render uses).
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || undefined;
const chromeMode =
  (process.env.REMOTION_CHROME_MODE as 'chrome-for-testing' | 'headless-shell' | undefined) ||
  undefined;

async function main() {
  const requestedIds = process.argv.slice(2);
  const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8'));
  let items: QueueItem[] = queue.items;
  items =
    requestedIds.length > 0
      ? items.filter((i) => requestedIds.includes(i.id))
      : items.filter((i) => i.status === 'pending');

  if (items.length === 0) {
    console.log('No hero items to render.');
    return;
  }

  fs.mkdirSync(OUT_DIR, {recursive: true});

  console.log('Bundling Remotion project...');
  const bundleLocation = await bundle({entryPoint: ENTRY});

  for (const item of items) {
    // Narration (cloned voice) is generated/committed by the Voiceover step;
    // if present each Sequence is sized to its clip, else the silent layout.
    const audio = (await loadAudio(item, PUBLIC_DIR, FPS)) ?? undefined;
    const inputProps = {
      hook: item.hook,
      script: item.script,
      cta: item.cta,
      bookTitle: item.book_title ?? 'The Competition Protocol',
      audience: item.audience,
      audio,
    };

    console.log(`Rendering ${item.id} (HeroVideo)...`);
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'HeroVideo',
      inputProps,
      browserExecutable,
      chromeMode,
    });

    const outputLocation = path.join(OUT_DIR, `${item.id}.mp4`);
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation,
      inputProps,
      browserExecutable,
      chromeMode,
    });
    console.log(`  -> ${outputLocation}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
