// Builds the bundled training content from the 48 Titans Protocol articles.
// Run from the repo root:  npx tsx scripts/app-content/build-content.ts [--check]
// Writes two committed copies (see spec): the app bundle and mina's copy
// (Vercel builds mina/ with root dir mina, so it can't read outside it).
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src/content/articles');
const OUTPUTS = [
  path.join(ROOT, 'app/assets/content/titans.json'),
  path.join(ROOT, 'mina/src/data/coach-content.json'),
];
const TOTAL_DAYS = 48;

type Day = {day: number; title: string; description: string; tags: string[]; body: string};

function build(): {version: number; days: Day[]} {
  if (!fs.existsSync(SRC_DIR)) throw new Error(`Not repo root? Missing ${SRC_DIR}`);
  const days: Day[] = [];
  for (const f of fs.readdirSync(SRC_DIR)) {
    const m = f.match(/^titans-protocol-day-(\d+)[\w-]*\.md$/);
    if (!m) continue;
    const parsed = matter(fs.readFileSync(path.join(SRC_DIR, f), 'utf-8'));
    const day = parseInt(m[1], 10);
    days.push({
      day,
      title: String(parsed.data.title ?? '').replace(/^Day \d+:\s*/i, ''),
      description: String(parsed.data.description ?? ''),
      tags: Array.isArray(parsed.data.tags) ? parsed.data.tags.map(String) : [],
      body: parsed.content.trim(),
    });
  }
  days.sort((a, b) => a.day - b.day);
  if (days.length !== TOTAL_DAYS) throw new Error(`Expected ${TOTAL_DAYS} days, found ${days.length}`);
  days.forEach((d, i) => {
    if (d.day !== i + 1) throw new Error(`Days not contiguous at index ${i}: got day ${d.day}`);
    if (!d.title || !d.body) throw new Error(`Day ${d.day}: empty title or body`);
  });
  return {version: 1, days};
}

function main() {
  const json = JSON.stringify(build(), null, 2) + '\n';
  if (process.argv.includes('--check')) {
    for (const out of OUTPUTS) {
      if (!fs.existsSync(out) || fs.readFileSync(out, 'utf-8') !== json) {
        console.error(`STALE: ${out} — re-run npx tsx scripts/app-content/build-content.ts`);
        process.exit(1);
      }
    }
    console.log('Content up to date.');
    return;
  }
  for (const out of OUTPUTS) {
    fs.mkdirSync(path.dirname(out), {recursive: true});
    fs.writeFileSync(out, json);
    console.log(`Wrote ${out}`);
  }
}

main();
