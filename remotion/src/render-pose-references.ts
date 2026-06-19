import path from 'path';
import fs from 'fs';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const ENTRY = path.join(__dirname, 'pose-reference-entry.tsx');
const OUT_DIR = path.join(__dirname, '../pose-reference');

const POSES = [
  'BlazerWB', 'CrossedArmsWB', 'EasingWB', 'PointingFingerWB',
  'RestingWB', 'RoboDanceWB', 'ShirtWB', 'WalkingWB',
] as const;

const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || undefined;
const chromeMode = (process.env.REMOTION_CHROME_MODE as 'chrome-for-testing' | 'headless-shell' | undefined) || undefined;

async function main() {
  fs.mkdirSync(OUT_DIR, {recursive: true});
  console.log('Bundling Remotion project...');
  const bundleLocation = await bundle({entryPoint: ENTRY});

  for (const pose of POSES) {
    const inputProps = {pose};
    console.log(`Rendering ${pose}...`);
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'PoseReference',
      inputProps,
      browserExecutable,
      chromeMode,
    });
    const output = path.join(OUT_DIR, `${pose}.png`);
    await renderStill({
      composition,
      serveUrl: bundleLocation,
      output,
      inputProps,
      imageFormat: 'png',
      browserExecutable,
      chromeMode,
    });
    console.log(`  -> ${output}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
