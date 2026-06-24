# Character Art Rollout to the Shorts Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every pending (not-yet-posted) Shorts queue item — and every item authored from now on — a `character` block, using a small deterministic tone-to-pose matching script instead of hand-curation, then run all backfilled items through the existing QA gate before they're allowed to post.

**Architecture:** One new pure function + CLI (`remotion/src/assignScenes.ts`) assigns a pose/expression per caption by matching caption text against an ordered keyword/regex rule table (the tone-to-pose convention), with a guard against repeating the same pose+expression on consecutive beats. The CLI mutates `social/youtube-queue/queue.json` directly (same file-read/write convention as `render-queue.ts`), then the existing `/qa-shorts` skill (unmodified) renders and QAs every newly-flagged item.

**Tech Stack:** TypeScript, `tsx` (already a devDependency in `remotion/`), no new dependencies, no new test framework (none exists in `remotion/` today — verification is via `tsc --noEmit`, a throwaway smoke-test script, and the existing render+QA gate).

---

## Reference: the design doc

Full rationale, the approved tone-to-pose table, and the QA-scope decision live in
`docs/superpowers/specs/2026-06-23-character-rollout-design.md`. This plan implements
that doc's §5 (script), §6 (process integration), §7-8 (QA backfill, rollout order)
exactly as specified there — nothing in this plan invents new scope.

---

### Task 1: Create the tone-to-pose matching script

**Files:**
- Create: `remotion/src/assignScenes.ts`
- Create (temporary, deleted in Step 5): `remotion/src/assignScenes.smoketest.ts`

- [x] **Step 1: Write `remotion/src/assignScenes.ts`**

```ts
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
```

- [x] **Step 2: Typecheck**

Run: `cd remotion && npx tsc --noEmit`
Expected: exits 0, no output.

- [x] **Step 3: Write a throwaway smoke-test file to verify the matching logic by hand**

Create `remotion/src/assignScenes.smoketest.ts`:

```ts
import {assignScenes} from './assignScenes';

console.log('--- case 1: short-040 excerpt (known-good ground truth) ---');
console.log(JSON.stringify(assignScenes(
  "There's a voice in your head after every mistake, and you've been listening to the wrong part of it.",
  'You miss the easy one. Instantly, the voice shows up. It says you always do this.',
  'The full self-talk script is free.'
), null, 2));

console.log('--- case 2: repeat-guard and default/secondary-default paths ---');
console.log(JSON.stringify(assignScenes(
  'Quick intro line here.',
  'I am stuck and afraid. I am stuck again and afraid. Hello world today. Greetings to everyone here.',
  'Thanks for watching this.'
), null, 2));
```

- [x] **Step 4: Run it and verify exact output**

Run: `cd remotion && npx tsx src/assignScenes.smoketest.ts`

Expected output:

```
--- case 1: short-040 excerpt (known-good ground truth) ---
{
  "hook": {
    "pose": "CrossedArmsWB",
    "face": "Driven"
  },
  "scenes": [
    {
      "pose": "BlazerWB",
      "face": "Driven"
    },
    {
      "pose": "RestingWB",
      "face": "Calm"
    },
    {
      "pose": "ShirtWB",
      "face": "Driven"
    }
  ],
  "cta": {
    "pose": "PointingFingerWB",
    "face": "Smile"
  }
}
--- case 2: repeat-guard and default/secondary-default paths ---
{
  "hook": {
    "pose": "RestingWB",
    "face": "Calm"
  },
  "scenes": [
    {
      "pose": "CrossedArmsWB",
      "face": "Driven"
    },
    {
      "pose": "ShirtWB",
      "face": "Driven"
    },
    {
      "pose": "RestingWB",
      "face": "Calm"
    },
    {
      "pose": "EasingWB",
      "face": "Calm"
    }
  ],
  "cta": {
    "pose": "PointingFingerWB",
    "face": "Smile"
  }
}
```

Case 1 confirms the hook, the "You miss..." blunt-statement match, and the CTA all
land exactly on `short-040`'s real hand-curated choices. Case 2's second scene
("I am stuck again and afraid.") would naively re-match `CrossedArmsWB`/`Driven`
(same as the first scene) — confirm the output shows `ShirtWB`/`Driven` instead
(the repeat guard falling through to the caption's second matching rule, `again`
→ Casual). Confirm the 4th scene shows `EasingWB`/`Calm`, not `RestingWB`/`Calm`
(the secondary-default kicking in because the 3rd scene already used the primary
default). If output differs from the above, the rule table or guard logic has a
bug — fix before proceeding.

- [x] **Step 5: Delete the smoke-test file**

Run: `rm remotion/src/assignScenes.smoketest.ts`

- [x] **Step 6: Commit**

```bash
git add remotion/src/assignScenes.ts
git commit -m "Add tone-to-pose matching script for Shorts character blocks"
```

---

### Task 2: Backfill `character` blocks into every pending item that lacks one

**Files:**
- Modify: `social/youtube-queue/queue.json` (data only, written by the Task 1 CLI — no manual edits)

- [x] **Step 1: Run the batch CLI**

Run: `cd remotion && npx tsx src/assignScenes.ts --all-missing`

Expected: one printed line per item that had no `character` block before this run,
e.g. `short-019: RestingWB/Calm -> ... -> PointingFingerWB/Smile`. As of this plan
being written there are 18 such items (`short-019` through `short-036`); the exact
count may differ slightly by execution time if the live posting cron has moved
some of them out of `pending` — that's expected and fine, the script's filter is
live.

- [x] **Step 2: Skim the printed sequences for anything obviously wrong**

Per the design doc §8 step 2: look for a single pose dominating an entire item's
sequence, or a sequence that reads as flatly mismatched to the item's title/tone.
The repeat guard already guarantees no two *consecutive* entries are identical, so
don't flag that — only flag sequences that look broken at a glance. If something
looks wrong, it's a rule-table tuning issue, not expected at this stage — fix the
rule in `assignScenes.ts`, re-run Step 1 (it's idempotent — only items still
lacking a `character` block are touched, but a fix means deleting the bad item's
`character` field first, or just re-running for that one id directly:
`npx tsx src/assignScenes.ts <id>`).

- [x] **Step 3: Verify every pending item now has a character block**

Run:
```bash
node -e '
const fs = require("fs");
const q = JSON.parse(fs.readFileSync("social/youtube-queue/queue.json", "utf-8"));
const pending = q.items.filter((i) => i.status === "pending");
const withoutCharacter = pending.filter((i) => !i.character);
console.log("pending items:", pending.length);
console.log("pending items still without a character block:", withoutCharacter.map((i) => i.id));
'
```
Expected output: `pending items still without a character block: []` (an empty array).

- [x] **Step 4: Commit**

```bash
git add social/youtube-queue/queue.json
git commit -m "Backfill character blocks into pending Shorts queue items"
```

---

### Task 3: Document the new-item convention in `queue.json`'s `_readme`

**Files:**
- Modify: `social/youtube-queue/queue.json` (the `_readme` field only)

- [x] **Step 1: Append the convention sentence**

Run (single-quoted shell wrapper — the appended sentence contains literal
backticks, which must NOT be interpreted by the shell; only the inner JS string
uses double quotes, since the sentence has no embedded double quotes):

```bash
node -e '
const fs = require("fs");
const p = "social/youtube-queue/queue.json";
const queue = JSON.parse(fs.readFileSync(p, "utf-8"));
queue._readme += " New items should include a `character` block — run `npx tsx src/assignScenes.ts <id>` from `remotion/` after adding the item to generate one, then skim the printed sequence before QA.";
fs.writeFileSync(p, JSON.stringify(queue, null, 2) + "\n");
'
```

- [x] **Step 2: Verify**

Run: `node -e 'console.log(JSON.parse(require("fs").readFileSync("social/youtube-queue/queue.json", "utf-8"))._readme)'`

Expected: prints the full `_readme` string, ending with `...then skim the printed
sequence before QA.`

- [x] **Step 3: Commit**

```bash
git add social/youtube-queue/queue.json
git commit -m "Document character-block convention in queue.json readme"
```

---

### Task 4: QA all backfilled items

This task is not a normal coding task — it invokes the existing `qa-shorts` skill,
which itself renders each item and dispatches a `video-qa-approver` agent per item.
It depends on Task 2 having landed (the skill's auto-selection picks up items by
`qa_status === "pending"`, which Task 2 set). Because this involves dispatching
agents itself, run it directly in the orchestrating session rather than handing it
to a generic implementer subagent — same as how the original character-art plan's
QA step (`docs/superpowers/plans/2026-06-18-custom-character-art.md`, Task 7) was
executed directly rather than delegated.

**Files:** none directly — `qa-shorts` modifies `social/youtube-queue/queue.json`
itself (per-item `qa_status`/`qa_notes`/`qa_reviewed_at`) and commits.

- [x] **Step 1: Invoke the qa-shorts skill with no arguments**

This auto-selects every item where `qa_status === "pending"` and narration audio
already exists under `remotion/public/audio/<id>/` — confirmed all of the backfilled
items already have audio committed, so none should be skipped for missing narration.

- [x] **Step 2: Verify every previously-pending item now has a final verdict**

Run:
```bash
node -e '
const fs = require("fs");
const q = JSON.parse(fs.readFileSync("social/youtube-queue/queue.json", "utf-8"));
const stillPending = q.items.filter((i) => i.character && i.qa_status === "pending");
console.log("items with a character block still stuck at qa_status=pending:", stillPending.map((i) => i.id));
'
```
Expected output: `items with a character block still stuck at qa_status=pending: []`
(every item the skill picked up should now read `"approved"` or `"rejected"`).
If any remain `"pending"`, they were skipped by the skill for missing narration —
investigate before continuing; do not treat this as done if the array is non-empty.

- [x] **Step 3: Confirm the skill's own commit landed**

Run: `git log --oneline -3`
Expected: top commit message starts with `QA:` (the `qa-shorts` skill's own commit
convention).

---

### Task 5: Push

- [x] **Step 1: Push to the dev branch**

```bash
git push -u origin claude/sleepy-gauss-CyGUG
```

- [x] **Step 2: Verify**

Run: `git status`
Expected: `Your branch is up to date with 'origin/claude/sleepy-gauss-CyGUG'.` and
`nothing to commit, working tree clean`.
