# Voiceover Engine Upgrade — Sync Fix + Commercial-Safe Voice Sample

_Design spec — 2026-06-28_

## Summary

Narration today is a CPU **Chatterbox** zero-shot clone of
`remotion/voice-reference/giannis.wav`. Two complaints: the voice sounds
**generic**, and it is **not time-synced** to the on-screen captions. This spec
fixes the sync for free and engine-agnostically (it ships regardless of the
voice decision), then evaluates the best *commercially-licensed* free voice
(**Fish Speech 1.5**) via a single rendered sample short before deciding whether
to pay for ElevenLabs.

## Problem

- **Generic voice.** Chatterbox on CPU produces flat, non-distinctive narration
  that doesn't capture the reference voice well.
- **No word-timing → drift.** `scripts/voiceover/generate.py` writes only the
  segment mp3s. `remotion/src/voiceover.ts` and `types.ts` already expect an
  optional `<segment>.json` alignment sidecar (`{ words: WordTiming[] }`), but it
  is never produced — so on-screen word highlighting falls back to a heuristic
  that drifts from the actual speech.
- **Baked-in dead air.** Chatterbox bakes multi-second silences into some clips
  (e.g. short-012 held one caption ~14s with ~4.3s of dead air), which forced
  its QA rejection.

## Goals

- Word-accurate caption highlighting — produce the alignment sidecar the code
  already consumes.
- Remove baked-in internal dead air.
- Evaluate a clearly-better, **commercially-usable** free voice before spending
  money.
- Keep the existing pipeline interface (audio output paths, silent-render
  fallback) unchanged.

## Non-goals

- Re-rendering / re-posting already-published items (decided later, separately).
- Changing captions, character art, or the queue schema.
- Committing to a paid engine before hearing the free sample.

## Key constraints

- **Commercial licensing.** The channels are monetized, so the voice model must
  permit commercial use. This rules out **F5-TTS** (CC-BY-NC), **XTTS v2**
  (CPML, non-commercial without a separate agreement), and **ElevenLabs' free
  tier** (non-commercial + attribution). Commercially-safe options are:
  **Chatterbox** (MIT, current), **Fish Speech 1.5** (Apache-2.0 — the free
  upgrade candidate), or **ElevenLabs Starter** (~$5–6/mo, paid).
- **Egress-restricted sandbox.** TTS + alignment model weights download from
  HuggingFace, so generation runs in **GitHub Actions** (as the current
  Voiceover Generator already does), not the dev sandbox. Remotion rendering
  *does* run in-sandbox.

## Design

### 1. Sync fix — engine-agnostic, ships regardless of the voice decision

Add a post-generation step in `generate.py`, applied to every segment:

- **Silence-trim.** An `ffmpeg silenceremove` pass strips internal dead air
  beyond a small threshold (keeps short natural sentence-boundary pauses; removes
  the multi-second gaps that broke short-012).
- **Forced alignment.** Run **aeneas** (CPU-only) to align the *known* caption
  text to the trimmed audio and emit `<id>/<segment>.json` =
  `{ "words": [{ "word", "start", "end" }, ...] }`, matching the existing
  `WordTiming` type (seconds from clip start). Forced alignment is used rather
  than ASR (WhisperX) because the transcript is already known, which is more
  reliable. aeneas deps: `espeak` + `ffmpeg` + Python; commercial-safe.

### 2. Voice engine — pluggable, Fish Speech 1.5 as the free candidate

- Add a `VOICEOVER_ENGINE` selector (`chatterbox` | `fishspeech` | `elevenlabs`)
  in `generate.py`, **defaulting to `chatterbox`** so existing behavior and
  already-committed audio are untouched.
- Implement the `fishspeech` path: clone from the same `giannis.wav`, write the
  same per-segment outputs. Apache-2.0, commercial-safe.
- The `elevenlabs` path is specified here but **only built if the sample fails**
  (kept out of scope until then).

### 3. Sample-and-decide pipeline (CI)

- A new `workflow_dispatch` workflow, `voice-sample.yml` (reusing `generate.py`),
  kept separate from the production `voiceover-generator.yml` so it can also
  render and upload the mp4 without disturbing the live workflow: for one chosen
  item, generate Fish Speech audio + silence-trim + alignment, render the Short
  via Remotion, and upload the mp4 as a workflow **artifact**.
- The artifact is downloaded via the GitHub API and delivered to the user for
  evaluation.

### 4. Interfaces (unchanged)

- Output paths: `remotion/public/audio/<id>/{hook,caption-N,cta}.mp3` plus the
  new `.json` sidecars alongside each.
- Sidecar schema: `{ "words": WordTiming[] }`, where
  `WordTiming = { word: string; start: number; end: number }` (seconds).
- `loadAudio()` already reads both; the silent-layout fallback when audio is
  absent is preserved.

## Decision / branch point

The user watches the sample short:

- **Non-generic enough → roll out Fish Speech** to all items at $0 (regenerate
  audio, re-render, re-QA; short-012 expected to pass once the dead air is gone).
- **Still too generic → ElevenLabs Starter (~$5–6/mo):** build the `elevenlabs`
  engine path and add `ELEVENLABS_API_KEY` + `voice_id` as GitHub secrets.

The **sync outcome is delivered either way** — only the mechanism differs. For
the free engines it comes from aeneas + the silence-trim pass; for ElevenLabs it
comes from its native per-word timestamps (which also avoid baked-in dead air),
so the aeneas step is simply not needed on that path.

## Rollout (post-decision, separate plan)

Regenerate audio for all items in the chosen engine, re-render, re-run
`/qa-shorts`, and let the existing posters pick up the new audio on their next
run. Already-posted items only change if re-posted (decided then).

## Testing / validation

- The sample short is manually evaluated by the user — this is the gate.
- Re-run `/qa-shorts` on short-012 after regeneration to confirm the dead-air
  defect clears.
- Spot-check a sidecar `.json` against its audio (word boundaries land on words).
- Confirm `loadAudio()` picks up `words` and the render shows synced highlight.

## Risks & mitigations

- **Fish Speech CPU quality/speed in CI.** Model quality is device-independent
  (CPU is only slower); short clips keep runs bounded. If unusable, fall back to
  ElevenLabs.
- **aeneas accuracy on synthetic speech.** Validate on the sample; tune
  threshold; WhisperX is a backup aligner.
- **CI iteration.** TTS can't run in-sandbox, so the first clean sample may take
  a couple of dispatched runs. Acceptable for a one-off evaluation.

## Open questions

- None blocking. Sample item defaults to a representative ~40s athletes script
  (e.g. short-016); the user may override.
