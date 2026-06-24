# Character Art Rollout to the Shorts Queue — Design

**Date:** 2026-06-23
**Status:** Draft, awaiting review
**Owner ask:** "We should start using all those things right?" — agreeing that the
24-combo custom character art grid (Tier 3, see
`docs/superpowers/specs/2026-06-18-custom-character-art-design.md`) is currently
used by exactly one queue item (`short-040`) despite many CI-hours spent
generating it, and should be rolled out more broadly.

## 1. Context

The Shorts queue (`social/youtube-queue/queue.json`) has 40 items. Of those,
19 are `status: "pending"` (not yet posted). Only `short-040` has a `character`
block; the other 18 pending items render as plain kinetic-typography with no
character panel, and were authored before the character feature existed.

`short-040`'s character block was hand-curated: each caption's pose/expression
was manually matched to that line's narration tone (e.g. `CrossedArmsWB`+`Driven`
for an anxious hook line, `WalkingWB`+`Smile` for the confident closing line).
That curation took real editorial judgment per line. Doing the same by hand for
18 backlog items (averaging 9.4 captions each — 169 caption beats total, plus
18 hooks and 18 CTAs) does not scale, and the queue grows weekly as Claude
refills it with new scripts.

## 2. Decisions

Three scoping questions were resolved directly with the owner before this doc
was written:

1. **Which items get a character block:** the 18 pending (not yet posted)
   legacy items, plus every new item authored from now on. Already-posted
   items are explicitly excluded — they won't be re-rendered or re-posted, so
   adding a character block to them would be cosmetic-only with no viewer-facing
   effect.
2. **Curation method:** not continued hand-curation, not a context-free
   rotation — a documented **tone-to-pose mapping convention**, applied by a
   small deterministic script, with a human/Claude skim-review pass before QA
   (mirroring the "human curation pass" precedent already established in the
   Tier 3 design for reviewing generated art).
3. **QA gate:** all 18 backfilled items go through the full render +
   `/qa-shorts` visual QA gate before they're allowed to post, closing the
   "legacy, no QA" gap for the existing backlog rather than letting newly-added
   character art reach viewers unreviewed.

## 3. Non-goals

- Not applied to already-posted queue items (§2.1).
- Not applied to `HeroVideo.tsx` — same scoping as both prior character docs;
  the Shorts queue is where this pays off across 3 posts/day.
- Not a sentiment-ML model. The matching script (§5) is a small ordered
  keyword/regex table — intentionally crude, because the design goal is
  "fast and consistent," not "perfect," and a human skim-review pass catches
  anything visibly wrong before QA.
- Not a change to `Character.tsx`, `render-queue.ts`, or the art assets
  themselves — those are complete (Tier 3 is fully shipped). This doc is
  purely about *populating* the `character` field on more queue items.
- Not a new dedicated skill file for queue authoring. Queue items are already
  authored ad hoc per `queue.json`'s own `_readme` ("Claude refills this queue
  with fresh scripts"); this doc extends that existing convention by one
  sentence (§6) rather than building new process scaffolding around it.

## 4. Tone-to-pose mapping convention

The original character design doc
(`docs/superpowers/specs/2026-06-18-shorts-illustrated-character-design.md`,
§7) already established meanings for 5 of the 8 poses, used to author
`short-040`. The other 3 poses (`BlazerWB`, `ShirtWB`, `RoboDanceWB`) were
added later for the full 24-combo grid but never given a documented meaning —
`short-040` used each of them exactly once. This doc extends the table to all
8 poses, keeping the 5 established rows unchanged and proposing meanings for
the other 3 based on how `short-040` actually used them:

| Concept | Pose | Expression | Status |
|---|---|---|---|
| Tense / defensive | `CrossedArmsWB` | `Driven` | established |
| Pointing / direct address | `PointingFingerWB` | `Driven` | established |
| Calm / reflective | `EasingWB` | `Calm` | established |
| Confident / forward motion / positive resolution | `WalkingWB` | `Smile` | established |
| Neutral / explaining setup | `RestingWB` | `Calm` | established |
| Blunt / matter-of-fact statement | `BlazerWB` | `Driven` | proposed (from 1 usage) |
| Casual / relatable description | `ShirtWB` | `Driven` | proposed (from 1 usage) |
| Emphatic / energetic dismissal | `RoboDanceWB` | `Driven` | proposed (from 1 usage) |

Approved by the owner as-is, including the 3 proposed rows.

> **Erratum (added during rollout, see plan §implementation):** direct
> comparison of the rendered `.webp` assets found that `CrossedArmsWB`,
> `PointingFingerWB`, and `BlazerWB` render as a visibly different character
> than the other 5 poses — a pre-existing art-asset inconsistency in the
> 24-combo grid, not a flaw in this mapping. `remotion/src/assignScenes.ts`'s
> rule table was patched to drop those 3 rows and remap their concepts onto
> the closest safe pose among the remaining 5 (`Tense/defensive`→`EasingWB`,
> `Pointing/direct address`→`RestingWB`, `Blunt/matter-of-fact`→`WalkingWB`,
> and the CTA default→`RoboDanceWB`). This is a temporary workaround, not a
> revision of the approved convention above — the table is left as originally
> approved for when the art grid is regenerated with consistent character
> identity across all 8 poses. `short-040`, authored before this fix, still
> uses all 8 poses and is unaffected.

## 5. Matching script — `remotion/src/assignScenes.ts`

A pure function, plus a thin CLI in the same style as `render-queue.ts`
(`cd remotion && npx tsx src/render-queue.ts <id>`).

### 5.1 Function signature

```ts
import {splitIntoCaptions} from './splitScript';
import type {CharacterConfig, CharacterScene, CharacterPose, CharacterExpression} from './types';

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

  const ctaScene = matchScene(cta, previous, /* isCta */ true);

  return {hook: hookScene, scenes, cta: ctaScene};
}
```

### 5.2 Rule table (checked top to bottom, first match wins)

```ts
type Rule = {test: RegExp; pose: CharacterPose; face: CharacterExpression};

const RULES: Rule[] = [
  // Emphatic / energetic dismissal
  {test: /\b(stop (it|arguing|doing)|drop it|let it go|quit|cut it out|enough)\b/i,
   pose: 'RoboDanceWB', face: 'Driven'},
  // Tense / defensive
  {test: /\b(afraid|scared|fear|doubt|spiral(ing)?|anxious|anxiety|nervous|pressure|stuck|can'?t|won'?t|losing|lost|fail(s|ed|ure)?|wrong|hurts?|broken|stress(ed)?)\b/i,
   pose: 'CrossedArmsWB', face: 'Driven'},
  // Pointing / direct address (sentence opens with an imperative)
  {test: /^(name|say|ask|try|do|pick|choose|focus|breathe|repeat|remember|notice)\b/i,
   pose: 'PointingFingerWB', face: 'Driven'},
  // Casual / relatable description
  {test: /\b(always|every time|again|habit|used to|usually)\b/i,
   pose: 'ShirtWB', face: 'Driven'},
  // Calm / reflective
  {test: /\b(truth|actually|really|isn'?t|not the|just an?|simply|normal|okay|fine)\b/i,
   pose: 'EasingWB', face: 'Calm'},
  // Confident / forward motion
  {test: /\b(now|next|ahead|forward|better|improve|growth|confiden(t|ce)|comes back)\b/i,
   pose: 'WalkingWB', face: 'Smile'},
  // Blunt / matter-of-fact (sentence opens with a flat declarative)
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
```

This is the actual implementation, not a sketch — the plan should use this
code directly (adjusted only if `writing-plans`'s self-review finds a concrete
bug).

### 5.3 CLI

```
cd remotion && npx tsx src/assignScenes.ts <id>           # one item
cd remotion && npx tsx src/assignScenes.ts --all-missing  # every pending item with no character block
```

Behavior:
- Reads `../../social/youtube-queue/queue.json` (same `QUEUE_PATH` convention
  as `render-queue.ts`).
- For `<id>`: finds that item, computes `assignScenes(item.hook, item.script, item.cta)`,
  assigns it to `item.character`.
- For `--all-missing`: does the same for every item where `status === "pending"`
  and `character` is not already set.
- After assigning `character`, if the item has no `qa_status` field at all,
  sets `qa_status: "pending"` (legacy → QA-gated, per §2.3). Items that already
  have a `qa_status` are left untouched.
- Writes `queue.json` back with 2-space indent + trailing newline (matching
  the file's existing format).
- Prints one line per touched item: `<id>: <hook pose/face> -> <scene1> -> ... -> <cta pose/face>`,
  so the sequence can be skimmed for anything obviously wrong before QA.

No unit test framework exists anywhere in `remotion/` today (no vitest/jest,
no `.test.*` files) — verification there happens through render + visual QA,
not unit tests. This script follows that same convention: correctness is
checked by skimming the printed summary, then by the existing `/qa-shorts`
render-and-watch gate, not by a new test suite.

## 6. Process integration

Update the `_readme` field in `social/youtube-queue/queue.json` to add one
sentence:

> "New items should include a `character` block — run `npx tsx
> src/assignScenes.ts <id>` from `remotion/` after adding the item to generate
> one, then skim the printed sequence before QA."

This is the only process change. There is no dedicated "author a new Shorts
item" skill to update — queue items are already authored ad hoc by Claude
per the `_readme`'s existing instruction, and this just extends that same
sentence.

## 7. QA backfill

All 18 pending legacy items already have narration audio committed under
`remotion/public/audio/<id>/` (confirmed: 10-13 files each, matching each
item's hook+caption+cta count) — there is no Voiceover Generator dependency
blocking QA.

Once `--all-missing` flips them to `qa_status: "pending"`, a plain
`/qa-shorts` invocation (no item ids — its default item-selection behavior)
will pick up all 18 in one pass: render → `video-qa-approver` review → record
verdict. Approved items then post on the existing 3/day cron cadence;
rejected ones stay `pending` with a `qa_notes` explanation for a follow-up fix.

## 8. Rollout

1. Add `remotion/src/assignScenes.ts` (§5.1, §5.2) with the CLI (§5.3).
   `tsc --noEmit` clean.
2. Run `npx tsx src/assignScenes.ts --all-missing` from `remotion/`. Skim the
   printed pose/expression sequences for all 18 items for anything obviously
   wrong (e.g. the same pose repeated for an entire item, or a clearly
   mismatched tone) before proceeding. Commit the queue.json changes.
3. Update `queue.json`'s `_readme` (§6). Commit.
4. Run `/qa-shorts` (no args) to render + QA all 18 backfilled items. Commit
   the recorded verdicts.
5. Push to the dev branch (no PR unless asked).
