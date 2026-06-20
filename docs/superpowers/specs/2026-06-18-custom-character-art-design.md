# Custom-Generated Character Art (Tier 3) — Design

**Date:** 2026-06-18
**Status:** Draft, awaiting review
**Owner ask:** "I want tier 3 but the free version" — replace the current
Open Peeps (`react-peeps`) illustrated character with a one-time,
custom-generated recurring character, with no recurring paid API or
subscription cost.

## 1. Context

The Shorts pipeline shipped a recurring illustrated character
(`remotion/src/Character.tsx`, using `react-peeps`/Open Peeps SVGs) to fix an
earlier complaint that the text-only kinetic-typography videos were "boring."
Feedback after watching the rendered output: the character looks "basic, like
a kids' creation." A follow-up research pass (deep-research skill) ranked
improvement options into four tiers:

- **Tier 0/1** (shipped separately, same day): Remotion-side polish —
  camera motion blur, simplex-noise idle motion, a punchier entrance spring,
  an audio-reactive glow, a grain/vignette overlay, and a queue-data fix so
  pose/expression never repeats back-to-back. These ship regardless of
  Tier 3 and are not re-litigated here.
- **Tier 2**: fallback options (DiceBear, GSAP, Rive) if Tier 3 turns out
  infeasible.
- **Tier 3** (this doc): stop using Open Peeps' stock art entirely. Generate
  one custom recurring character via a local/free diffusion model, commit the
  result as static image assets, and never call a paid generation API at
  render time or on any recurring basis.

This is a **full replacement** of `react-peeps`, not an opt-in alternate mode
— confirmed with the owner.

## 2. Non-goals

- Not a LoRA-trained, infinitely-posable character generator. See §4 for why.
- Not a per-render or per-video generation step. Generation happens once
  (or rarely, if the pose vocabulary grows later); every render after that
  reuses committed static assets, exactly like Open Peeps does today.
- Not applied to `HeroVideo.tsx` in this pass — same scoping as the original
  character doc; the Shorts queue is where this pays off across 3 posts/day.
- Not a redesign of the panel, motion, or layout. `CharacterPanel`,
  `CameraMotionBlur`, the noise-driven bob/sway, and the audio-reactive glow
  shipped in Tier 0/1 stay exactly as they are — only the leaf visual (the
  thing those effects are applied *to*) changes from an SVG `<Peep>` to a
  raster `<Img>`.

## 3. How strict does character consistency need to be?

This was the open question handed back for a judgment call, to be decided
from the project's actual posting cadence:

- YouTube Shorts poster: 3×/day (`youtube-shorts-poster.yml`, cron
  `0 8,16,23 * * *`), cross-posted to TikTok/Pinterest/X by separate cron
  workflows reading the same queue.
- Hero (long-form): 1×/week, out of scope for this pass (§2).

That's roughly 21 Shorts/week, but every one of them draws its character
pose/expression from the **same small, fixed vocabulary** already established
in the original character design doc and extended slightly since (currently
8 poses × 3 expressions = 24 combinations — see §6). Nothing about higher
posting frequency requires generating *new* art more often — it just means
the *same* committed combinations get reused more often, the same way Open
Peeps' fixed SVGs are reused today.

**Conclusion: consistency only has to hold within one small, one-time
generation batch (~24 images), not across unbounded future generations.**
That rules out needing LoRA training (the expensive part of the Tier 3
research — real GPU training time is short, but the human effort to curate a
training set and iterate is ~18-22 hours) in favor of a lighter per-image
technique (§4) that only has to stay consistent across a couple dozen
images reviewed by a human once, not forever.

## 4. Generation approach

**Base model: Stable Diffusion XL 1.0** (`stabilityai/stable-diffusion-xl-base-1.0`),
licensed under CreativeML Open RAIL++-M — unconditional commercial use, no
revenue threshold, only standard use-based content restrictions. This matters
because the output is a permanent brand asset reused indefinitely; SDXL-Turbo
was also considered (much faster CPU inference) but ships under the Stability
AI Community License, which is free only under $1M annual revenue and would
leave a permanent asset's licensing tied to the company's future revenue.
Since this is a one-time batch (runtime isn't on the critical path the way a
per-render cost would be), the unconditional license wins over Turbo's speed.

**Consistency technique — no LoRA training:**

1. **ControlNet (pose conditioning).** Render each existing Open Peeps pose
   (the same `StandingPoseType`s already in use) to a flat PNG once via a
   throwaway Remotion still-render, and feed it to a Canny/lineart ControlNet
   alongside the prompt. This keeps body proportions and pose composition
   identical to what's already tuned in `CharacterPanel`'s layout, and is the
   main lever that replaces what LoRA would otherwise be doing.
2. **Fixed master prompt.** One detailed, reused-verbatim character
   description (hairstyle, outfit, art style, brand color palette) plus a
   short per-combo suffix for the specific pose/expression. Expression is
   steered through the text prompt (SDXL handles this natively); no separate
   model needed. **Not decided in this doc:** the actual creative content of
   that description (what the character looks like) is a brand decision, not
   a technical one — to be nailed down with the owner before the generation
   workflow's first real run, separately from this doc's approval.
3. **IP-Adapter (Apache-2.0) for cross-image anchoring.** Generate one
   "reference" image first (neutral pose/expression) from the master prompt
   alone, then feed that image into IP-Adapter for every subsequent
   generation in the batch, alongside that combo's ControlNet pose and prompt
   suffix. This anchors face, hair, and outfit appearance across the batch —
   the standard lightweight substitute for LoRA-level consistency when only a
   couple dozen images are needed.
4. **Human curation pass.** Because the batch is small (~24 images, generated
   once), a person reviews the output and re-rolls (tweak seed/prompt) any
   individual combo that doesn't match well, before anything is committed.
   This one-time review replaces the ongoing QA that LoRA training would
   otherwise need to earn its cost.

**Background removal:** post-process every generated image with `rembg`
(U2-Native/MIT, local, free) rather than prompting for a solid background and
chroma-keying — more robust against imperfect diffusion edges. Output as
WebP with alpha (same size-consciousness as the existing mp3-not-wav choice
for narration) at `remotion/public/character/<pose>-<expression>.webp`.

## 5. Where generation runs

Confirmed (again) that this sandbox cannot reach HuggingFace
(`curl https://huggingface.co` → `403`), so weight downloads must happen on
a real network. This mirrors the exact constraint that already shaped the
**Voiceover Generator** workflow (Chatterbox/HuggingFace, CPU-only,
`ubuntu-latest`). The new character generator copies that precedent exactly:

- New workflow `.github/workflows/character-generator.yml`: `workflow_dispatch`
  only (this is a rare, manual, one-time-per-vocabulary-change job, not a
  cron), `contents: write`, caches `~/.cache/huggingface` across runs.
- New script `scripts/character/generate.py`: mirrors
  `scripts/voiceover/generate.py`'s shape — skips any pose/expression combo
  whose output file already exists (resumable), commits + pushes after each
  generated image (`VOICEOVER_COMMIT`-style env flag), so a long batch
  preserves progress even if the job is cancelled or hits a time limit.
- New `scripts/character/requirements.txt`: `diffusers`, `controlnet-aux`,
  `rembg`, plus their transitive `torch`/`transformers` (CPU wheels, same as
  Chatterbox today).

**Runtime budget:** CPU-only SDXL + ControlNet is roughly 10-15 min/image.
24 images is ~4-6 hours — close to GitHub Actions' fixed 6-hour job ceiling
(every plan, not configurable higher). The per-image resumable-commit
pattern makes that a soft constraint, not a hard blocker: if one
`workflow_dispatch` run doesn't finish, triggering it again picks up exactly
where it left off, identical to how the Voiceover Generator already handles
long backlogs.

## 6. Pose/expression vocabulary and schema

No change to the vocabulary's *values* — every pose/expression string
already used in `social/youtube-queue/queue.json` (e.g. `BlazerWB`,
`CrossedArmsWB`, `Driven`, `Calm`, `Smile`) stays exactly as-is, so **no data
migration is needed** in the queue. What changes is where those strings'
*types* come from:

```ts
// Before: imported from react-peeps
import type {HairType, StandingPoseType, FaceType} from 'react-peeps';

// After: project-owned, same literal values, no react-peeps dependency
export type CharacterPose = 'BlazerWB' | 'CrossedArmsWB' | 'EasingWB' | 'PointingFingerWB'
  | 'RestingWB' | 'RoboDanceWB' | 'ShirtWB' | 'WalkingWB';
export type CharacterExpression = 'Driven' | 'Calm' | 'Smile';
export type CharacterScene = {pose: CharacterPose; face: CharacterExpression};
```

The `hair` field is dropped from `CharacterConfig` — it was only ever set to
the single constant `'Short'` (the original doc fixed this on purpose, for
identity continuity), and a custom-drawn character has no hair *variable* to
parameterize. This is the one small intentional schema cleanup in this pass.

Generate the full cross product of every pose × every expression seen so far
(8 × 3 = 24) rather than only the ~9 combos `short-040` currently exercises,
so future queue items can freely mix any pose with any expression without
triggering a follow-up generation run.

## 7. `Character.tsx` integration

The Tier 0/1 work carries forward almost untouched — only the innermost leaf
changes:

- `AnimatedPeep`'s `<Peep body={...} face={...} hair={...} .../>` becomes
  `<Img src={staticFile(\`character/${scene.pose}-${scene.face}.webp\`)} />`
  (Remotion's `Img`, same render-readiness handling already used for
  `Audio`/`staticFile` elsewhere in this file). Everything wrapping it —
  the entrance spring, noise-driven bob/sway, `transform`/`filter` styles,
  `PeepStage`'s alignment, `CameraMotionBlur`, `AudioPulseGlow` — is unchanged.
- `ACCENT_GRADIENT` (the live SVG recolor) is removed — there's no
  `strokeColor`/`backgroundColor` prop on a raster image. The gold-accent
  brand treatment instead gets baked directly into the generation prompt
  (§4). **Trade-off worth naming explicitly:** this trades a free, instant,
  programmatic recolor for genuinely bespoke art — the right side of that
  trade for "stop looking like a kids' creation," but it does mean any future
  palette change requires regenerating assets, not editing a style prop.
- `react-peeps` is removed from `remotion/package.json` once the swap is
  live and nothing else references it.

## 8. Rollout

1. Add `scripts/character/` (`generate.py`, `requirements.txt`) and a
   throwaway Remotion still-render helper. Run the helper once, while
   `react-peeps` is still installed, to export each existing pose to a flat
   reference PNG for ControlNet conditioning, and commit those references —
   they're needed by step 3 and must exist before `react-peeps` is removed
   in step 4.
2. Add `.github/workflows/character-generator.yml` (mirrors
   `voiceover-generator.yml`).
3. Finalize the master prompt with the owner (§4), then run the workflow;
   review the ~24 generated images; re-roll any weak ones; let the
   resumable commit pattern handle multi-run if needed.
4. Update `types.ts` (§6) and `Character.tsx` (§7) to consume the new
   assets; drop `react-peeps` from `remotion/package.json`.
5. Re-render and re-QA every queue item that currently has a `character`
   block (today: just `short-040`) against the new art, same QA gate as
   Tier 0/1.
6. Commit + push to the dev branch (no PR unless asked, same standing rule
   as every other change in this repo).
