import path from 'path';
import fs from 'fs';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';

const QUEUE_PATH = path.join(__dirname, '../../social/youtube-queue/queue.json');
const OUT_DIR = path.join(__dirname, '../out');
const ENTRY = path.join(__dirname, 'index.ts');

type QueueItem = {
  id: string;
  status: string;
  audience: string;
  title: string;
  hook: string;
  script: string;
  cta: string;
};

// Override via env on machines without Remotion's default headless-shell
// (e.g. network-restricted sandboxes): point at any Chrome/Chromium build
// that supports the new headless mode.
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || undefined;
const chromeMode = (process.env.REMOTION_CHROME_MODE as 'chrome-for-testing' | 'headless-shell' | undefined) || undefined;

async function main() {
  const requestedIds = process.argv.slice(2);
  const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8'));
  let items: QueueItem[] = queue.items;
  items =
    requestedIds.length > 0
      ? items.filter((i) => requestedIds.includes(i.id))
      : items.filter((i) => i.status === 'pending');

  if (items.length === 0) {
    console.log('No items to render.');
    return;
  }

  fs.mkdirSync(OUT_DIR, {recursive: true});

  console.log('Bundling Remotion project...');
  const bundleLocation = await bundle({entryPoint: ENTRY});

  for (const item of items) {
    const inputProps = {
      hook: item.hook,
      script: item.script,
      cta: item.cta,
      bookTitle: item.title.replace(/\s*#Shorts$/i, ''),
      audience: item.audience,
    };

    console.log(`Rendering ${item.id}...`);
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'ShortVideo',
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
