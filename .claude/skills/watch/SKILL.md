---
name: watch
description: Use when reviewing, summarizing, or critiquing an existing video file, when you need to understand video content you can't directly play, or when analyzing pacing/hook/structure by extracting frames and a transcript.
---

# Watch (Analyze a Video)

## Overview
To analyze a video you can't watch in real time, decompose it into things you can read: sampled frames (visuals) plus a transcript (audio). Combine the two on a shared timeline, then evaluate.

## Workflow
1. **Extract frames**: Sample with ffmpeg, e.g. `ffmpeg -i in.mp4 -vf fps=1 frames/%04d.jpg` (1 fps; raise for fast cuts, lower for long talks). For scene changes: `-vf "select='gt(scene,0.3)',showinfo"`.
2. **Get duration/metadata**: `ffprobe -v error -show_format -show_streams in.mp4` for length, fps, resolution, aspect.
3. **Transcribe audio**: Run whisper/STT to get timestamped text. Extract audio if needed: `ffmpeg -i in.mp4 -vn -ar 16000 audio.wav`.
4. **Align**: Map transcript timestamps to frame timestamps to reconstruct the timeline.
5. **Read the frames + transcript** and evaluate.

## What to evaluate
- **Hook (0-3s)**: Does the open grab attention? First frame loaded?
- **Retention**: Pattern interrupts, cut cadence, dead air.
- **Clarity**: One idea per beat? Captions present/synced?
- **Structure**: Hook -> payload -> CTA/loop.
- **Production**: Framing, audio levels, aspect ratio fit.

## Quick Reference
| Goal | Command |
|---|---|
| Frames at 1 fps | `ffmpeg -i in.mp4 -vf fps=1 f/%04d.jpg` |
| Scene-change frames | `-vf "select='gt(scene,0.3)'" -vsync vfr` |
| Metadata | `ffprobe -show_format -show_streams` |
| Extract audio | `ffmpeg -i in.mp4 -vn -ar 16000 a.wav` |
| Transcript | whisper / STT with timestamps |
| Single frame at t | `ffmpeg -ss 5 -i in.mp4 -frames:v 1 f.jpg` |

## Common Mistakes
- Too few frames; missing fast cuts and key visuals.
- Frames without transcript (or vice versa) — half the signal.
- Ignoring timestamps, so visuals and words aren't aligned.
- Critiquing content without checking the hook and first frame.
- Forgetting aspect ratio/platform fit in the review.

Keywords: watch video, analyze video, review video, critique, ffmpeg, extract frames, transcript, whisper, ffprobe, scene detection, summarize video
