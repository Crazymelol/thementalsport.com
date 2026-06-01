"""
Run the full fencing-analysis pipeline on a single video — no web server needed.

This is the quickest way to do a REAL end-to-end test: it downloads (or reads)
a video, extracts frames, runs MediaPipe pose estimation, sends frames to Claude,
and prints a formatted report. Use it to verify the system works on real footage.

Requires:
  - ANTHROPIC_API_KEY in the environment or backend/.env
  - ffmpeg (system, or `pip install imageio-ffmpeg`)
  - network access to the video source (YouTube, etc.)

Usage:
    python run_analysis.py "https://www.youtube.com/watch?v=..."
    python run_analysis.py /path/to/local_bout.mp4
    python run_analysis.py "<url>" --max-seconds 30      # only analyse first 30s
"""

import os
import sys
import asyncio
import argparse
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# ── colours ───────────────────────────────────────────────────────────────────
B = "\033[1m"; DIM = "\033[2m"; G = "\033[32m"; Y = "\033[33m"; R = "\033[31m"; C = "\033[36m"; X = "\033[0m"


def preflight() -> str | None:
    """Return an error string if something required is missing, else None."""
    key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not key or key.startswith("your_"):
        return ("ANTHROPIC_API_KEY is not set. Add it to backend/.env:\n"
                "    ANTHROPIC_API_KEY=sk-ant-...")
    try:
        from services.video_processor import _ffmpeg_exe
        _ffmpeg_exe()
    except Exception as e:
        return f"ffmpeg not available: {e}"
    return None


async def run(source: str, max_seconds: int | None):
    from services.video_processor import VideoProcessor
    from services.analysis_pipeline import AnalysisPipeline
    from services.job_store import JobStore

    vp = VideoProcessor()
    pipeline = AnalysisPipeline()
    store = JobStore()
    job_id = "cli"
    store.create(job_id, {"source": "cli"})

    is_url = source.startswith("http")
    if is_url:
        print(f"{C}↓ Downloading{X} {source}")
        video_path = await vp.download_youtube(source, job_id)
    else:
        if not Path(source).exists():
            print(f"{R}File not found: {source}{X}")
            sys.exit(1)
        video_path = source
    print(f"{G}✓{X} video ready: {video_path}")

    print(f"{C}⧉ Extracting frames (2 fps){X}")
    frames_dir = await vp.extract_frames(video_path, job_id)
    frame_count = len(list(Path(frames_dir).glob('*.jpg')))
    print(f"{G}✓{X} {frame_count} frames")

    print(f"{C}⚙ Running pose estimation + Claude analysis{X} {DIM}(this can take a few minutes){X}")
    result = await pipeline.analyze(frames_dir, job_id, store)

    print_report(result)


def print_report(r: dict):
    score = r["score"]
    print(f"\n{B}═══════════════ FENCING ANALYSIS ═══════════════{X}")
    print(f"{DIM}{r['total_frames']} frames · {r['duration_seconds']}s{X}\n")

    print(f"{B}SCORE{X}   {C}Left {score['left']}{X}  —  {R}Right {score['right']}{X}\n")

    print(f"{B}SUMMARY{X}\n  {r['overall_assessment']}\n")

    print(f"{B}ACTIONS{X} ({len(r['actions'])})")
    for a in r["actions"][:25]:
        t0, t1 = a["frame_range"][0] / 2, a["frame_range"][1] / 2
        print(f"  {DIM}{t0:5.1f}-{t1:>4.1f}s{X}  {a['action']:<10} {DIM}{a.get('fencer','?'):<7}{X} {a.get('description','')[:50]}")
    if len(r["actions"]) > 25:
        print(f"  {DIM}... +{len(r['actions']) - 25} more{X}")

    print(f"\n{B}TECHNIQUE NOTES{X} ({len(r['technique_notes'])})")
    for n in r["technique_notes"][:15]:
        sev = n["severity"]
        col = {"excellent": G, "good": C, "needs_work": Y, "critical": R}.get(sev, X)
        print(f"  {col}[{sev}]{X} {n['observation'][:80]}")

    stats = r["performance_stats"]
    print(f"\n{B}PERFORMANCE{X}")
    print(f"  pose detected: {stats['pose_detected_pct']}% of frames")
    if stats.get("knee_angle", {}).get("mean"):
        print(f"  knee angle:    avg {stats['knee_angle']['mean']}°  (min {stats['knee_angle']['min']}°)")
    if stats.get("sword_arm_angle", {}).get("mean"):
        print(f"  sword arm:     avg {stats['sword_arm_angle']['mean']}°")
    print(f"\n{G}✓ Done.{X}")


def main():
    ap = argparse.ArgumentParser(description="Run fencing analysis on one video.")
    ap.add_argument("source", help="YouTube URL or local video file path")
    ap.add_argument("--max-seconds", type=int, default=None, help="(reserved) limit analysis length")
    args = ap.parse_args()

    err = preflight()
    if err:
        print(f"{R}✗ Preflight failed:{X}\n  {err}")
        sys.exit(1)

    try:
        asyncio.run(run(args.source, args.max_seconds))
    except KeyboardInterrupt:
        print(f"\n{Y}Interrupted.{X}")
        sys.exit(130)


if __name__ == "__main__":
    main()
