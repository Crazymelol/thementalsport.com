# Custom-Generated Character Art (Tier 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `react-peeps` (Open Peeps) illustrated character with a one-time, custom-generated character (SDXL + ControlNet + IP-Adapter), committed as static WebP assets, with zero recurring generation cost.

**Architecture:** A throwaway Remotion still-render exports each existing Open Peeps pose as a flat reference PNG while `react-peeps` is still installed. A new `scripts/character/generate.py` (mirroring `scripts/voiceover/generate.py`'s resumable, skip-existing, commit-as-you-go shape) runs in a new manual-only GitHub Actions workflow on `ubuntu-latest`, using those pose references to condition SDXL via ControlNet, anchoring identity across the batch with one IP-Adapter reference image, and committing one WebP per pose/expression combo to `remotion/public/character/`. `Character.tsx` then swaps its `<Peep>` SVG for an `<Img src={staticFile(...)}>`, `types.ts` drops its `react-peeps` type imports for project-owned literal unions, and `react-peeps` is uninstalled.

**Tech Stack:** TypeScript/React/Remotion (existing), Python 3.11 + `diffusers`/`transformers`/`controlnet-aux`/`rembg` (new, mirrors the existing Chatterbox/`torch` pattern), GitHub Actions (`ubuntu-latest`, `workflow_dispatch`, `actions/cache` for HF weights).

**Source design doc:** `docs/superpowers/specs/2026-06-18-custom-character-art-design.md` — read it first if anything below seems underspecified; this plan implements its §8 rollout, split into smaller commits.

---

## No automated test framework — how each task is verified

This repo has no unit test suite for the Remotion/Python pipeline (the existing `scripts/voiceover/` + `.github/workflows/voiceover-generator.yml` precedent has none either). Each task below substitutes the closest real, runnable check instead of a placeholder "add tests" step:

- TypeScript changes: `npx tsc --noEmit` inside `remotion/` (confirmed clean on the current baseline before this plan's changes).
- Python changes: `python3 -m py_compile <file>` for syntax, plus `generate.py`'s own `--dry-run` flag, which exercises argument parsing and the pose-reference-existence check without importing `torch`/`diffusers`.
- The new workflow YAML: parsed with PyYAML (`python3 -c "import yaml; yaml.safe_load(open(...))"`) to catch syntax errors — confirmed available in this environment (Python 3.11.15, PyYAML importable).
- The actual visual/behavioral result: a real Remotion still-render (Task 1) and the project's existing `qa-shorts` flow (Task 7), which is how every other visual change in this repo gets validated.

---

### Task 1: Pose-reference still-render helper

**Files:**
- Create: `remotion/src/PoseReference.tsx`
- Create: `remotion/src/pose-reference-entry.tsx`
- Create: `remotion/src/render-pose-references.ts`
- Create: `remotion/pose-reference/README.md`
- Generated (by Step 4, then committed): `remotion/pose-reference/{BlazerWB,CrossedArmsWB,EasingWB,PointingFingerWB,RestingWB,RoboDanceWB,ShirtWB,WalkingWB}.png`

This must run **before** `react-peeps` is removed (Task 5) — it's the only step that still has the library installed and can render its poses.

- [ ] **Step 1: Write `remotion/src/PoseReference.tsx`**

```tsx
import React from 'react';
import Peep from 'react-peeps';
import {AbsoluteFill} from 'remotion';
import type {StandingPoseType} from 'react-peeps';

// Throwaway: renders one Open Peeps pose as a flat, high-contrast reference
// image for ControlNet pose conditioning (scripts/character/generate.py).
// Deleted once Tier 3 art is live (see Task 5).
export const PoseReference: React.FC<{pose: StandingPoseType}> = ({pose}) => (
  <AbsoluteFill
    style={{backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center'}}
  >
    <Peep
      body={pose}
      face="Calm"
      hair="Short"
      strokeColor="#000000"
      backgroundColor="#000000"
      style={{height: '90%', width: 'auto', display: 'block'}}
    />
  </AbsoluteFill>
);
```

- [ ] **Step 2: Write `remotion/src/pose-reference-entry.tsx`**

```tsx
import React from 'react';
import {registerRoot, Still} from 'remotion';
import {PoseReference} from './PoseReference';

const PoseReferenceRoot: React.FC = () => (
  <Still
    id="PoseReference"
    component={PoseReference}
    width={1024}
    height={1024}
    defaultProps={{pose: 'RestingWB'}}
  />
);

registerRoot(PoseReferenceRoot);
```

- [ ] **Step 3: Write `remotion/src/render-pose-references.ts`**

```ts
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
```

- [ ] **Step 4: Verify TypeScript compiles, then actually render the 8 references**

Run:
```bash
cd remotion && npx tsc --noEmit
```
Expected: no output, exit code 0.

Then render (the headless-shell binary path is versioned/ephemeral, so look it up dynamically rather than hardcoding it):
```bash
cd remotion && REMOTION_BROWSER_EXECUTABLE=$(find /opt/pw-browsers -iname headless_shell | head -1) REMOTION_CHROME_MODE=headless-shell npx tsx src/render-pose-references.ts
```
Expected: a `Rendering <Pose>...` / `  -> .../pose-reference/<Pose>.png` pair for each of the 8 poses, then exit code 0. Confirm all 8 exist:
```bash
ls remotion/pose-reference/*.png | wc -l
```
Expected: `8`.

- [ ] **Step 5: Write `remotion/pose-reference/README.md`**

```md
# Pose reference images

One flat, high-contrast PNG per Open Peeps `StandingPoseType` used in
`social/youtube-queue/queue.json`'s `character` blocks. Originally rendered
by a throwaway Remotion script (`render-pose-references.ts`, removed after
use — see docs/superpowers/specs/2026-06-18-custom-character-art-design.md)
while `react-peeps` was still a dependency.

`scripts/character/generate.py` runs Canny edge detection on these to
condition SDXL's ControlNet, so the generated character keeps the same
body proportions and pose composition already tuned in `CharacterPanel`'s
layout. Kept around after the swap so a future pose addition has a
reference to extend from.
```

- [ ] **Step 6: Commit**

```bash
git add remotion/src/PoseReference.tsx remotion/src/pose-reference-entry.tsx remotion/src/render-pose-references.ts remotion/pose-reference/
git commit -m "Add pose-reference still-render helper for Tier 3 character art"
```

---

### Task 2: `scripts/character/` generation pipeline

**Files:**
- Create: `scripts/character/requirements.txt`
- Create: `scripts/character/prompt.py`
- Create: `scripts/character/generate.py`

- [ ] **Step 1: Write `scripts/character/requirements.txt`**

```
# SDXL + ControlNet + IP-Adapter (CreativeML Open RAIL++-M / Apache-2.0) for
# one-time custom character art generation, plus rembg (MIT) for background
# removal. Pulls in torch/transformers/Pillow/opencv-python-headless
# transitively; CPU wheels are fine on CI runners.
diffusers
transformers
accelerate
controlnet-aux
rembg
```

- [ ] **Step 2: Write `scripts/character/prompt.py`**

```python
"""Master character description -- the fixed creative identity reused across
every generated pose/expression combo (hairstyle, outfit, art style, brand
color palette). This is a brand decision for the owner, not a default to
invent -- see docs/superpowers/specs/2026-06-18-custom-character-art-design.md
(section 4). generate.py refuses to run real generation while this is still
the placeholder below.
"""
MASTER_PROMPT = "REPLACE_BEFORE_REAL_RUN"
```

- [ ] **Step 3: Write `scripts/character/generate.py`**

```python
#!/usr/bin/env python3
"""Generate the recurring Shorts character's static art (Tier 3): one SDXL +
ControlNet + IP-Adapter batch covering every pose x expression combo already
used in social/youtube-queue/queue.json's `character` blocks. Writes WebP
(with alpha) to remotion/public/character/<pose>-<face>.webp -- the exact
path Character.tsx reads via staticFile().

Mirrors scripts/voiceover/generate.py's shape: skips combos whose output
already exists (resumable), commits + pushes after each generated image
(CHARACTER_COMMIT-style env flag), so a long batch preserves progress even if
the job is cancelled or hits a time limit.

Usage:
    python scripts/character/generate.py [--dry-run] [--force] [combo ...]
Combo ids look like "BlazerWB-Driven" (pose-expression). With none given,
generates every combo from the full POSES x EXPRESSIONS cross product that is
still missing. --force regenerates named combos even if they already exist
(for the human curation re-roll pass in the design doc). --dry-run prints
what would be generated/skipped without loading torch/diffusers.

Note: SDXL + ControlNet weight downloads need internet (HuggingFace), so this
runs in GitHub Actions (full network), not the egress-restricted dev sandbox.
"""
import argparse
import os
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
POSE_REFERENCE_DIR = ROOT / "remotion" / "pose-reference"
OUT_DIR = ROOT / "remotion" / "public" / "character"

POSES = [
    "BlazerWB", "CrossedArmsWB", "EasingWB", "PointingFingerWB",
    "RestingWB", "RoboDanceWB", "ShirtWB", "WalkingWB",
]
EXPRESSIONS = ["Driven", "Calm", "Smile"]

POSE_PROMPTS = {
    "BlazerWB": "standing confidently in a blazer",
    "CrossedArmsWB": "standing with arms crossed",
    "EasingWB": "standing relaxed, leaning back slightly",
    "PointingFingerWB": "standing, pointing forward with one hand",
    "RestingWB": "standing neutrally, arms at sides",
    "RoboDanceWB": "standing in a dynamic dance-like pose",
    "ShirtWB": "standing casually in a t-shirt",
    "WalkingWB": "walking forward confidently",
}
EXPRESSION_PROMPTS = {
    "Driven": "intense, focused, serious expression",
    "Calm": "calm, neutral, composed expression",
    "Smile": "warm, confident, smiling expression",
}

REFERENCE_POSE = "RestingWB"
REFERENCE_EXPRESSION = "Calm"

NEGATIVE_PROMPT = (
    "photorealistic, photo, 3d render, extra limbs, extra fingers, blurry, "
    "watermark, text, signature, deformed, low quality"
)


def combo_id(pose, face):
    return f"{pose}-{face}"


def all_combos():
    return [(p, f) for p in POSES for f in EXPRESSIONS]


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("combos", nargs="*", help='e.g. "BlazerWB-Driven"')
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--force", action="store_true",
        help="regenerate named combos even if they already exist",
    )
    return parser.parse_args()


def resolve_combos(requested):
    if not requested:
        return all_combos()
    valid = {combo_id(p, f) for p, f in all_combos()}
    resolved = []
    for r in requested:
        if r not in valid:
            sys.exit(f"Unknown combo {r!r}. Expected one of: {sorted(valid)}")
        pose, face = r.split("-", 1)
        resolved.append((pose, face))
    return resolved


def commit_combo(pose, face):
    """Commit + push one image so a long batch keeps its progress if it dies
    partway. Enabled by CHARACTER_COMMIT=1 (set by the workflow); a no-op
    locally. Pull-rebase + retry tolerates concurrent pushes from the poster
    workflows."""
    if os.environ.get("CHARACTER_COMMIT") != "1":
        return
    branch = os.environ.get("GITHUB_REF_NAME", "")
    path = f"remotion/public/character/{combo_id(pose, face)}.webp"
    subprocess.run(["git", "add", path], check=True)
    if subprocess.run(["git", "diff", "--staged", "--quiet"]).returncode == 0:
        return
    subprocess.run(
        ["git", "commit", "-m", f"bot: character art for {combo_id(pose, face)}"],
        check=True,
    )
    for attempt in range(4):
        subprocess.run(["git", "pull", "--rebase", "origin", branch], check=False)
        if subprocess.run(["git", "push", "origin", f"HEAD:{branch}"]).returncode == 0:
            return
        time.sleep(2 ** attempt)
    print(f"   WARNING: could not push {combo_id(pose, face)} after retries; continuing")


def main():
    args = parse_args()
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    combos = resolve_combos(args.combos)
    pending = [
        (p, f) for p, f in combos
        if args.force or not (OUT_DIR / f"{combo_id(p, f)}.webp").exists()
    ]

    if not pending:
        print("All requested combos already have art. Nothing to do.")
        return

    print(f"Pending combos: {[combo_id(p, f) for p, f in pending]}")

    missing_refs = sorted({
        p for p, _ in pending if not (POSE_REFERENCE_DIR / f"{p}.png").exists()
    })
    if missing_refs:
        sys.exit(
            f"Missing pose reference(s) {missing_refs} under {POSE_REFERENCE_DIR}. "
            "Run remotion/src/render-pose-references.ts first."
        )

    if args.dry_run:
        from prompt import MASTER_PROMPT
        if MASTER_PROMPT.strip() == "REPLACE_BEFORE_REAL_RUN":
            print(
                "NOTE: prompt.py still has the placeholder MASTER_PROMPT -- fine "
                "for a dry run, but a real run will refuse to proceed until it's "
                "replaced with the owner's character description."
            )
        print("(dry run, stopping before loading torch/diffusers)")
        return

    from prompt import MASTER_PROMPT
    if MASTER_PROMPT.strip() == "REPLACE_BEFORE_REAL_RUN":
        sys.exit(
            "scripts/character/prompt.py still has the placeholder MASTER_PROMPT.\n"
            "Get the character's appearance (hairstyle, outfit, art style, brand "
            "colors) from the owner and replace it before running this for real.\n"
            "See docs/superpowers/specs/2026-06-18-custom-character-art-design.md (section 4)."
        )

    # Lazy import so --dry-run and argument-error paths never require torch.
    import torch
    from PIL import Image
    from controlnet_aux import CannyDetector
    from diffusers import ControlNetModel, StableDiffusionXLControlNetPipeline
    from rembg import remove as rembg_remove

    canny = CannyDetector()

    def canny_for(pose):
        ref = Image.open(POSE_REFERENCE_DIR / f"{pose}.png").convert("RGB")
        return canny(ref, detect_resolution=1024, image_resolution=1024)

    def prompt_for(pose, face):
        return f"{MASTER_PROMPT}, {POSE_PROMPTS[pose]}, {EXPRESSION_PROMPTS[face]}"

    def save_combo(pose, face, image):
        rgba = rembg_remove(image).convert("RGBA")
        out_path = OUT_DIR / f"{combo_id(pose, face)}.webp"
        rgba.save(out_path, "WEBP", lossless=False, quality=90)
        return rgba

    def flatten_on_white(rgba):
        background = Image.new("RGB", rgba.size, (255, 255, 255))
        background.paste(rgba, mask=rgba.split()[3])
        return background

    print("Loading SDXL + ControlNet (CPU)...")
    controlnet = ControlNetModel.from_pretrained(
        "diffusers/controlnet-canny-sdxl-1.0", torch_dtype=torch.float32,
    )
    pipe = StableDiffusionXLControlNetPipeline.from_pretrained(
        "stabilityai/stable-diffusion-xl-base-1.0",
        controlnet=controlnet,
        torch_dtype=torch.float32,
    )
    pipe.enable_attention_slicing()
    pipe.enable_vae_slicing()

    reference_path = OUT_DIR / f"{combo_id(REFERENCE_POSE, REFERENCE_EXPRESSION)}.webp"
    if (REFERENCE_POSE, REFERENCE_EXPRESSION) in pending:
        print(f"Generating reference combo {combo_id(REFERENCE_POSE, REFERENCE_EXPRESSION)}...")
        image = pipe(
            prompt=prompt_for(REFERENCE_POSE, REFERENCE_EXPRESSION),
            negative_prompt=NEGATIVE_PROMPT,
            image=canny_for(REFERENCE_POSE),
            controlnet_conditioning_scale=0.7,
            num_inference_steps=30,
        ).images[0]
        reference_rgba = save_combo(REFERENCE_POSE, REFERENCE_EXPRESSION, image)
        commit_combo(REFERENCE_POSE, REFERENCE_EXPRESSION)
        pending = [c for c in pending if c != (REFERENCE_POSE, REFERENCE_EXPRESSION)]
    else:
        reference_rgba = Image.open(reference_path).convert("RGBA")
    reference_image = flatten_on_white(reference_rgba)

    if pending:
        print("Loading IP-Adapter...")
        pipe.load_ip_adapter(
            "h94/IP-Adapter", subfolder="sdxl_models", weight_name="ip-adapter_sdxl.bin",
        )
        pipe.set_ip_adapter_scale(0.6)

    for pose, face in pending:
        print(f"== {combo_id(pose, face)}")
        image = pipe(
            prompt=prompt_for(pose, face),
            negative_prompt=NEGATIVE_PROMPT,
            image=canny_for(pose),
            ip_adapter_image=reference_image,
            controlnet_conditioning_scale=0.7,
            num_inference_steps=30,
        ).images[0]
        save_combo(pose, face, image)
        commit_combo(pose, face)

    print("Done.")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Verify syntax**

```bash
python3 -m py_compile scripts/character/generate.py scripts/character/prompt.py
```
Expected: no output, exit code 0.

- [ ] **Step 5: Verify `--dry-run` (requires Task 1's pose references to already exist)**

```bash
python3 scripts/character/generate.py --dry-run
```
Expected: prints `Pending combos: [...]` listing all 24 `<Pose>-<Expression>` ids, then the `NOTE: prompt.py still has the placeholder MASTER_PROMPT...` line, then `(dry run, stopping before loading torch/diffusers)`. Exit code 0. No `torch`/`diffusers` import is attempted, so this works even though those packages aren't installed in the dev sandbox.

- [ ] **Step 6: Verify the placeholder-prompt guard actually blocks a real run**

```bash
python3 scripts/character/generate.py BlazerWB-Driven
```
Expected: exits non-zero with a multi-line message ending in `...(section 4).`, **before** attempting `import torch` (confirms the safety check in Step 3's design — see "Problem Solving" note: the dry-run's existence check must run before any early return, and the placeholder check must run before the lazy heavy imports).

- [ ] **Step 7: Commit**

```bash
git add scripts/character/requirements.txt scripts/character/prompt.py scripts/character/generate.py
git commit -m "Add scripts/character/ SDXL generation pipeline for Tier 3 character art"
```

---

### Task 3: `character-generator.yml` workflow

**Files:**
- Create: `.github/workflows/character-generator.yml`

- [ ] **Step 1: Write `.github/workflows/character-generator.yml`**

```yaml
name: Character Generator

# Generates the recurring Shorts character's static art (Tier 3: SDXL +
# ControlNet + IP-Adapter, one-time batch) and commits it to
# remotion/public/character/. Run once per new pose/expression vocabulary --
# the Remotion render then reuses the committed WebP assets, so it stays
# lightweight (no ML deps). Manual-only: generation is expensive and rarely
# needs regenerating.

on:
  workflow_dispatch:
    inputs:
      combos:
        description: 'Space-separated combo ids, e.g. "BlazerWB-Driven" (blank = all missing)'
        required: false
        default: ''
      force:
        description: 'Regenerate named combos even if they already exist (re-roll)'
        type: boolean
        required: false
        default: false

permissions:
  contents: write

concurrency:
  group: character-generator
  cancel-in-progress: false

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Cache model weights
        uses: actions/cache@v4
        with:
          path: ~/.cache/huggingface
          key: character-hf-cache-v1

      - name: Install Python dependencies
        run: pip install -r scripts/character/requirements.txt

      - name: Generate character art
        env:
          CHARACTER_COMMIT: '1'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          python scripts/character/generate.py \
            ${{ github.event.inputs.force == 'true' && '--force' || '' }} \
            ${{ github.event.inputs.combos }}
```

- [ ] **Step 2: Verify YAML syntax**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/character-generator.yml')); print('OK')"
```
Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/character-generator.yml
git commit -m "Add character-generator workflow for Tier 3 character art"
```

---

### Task 4: CHECKPOINT — master prompt + generation run

**This task cannot be completed unattended.** The master prompt's creative content (what the character actually looks like) is a brand decision for the owner, not something to invent — flagged explicitly in the design doc (§4: "Not decided in this doc... to be nailed down with the owner before the generation workflow's first real run") and guarded mechanically by Step 6 of Task 2 (the placeholder check). Do not write a character description yourself and proceed; stop and ask.

- [ ] **Step 1: Get the character description from the owner**

Ask for a single paragraph covering, at minimum:
- Hairstyle and overall look
- Outfit (the design doc's pose vocabulary is upper-body/full-body standing poses — `BlazerWB`, `ShirtWB`, etc. — so outfit should make sense across both a blazer and a casual-shirt pose)
- Art style (e.g. "flat vector illustration," "loose ink sketch," "comic-book cel shading" — `CharacterPanel`'s existing brand treatment is a screen-printed-comic look, so the description should either lean into or deliberately diverge from that)
- Brand color palette (the existing accent is gold, `#f5c518` — decide whether the character should incorporate it)

If a question like this hasn't already been asked in this session, use `AskUserQuestion` (or a plain message, if a free-text paragraph is expected rather than a multiple-choice pick) to get this from the owner now. Do not proceed to Step 2 until you have an actual description.

- [ ] **Step 2: Write the description into `scripts/character/prompt.py`**

Replace:
```python
MASTER_PROMPT = "REPLACE_BEFORE_REAL_RUN"
```
with the owner's description, e.g. (illustrative shape only — use the real content from Step 1, not this example):
```python
MASTER_PROMPT = (
    "<owner's actual character description here: hairstyle, outfit, "
    "art style, color palette>"
)
```

- [ ] **Step 3: Re-run the dry-run check, now without the placeholder warning**

```bash
python3 scripts/character/generate.py --dry-run
```
Expected: same `Pending combos: [...]` line as Task 2 Step 5, but **no** `NOTE: prompt.py still has the placeholder...` line this time.

- [ ] **Step 4: Commit the prompt**

```bash
git add scripts/character/prompt.py
git commit -m "Set master character prompt for Tier 3 art generation"
```

- [ ] **Step 5: Confirm with the user before triggering the real run**

This is a multi-hour job (§5 of the design doc: ~10-15 min/image CPU-only, ~4-6 hours for all 24 images, close to GitHub Actions' fixed 6-hour ceiling). Explicitly tell the user the expected duration and ask for go-ahead before dispatching it — this is exactly the kind of hard-to-cheaply-undo, resource-consuming action the "Executing actions with care" guidance calls out for a confirmation pause.

- [ ] **Step 6: Trigger the workflow**

Use `mcp__github__actions_run_trigger` (load its schema via `ToolSearch` with `select:mcp__github__actions_run_trigger` first if needed) to dispatch `.github/workflows/character-generator.yml` on branch `claude/sleepy-gauss-CyGUG` with both inputs blank (full batch, no `--force`).

- [ ] **Step 7: Monitor to completion**

Use `mcp__github__actions_list` / `mcp__github__actions_get` (and `mcp__github__get_job_logs` if a run fails) to check status periodically — do not poll in a tight loop; space out checks. If the run is cancelled or hits the 6-hour ceiling before finishing, re-trigger the same workflow with blank inputs: `generate.py` skips every combo that already has a committed WebP, so it resumes rather than restarting.

- [ ] **Step 8: Review the generated images**

Once the run completes, pull the latest commits on `claude/sleepy-gauss-CyGUG` and look at the 24 files under `remotion/public/character/`. Identify any combo that doesn't match the master prompt well (off-model face/outfit, broken pose, artifacting).

- [ ] **Step 9: Re-roll any weak combos (only if needed)**

```bash
python3 scripts/character/generate.py --force <combo-id> [<combo-id> ...]
```
Re-trigger via the same workflow (Step 6) with the `combos` input set to the specific failing ids and `force` set to `true`, rather than running this locally — the dev sandbox has no `torch`/`diffusers` installed and no HuggingFace network access.

---

### Task 5: Swap `react-peeps` for generated art

**Files:**
- Modify: `remotion/src/types.ts`
- Modify: `remotion/src/Character.tsx` (full rewrite)
- Modify: `remotion/src/ShortVideo.tsx` (12 edits)
- Delete: `remotion/src/PoseReference.tsx`, `remotion/src/pose-reference-entry.tsx`, `remotion/src/render-pose-references.ts`
- Modify: `remotion/package.json` / `package-lock.json` (via `npm uninstall`)

Do not start this task until Task 4 has produced real, reviewed art — `Character.tsx` will reference `.webp` files that must already exist, and this is the only character-bearing queue item (`short-040`) in the repo, so a premature swap breaks its render for the entire generation gap.

- [ ] **Step 1: Replace the bottom block of `remotion/src/types.ts`**

Old (the last 16 lines of the file):
```ts
// Optional recurring illustrated character (react-peeps), opted into per
// queue item via a `character` field. `scenes` is one entry per caption, in
// the same order as splitIntoCaptions(script).
import type {StandingPoseType, FaceType, HairType} from 'react-peeps';

export type CharacterScene = {
  pose: StandingPoseType;
  face: FaceType;
};

export type CharacterConfig = {
  hair: HairType;
  hook: CharacterScene;
  scenes: CharacterScene[];
  cta: CharacterScene;
};
```

New:
```ts
// Optional recurring illustrated character (custom Tier 3 art, generated
// once by scripts/character/generate.py), opted into per queue item via a
// `character` field. `scenes` is one entry per caption, in the same order
// as splitIntoCaptions(script).
export type CharacterPose =
  | 'BlazerWB'
  | 'CrossedArmsWB'
  | 'EasingWB'
  | 'PointingFingerWB'
  | 'RestingWB'
  | 'RoboDanceWB'
  | 'ShirtWB'
  | 'WalkingWB';
export type CharacterExpression = 'Driven' | 'Calm' | 'Smile';

export type CharacterScene = {
  pose: CharacterPose;
  face: CharacterExpression;
};

export type CharacterConfig = {
  hook: CharacterScene;
  scenes: CharacterScene[];
  cta: CharacterScene;
};
```

- [ ] **Step 2: Rewrite `remotion/src/Character.tsx` in full**

```tsx
import React from 'react';
import {Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {noise2D} from '@remotion/noise';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {COLORS} from './theme';
import type {CharacterScene} from './types';

// Renders the posed figure itself. Kept as its own component (rather than
// computing the transform in CharacterPanel and passing an element down)
// because CameraMotionBlur works by freeze-ing its children at several
// nearby-but-different frames and compositing them — that only produces a
// blur trail if something inside actually calls useCurrentFrame() per copy.
// If the transform were computed in the parent and handed down as a fixed
// style, every copy would freeze on the same already-resolved pose.
const AnimatedCharacter: React.FC<{scene: CharacterScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Each caption gets its own <Sequence>, which remounts this component and
  // resets frame to 0 — so this pop-in replays automatically on every scene
  // change with no scene-change detection needed.
  const enter = spring({frame, fps, config: {damping: 7, mass: 0.6, stiffness: 170}});
  const popScale = interpolate(enter, [0, 1], [0.7, 1]);
  const popY = interpolate(enter, [0, 1], [60, 0]);

  // Small continuous bob/sway layered on top of the pop-in so a held pose
  // never goes fully static once the entrance settles. Simplex noise instead
  // of a sine wave so the motion doesn't read as a mechanical, repeating
  // loop — each seed gets its own independent wander.
  const bob = noise2D('character-bob', frame * 0.05, 0) * 6;
  const sway = noise2D('character-sway', frame * 0.037, 0) * 1.4;

  return (
    <Img
      src={staticFile(`character/${scene.pose}-${scene.face}.webp`)}
      style={{
        height: '94%',
        width: 'auto',
        maxWidth: '85%',
        display: 'block',
        transform: `translateY(${popY + bob}px) rotate(${sway}deg) scale(${popScale})`,
        filter:
          'drop-shadow(0 18px 22px rgba(0,0,0,0.45)) drop-shadow(0 4px 8px rgba(0,0,0,0.35))',
      }}
    />
  );
};

// Re-establishes the panel's bottom-anchored, centered composition inside
// CameraMotionBlur's children. CameraMotionBlur renders each sample in its
// own full-bleed AbsoluteFill (no alignment of its own), so without this the
// figure would stretch to fill the frame instead of sitting bottom-center.
const CharacterStage: React.FC<{scene: CharacterScene}> = ({scene}) => (
  <div
    style={{
      height: '100%',
      width: '100%',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
    }}
  >
    <AnimatedCharacter scene={scene} />
  </div>
);

const AUDIO_SAMPLES = 32; // visualizeAudio requires a power of two.

// Subtle glow behind the figure that brightens with narration loudness.
// Split out from CharacterPanel so useAudioData — which throws on an empty
// src — only ever runs when a real clip is mounted (panel callers omit
// audioSrc entirely for the no-narration fallback layout).
const AudioPulseGlow: React.FC<{src: string}> = ({src}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const audioData = useAudioData(src);
  if (!audioData) {
    return null;
  }

  const spectrum = visualizeAudio({audioData, frame, fps, numberOfSamples: AUDIO_SAMPLES});
  const peak = Math.max(...spectrum);
  // visualizeAudio normalizes each bin against the clip's own peak sample,
  // so a single bin rarely approaches 1 even on loud syllables — this
  // window is tuned by ear against rendered narration, not derived
  // analytically.
  const pulse = interpolate(peak, [0.05, 0.4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: `radial-gradient(circle at 50% 62%, rgba(245,197,24,${(0.16 + pulse * 0.26).toFixed(3)}) 0%, transparent 62%)`,
      }}
    />
  );
};

// Comic-panel card for the illustrated character. Occupies the top band of
// the screen; the caller positions/sizes it via `style`. `audioSrc` is
// optional — omit it for screens with no narration clip (the legacy
// silent-layout path never passes one).
export const CharacterPanel: React.FC<{
  scene: CharacterScene;
  audioSrc?: string;
  style?: React.CSSProperties;
}> = ({scene, audioSrc, style}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 56,
        left: 56,
        right: 56,
        height: '53%',
        borderRadius: 32,
        backgroundColor: COLORS.backgroundAlt,
        // Layered comic backdrop: a warm glow behind the figure, a faint
        // radiating action-line burst, and a tiled halftone dot screen —
        // all pure CSS gradients, no extra assets.
        backgroundImage: [
          'radial-gradient(circle at 50% 38%, rgba(245,197,24,0.22), transparent 60%)',
          'repeating-conic-gradient(from 0deg at 50% 42%, rgba(245,197,24,0.10) 0deg 9deg, transparent 9deg 18deg)',
          'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1.5px)',
        ].join(', '),
        backgroundSize: 'auto, auto, 15px 15px',
        backgroundRepeat: 'no-repeat, no-repeat, repeat',
        border: '3px solid rgba(245,197,24,0.22)',
        boxShadow: '0 28px 56px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {audioSrc && <AudioPulseGlow src={audioSrc} />}
      <CameraMotionBlur samples={6} shutterAngle={150}>
        <CharacterStage scene={scene} />
      </CameraMotionBlur>
    </div>
  );
};
```

- [ ] **Step 3: Apply 12 edits to `remotion/src/ShortVideo.tsx`**

**3a.** Remove the now-unused import (immediately after the `./types` import):
```ts
old: import type {HairType} from 'react-peeps';
new: (delete the line entirely)
```

**3b.** `ScreenFrame` signature + gate + call:
```tsx
old:
const ScreenFrame: React.FC<{
  scene?: CharacterScene;
  hair?: HairType;
  audioSrc?: string;
  padding: number;
  children: React.ReactNode;
}> = ({scene, hair, audioSrc, padding, children}) => {
  if (scene && hair) {
    return (
      <AbsoluteFill>
        <Background />
        <CharacterPanel scene={scene} hair={hair} audioSrc={audioSrc} />

new:
const ScreenFrame: React.FC<{
  scene?: CharacterScene;
  audioSrc?: string;
  padding: number;
  children: React.ReactNode;
}> = ({scene, audioSrc, padding, children}) => {
  if (scene) {
    return (
      <AbsoluteFill>
        <Background />
        <CharacterPanel scene={scene} audioSrc={audioSrc} />
```

**3c.** `HookScreen` signature:
```tsx
old:
const HookScreen: React.FC<{
  audience: string;
  hook: string;
  scene?: CharacterScene;
  hair?: HairType;
  audioSrc?: string;
}> = ({audience, hook, scene, hair, audioSrc}) => {

new:
const HookScreen: React.FC<{
  audience: string;
  hook: string;
  scene?: CharacterScene;
  audioSrc?: string;
}> = ({audience, hook, scene, audioSrc}) => {
```

**3d.** `hasCharacter`:
```tsx
old: const hasCharacter = Boolean(scene && hair);
new: const hasCharacter = Boolean(scene);
```

**3e.** `HookScreen`'s `ScreenFrame` call (disambiguated by the `color: ACCENT` div that follows):
```tsx
old:
      <ScreenFrame scene={scene} hair={hair} audioSrc={audioSrc} padding={72}>
        <div
          style={{
            color: ACCENT,
            fontFamily,
            fontSize: 24,

new:
      <ScreenFrame scene={scene} audioSrc={audioSrc} padding={72}>
        <div
          style={{
            color: ACCENT,
            fontFamily,
            fontSize: 24,
```

**3f.** `CaptionScreen` signature:
```tsx
old:
const CaptionScreen: React.FC<{
  text: string;
  words?: WordTiming[];
  scene?: CharacterScene;
  hair?: HairType;
  audioSrc?: string;
}> = ({text, words, scene, hair, audioSrc}) => {

new:
const CaptionScreen: React.FC<{
  text: string;
  words?: WordTiming[];
  scene?: CharacterScene;
  audioSrc?: string;
}> = ({text, words, scene, audioSrc}) => {
```

**3g.** `CaptionScreen`'s gate + call:
```tsx
old:
  if (scene && hair) {
    return (
      <ScreenFrame scene={scene} hair={hair} audioSrc={audioSrc} padding={72}>
        {captionText(54)}
      </ScreenFrame>
    );
  }

new:
  if (scene) {
    return (
      <ScreenFrame scene={scene} audioSrc={audioSrc} padding={72}>
        {captionText(54)}
      </ScreenFrame>
    );
  }
```

**3h.** `CTAScreen` signature:
```tsx
old:
const CTAScreen: React.FC<{
  cta: string;
  bookTitle: string;
  scene?: CharacterScene;
  hair?: HairType;
  audioSrc?: string;
}> = ({cta, bookTitle, scene, hair, audioSrc}) => {

new:
const CTAScreen: React.FC<{
  cta: string;
  bookTitle: string;
  scene?: CharacterScene;
  audioSrc?: string;
}> = ({cta, bookTitle, scene, audioSrc}) => {
```

**3i.** `CTAScreen`'s gate + call:
```tsx
old:
  if (scene && hair) {
    return (
      <ScreenFrame scene={scene} hair={hair} audioSrc={audioSrc} padding={80}>
        {ctaContent(44)}
      </ScreenFrame>
    );
  }

new:
  if (scene) {
    return (
      <ScreenFrame scene={scene} audioSrc={audioSrc} padding={80}>
        {ctaContent(44)}
      </ScreenFrame>
    );
  }
```

**3j.** `CaptionScreen` call site inside the `captionSequences` map:
```tsx
old:
        <CaptionScreen
          text={caption}
          words={captionAudio?.words}
          scene={character?.scenes[i]}
          hair={character?.hair}
          audioSrc={captionAudio && staticFile(captionAudio.src)}
        />

new:
        <CaptionScreen
          text={caption}
          words={captionAudio?.words}
          scene={character?.scenes[i]}
          audioSrc={captionAudio && staticFile(captionAudio.src)}
        />
```

**3k.** `HookScreen` call site:
```tsx
old:
        <HookScreen
          audience={audience}
          hook={hook}
          scene={character?.hook}
          hair={character?.hair}
          audioSrc={audio && staticFile(audio.hook.src)}
        />

new:
        <HookScreen
          audience={audience}
          hook={hook}
          scene={character?.hook}
          audioSrc={audio && staticFile(audio.hook.src)}
        />
```

**3l.** `CTAScreen` call site:
```tsx
old:
        <CTAScreen
          cta={cta}
          bookTitle={bookTitle}
          scene={character?.cta}
          hair={character?.hair}
          audioSrc={audio && staticFile(audio.cta.src)}
        />

new:
        <CTAScreen
          cta={cta}
          bookTitle={bookTitle}
          scene={character?.cta}
          audioSrc={audio && staticFile(audio.cta.src)}
        />
```

- [ ] **Step 4: Delete the throwaway pose-reference helper files**

```bash
git rm remotion/src/PoseReference.tsx remotion/src/pose-reference-entry.tsx remotion/src/render-pose-references.ts
```
(Leave `remotion/pose-reference/*.png` and its `README.md` in place — see the README's own rationale for keeping them.)

- [ ] **Step 5: Remove the `react-peeps` dependency**

```bash
cd remotion && npm uninstall react-peeps
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd remotion && npx tsc --noEmit
```
Expected: no output, exit code 0. (This is the step that confirms `types.ts`, `Character.tsx`, and all 12 `ShortVideo.tsx` edits are mutually consistent — e.g. that no leftover `hair`/`HairType` reference survived anywhere.)

- [ ] **Step 7: Commit**

```bash
git add remotion/src/types.ts remotion/src/Character.tsx remotion/src/ShortVideo.tsx remotion/package.json remotion/package-lock.json
git commit -m "Swap react-peeps for generated Tier 3 character art"
```

---

### Task 6: Update `queue.json`

**Files:**
- Modify: `social/youtube-queue/queue.json`

- [ ] **Step 1: Drop the now-unused `hair` field from `short-040`'s `character` block**

```json
old:
      "character": {
        "hair": "Short",
        "hook": {

new:
      "character": {
        "hook": {
```

- [ ] **Step 2: Reset `short-040`'s QA status so it re-enters the QA gate**

```json
old:
      "id": "short-040",
      "status": "pending",
      "qa_status": "approved",
      "qa_notes": "Re-approved after character visual upgrade (motion blur, noise-driven bob/sway, audio-reactive glow, grain/vignette) and pose rotation fix. New effects read clean with no legibility regressions: grain/vignette only textures the dark background, glow stays confined to the card. Audio -19.5 LUFS, no silence/black gaps. Captions match script verbatim in order. Title, CTA, /free link, and footer all match. Minor cosmetic-only note: wider poses' shoulders bleed past the card edge by design.",
      "qa_reviewed_at": "2026-06-18T22:10:35Z",

new:
      "id": "short-040",
      "status": "pending",
      "qa_status": "pending",
      "qa_notes": "Reset to pending: character re-rendered with Tier 3 custom art (replacing react-peeps) — needs fresh visual QA.",
      "qa_reviewed_at": null,
```

Keep the file's existing 2-space indent and trailing newline.

- [ ] **Step 3: Commit**

```bash
git add social/youtube-queue/queue.json
git commit -m "Reset short-040 QA status for Tier 3 character art re-render"
```

---

### Task 7: Re-render and re-QA `short-040`

This is the project's standing `/qa-shorts` flow, run against the one queue item with a `character` block.

- [ ] **Step 1: Render with voice**

```bash
cd remotion && REMOTION_BROWSER_EXECUTABLE=$(find /opt/pw-browsers -iname headless_shell | head -1) REMOTION_CHROME_MODE=headless-shell npx tsx src/render-queue.ts short-040
```
Expected: `Rendering short-040...` then `  -> .../remotion/out/short-040.mp4`. Confirm the file exists:
```bash
ls -la remotion/out/short-040.mp4
```

- [ ] **Step 2: Dispatch the QA review**

Use the `Agent` tool with `subagent_type: video-qa-approver`, passing the absolute path to `remotion/out/short-040.mp4` and short-040's `id`, `title`, `audience`, `hook`, `script`, `cta` (from `social/youtube-queue/queue.json`) so it can check content-match.

- [ ] **Step 3: Record the verdict in `queue.json`**

Update short-040's block (same fields touched in Task 6 Step 2):
- `qa_status`: `"approved"` or `"rejected"`, taken from the agent's VERDICT line
- `qa_notes`: the agent's Notes line (or the failing checks, if rejected)
- `qa_reviewed_at`: current ISO timestamp

Keep the file's existing 2-space indent and trailing newline.

- [ ] **Step 4: Commit**

```bash
git add social/youtube-queue/queue.json
git commit -m "QA: <approved/rejected> short-040 (Tier 3 character art)"
```

(Use the actual verdict in place of `<approved/rejected>`.) If rejected, the item stays `qa_status: rejected` until a follow-up fix and re-render — do not re-trigger the posting workflows until it reads `approved`.

- [ ] **Step 5: Push**

```bash
git push -u origin claude/sleepy-gauss-CyGUG
```
