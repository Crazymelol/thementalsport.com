#!/usr/bin/env python3
"""Generate per-segment narration for queued shorts in Giannis's cloned voice.

Uses Chatterbox (Resemble AI, MIT-licensed) for zero-shot voice cloning from
remotion/voice-reference/giannis.wav. Writes MP3 clips to
remotion/public/audio/<item-id>/{hook,caption-N,cta}.mp3 — the exact paths the
Remotion render (remotion/src/render-queue.ts -> voiceover.ts) reads back.

Clips that already exist are skipped, so this is safe to re-run: it only
generates what's missing, and the generated audio is committed once and reused
by every platform's render.

Usage:
    python scripts/voiceover/generate.py [item-id ...]
With no ids, generates for every queue item that is missing any segment.

Note: the torch / Chatterbox model download needs internet (HuggingFace), so
this runs in GitHub Actions (full network), not the egress-restricted dev
sandbox.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
QUEUE = ROOT / "social" / "youtube-queue" / "queue.json"
REF = ROOT / "remotion" / "voice-reference" / "giannis.wav"
PUBLIC_AUDIO = ROOT / "remotion" / "public" / "audio"


def split_into_captions(script: str, max_words: int = 9):
    """Mirror of splitIntoCaptions() in remotion/src/splitScript.ts so the
    audio segments line up 1:1 with the on-screen caption chunks."""
    sentences = [
        s for s in re.split(r"(?<=[.!?])\s+", re.sub(r"\s+", " ", script).strip()) if s
    ]
    chunks = []
    for sentence in sentences:
        words = sentence.split(" ")
        for i in range(0, len(words), max_words):
            chunks.append(" ".join(words[i : i + max_words]))
    return chunks


def segments_for(item):
    segs = [("hook", item["hook"])]
    for i, chunk in enumerate(split_into_captions(item["script"])):
        segs.append((f"caption-{i}", chunk))
    segs.append(("cta", item["cta"]))
    return segs


def main():
    ids = [a for a in sys.argv[1:] if a.strip()]
    queue = json.loads(QUEUE.read_text())
    items = queue["items"]
    if ids:
        items = [i for i in items if i["id"] in ids]

    pending = [
        item
        for item in items
        if any(
            not (PUBLIC_AUDIO / item["id"] / f"{name}.mp3").exists()
            for name, _ in segments_for(item)
        )
    ]
    if not pending:
        print("All requested queue items already have narration. Nothing to do.")
        return

    if not REF.exists():
        sys.exit(f"Voice reference not found: {REF}")

    # Lazy import so a dry `--help` / "nothing to do" run doesn't require torch.
    import torchaudio as ta
    from chatterbox.tts import ChatterboxTTS

    print("Loading Chatterbox model (CPU)...")
    model = ChatterboxTTS.from_pretrained(device="cpu")

    for item in pending:
        out_dir = PUBLIC_AUDIO / item["id"]
        out_dir.mkdir(parents=True, exist_ok=True)
        print(f"== {item['id']}: {item.get('title', '')}")
        for name, text in segments_for(item):
            mp3 = out_dir / f"{name}.mp3"
            if mp3.exists():
                continue
            print(f"   {name}: {text[:64]!r}")
            wav = model.generate(text, audio_prompt_path=str(REF))
            wav_path = out_dir / f"{name}.wav"
            ta.save(str(wav_path), wav, model.sr)
            # Transcode to mp3 (much smaller for git) and drop the wav.
            subprocess.run(
                ["ffmpeg", "-y", "-i", str(wav_path), "-codec:a", "libmp3lame",
                 "-q:a", "4", str(mp3)],
                check=True,
                capture_output=True,
            )
            wav_path.unlink()

    print("Done.")


if __name__ == "__main__":
    main()
