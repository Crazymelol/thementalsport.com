import path from 'path';
import fs from 'fs';
import {splitIntoCaptions} from './splitScript';
import type {CharacterConfig, CharacterScene, CharacterPose, CharacterExpression} from './types';

const QUEUE_PATH = path.join(__dirname, '../../social/youtube-queue/queue.json');

type QueueItem = {
  id: string;
  status: string;
  hook: string;
  script: string;
  cta: string;
  character?: CharacterConfig;
  qa_status?: string;
};

type Rule = {test: RegExp; pose: CharacterPose; face: CharacterExpression};

// Tone-to-pose convention. See docs/superpowers/specs/2026-06-23-character-rollout-design.md §4-5.
const RULES: Rule[] = [
  {test: /\b(stop (it|arguing|doing)|drop it|let it go|quit|cut it out|enough)\b/i,
   pose: 'RoboDanceWB', face: 'Driven'},
  {test: /\b(afraid|scared|fear|doubt|spiral(ing)?|anxious|anxiety|nervous|pressure|stuck|can'?t|won'?t|losing|lost|fail(s|ed|ure)?|wrong|hurts?|broken|stress(ed)?)\b/i,
   pose: 'CrossedArmsWB', face: 'Driven'},
  {test: /^(name|say|ask|try|do|pick|choose|focus|breathe|repeat|remember|notice)\b/i,
   pose: 'PointingFingerWB', face: 'Driven'},
  {test: /\b(always|every time|again|habit|used to|usually)\b/i,
   pose: 'ShirtWB', face: 'Driven'},
  {test: /\b(truth|actually|really|isn'?t|not the|just an?|simply|normal|okay|fine)\b/i,
   pose: 'EasingWB', face: 'Calm'},
  {test: /\b(now|next|ahead|forward|better|improve|growth|confiden(t|ce)|comes back)\b/i,
   pose: 'WalkingWB', face: 'Smile'},
  {test: /^(you|it|that|this) (is|are|was|were|miss(ed)?|do(es)?n'?t)\b/i,
   pose: 'BlazerWB', face: 'Driven'},
];

const DEFAULT: CharacterScene = {pose: 'RestingWB', face: 'Calm'};
const SECONDARY_DEFAULT: CharacterScene = {pose: 'EasingWB', face: 'Calm'};
const CTA_DEFAULT: CharacterScene = {pose: 'PointingFingerWB', face: 'Smile'};

function sameScene(a: CharacterScene, b: CharacterScene | null): boolean {
  return !!b && a.pose === b.pose && a.face === b.face;
}

function matchScene(text: string, previous: CharacterScene | null, isCta = false): CharacterScene {
  const matches = RULES.filter((r) => r.test.test(text));
  for (const rule of matches) {
    const scene = {pose: rule.pose, face: rule.face};
    if (!sameScene(scene, previous)) return scene;
  }
  const fallback = isCta ? CTA_DEFAULT : DEFAULT;
  return sameScene(fallback, previous) ? SECONDARY_DEFAULT : fallback;
}

export function assignScenes(hook: string, script: string, cta: string): CharacterConfig {
  const captions = splitIntoCaptions(script);
  const scenes: CharacterScene[] = [];
  let previous: CharacterScene | null = null;

  const hookScene = matchScene(hook, previous);
  previous = hookScene;

  for (const caption of captions) {
    const scene = matchScene(caption, previous);
    scenes.push(scene);
    previous = scene;
  }

  const ctaScene = matchScene(cta, previous, true);

  return {hook: hookScene, scenes, cta: ctaScene};
}

function describeScene(scene: CharacterScene): string {
  return `${scene.pose}/${scene.face}`;
}

function main() {
  const args = process.argv.slice(2);
  const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8'));
  const items: QueueItem[] = queue.items;

  let targets: QueueItem[];
  if (args[0] === '--all-missing') {
    targets = items.filter((i) => i.status === 'pending' && !i.character);
  } else if (args[0]) {
    targets = items.filter((i) => i.id === args[0]);
    if (targets.length === 0) {
      console.error(`No item found with id ${args[0]}`);
      process.exit(1);
    }
  } else {
    console.error('Usage: tsx src/assignScenes.ts <id> | --all-missing');
    process.exit(1);
  }

  for (const item of targets) {
    item.character = assignScenes(item.hook, item.script, item.cta);
    if (item.qa_status === undefined) {
      item.qa_status = 'pending';
    }
    const sequence = [item.character.hook, ...item.character.scenes, item.character.cta]
      .map(describeScene)
      .join(' -> ');
    console.log(`${item.id}: ${sequence}`);
  }

  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2) + '\n');
}

// Entry-point guard: `main()` must only run on direct CLI invocation, not when
// another module (e.g. the smoke test, or a future caller) imports `assignScenes`.
// Without this, importing this file for its named export would also trigger the
// CLI's argv parsing and process.exit(1) as a side effect.
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
