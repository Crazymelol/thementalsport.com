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
        # load_ip_adapter() reinstantiates each existing UNet attn processor
        # with no args to preserve non-cross-attention layers; that crashes
        # against SlicedAttnProcessor (requires slice_size), so slicing must
        # be off here and stays off afterward -- re-enabling it would itself
        # overwrite the IP-Adapter's own cross-attention processors.
        pipe.disable_attention_slicing()
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
