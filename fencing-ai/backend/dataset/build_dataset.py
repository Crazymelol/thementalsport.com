"""
Dataset builder — turns raw YouTube fencing videos into a labelled training set.

Strategy: *knowledge distillation*.
  1. Download each video (yt-dlp) and extract frames (ffmpeg) at 2 fps.
  2. Run MediaPipe on every frame  -> a sequence of pose feature vectors.
  3. Ask Claude to label the actions  -> pseudo-labels (the "teacher").
  4. Save pose sequence + labels per video, and append to a manifest.

The resulting dataset trains a small, fast local model (see ../training/) that
imitates Claude without the API cost. Correct a slice of labels by hand later to
push the student past the teacher.

Usage:
    python -m dataset.build_dataset urls.txt
    python -m dataset.build_dataset "https://youtu.be/abc" "https://youtu.be/def"

`urls.txt` = one YouTube URL per line (blank lines and #comments ignored).
"""

import sys
import json
import asyncio
import uuid
from pathlib import Path

import numpy as np

# Run as a module from the backend/ dir so these imports resolve.
from services.video_processor import VideoProcessor
from services.pose_estimator import PoseEstimator, KEYPOINT_NAMES
from services.ai_analyzer import analyze_frames_batch

BATCH_SIZE = 6
MIN_CONFIDENCE = 0.4  # drop labels Claude is unsure about

DATA_DIR = Path("dataset/data")
DATA_DIR.mkdir(parents=True, exist_ok=True)
MANIFEST = DATA_DIR / "manifest.json"

# 132 features/frame: 33 keypoints x (x, y, z, visibility)
FEATURES_PER_FRAME = len(KEYPOINT_NAMES) * 4

video_processor = VideoProcessor()
pose_estimator = PoseEstimator()


def pose_to_vector(pose: dict | None) -> np.ndarray:
    """
    Return one frame's canonical NORMALISED feature vector (zeros if no pose).

    Uses the precomputed `vector` from PoseEstimator (33 landmarks x [x,y,z,vis],
    normalised 0-1). This MUST stay identical to what the browser produces in
    lib/model-inference.ts so the trained model sees the same features at
    training and live-inference time.
    """
    vec = np.zeros(FEATURES_PER_FRAME, dtype=np.float32)
    if not pose:
        return vec
    v = pose.get("vector")
    if v:
        vec[: len(v)] = np.asarray(v, dtype=np.float32)
    return vec


async def process_video(url: str) -> dict | None:
    vid_id = str(uuid.uuid4())[:8]
    print(f"[{vid_id}] downloading {url}")
    try:
        video_path = await video_processor.download_youtube(url, vid_id)
    except Exception as e:
        print(f"[{vid_id}] download failed: {e}")
        return None

    print(f"[{vid_id}] extracting frames")
    frames_dir = await video_processor.extract_frames(video_path, vid_id)
    frame_paths = sorted(Path(frames_dir).glob("*.jpg"))
    if not frame_paths:
        print(f"[{vid_id}] no frames")
        return None

    print(f"[{vid_id}] estimating poses on {len(frame_paths)} frames")
    poses = [pose_estimator.estimate(str(p)) for p in frame_paths]
    pose_matrix = np.stack([pose_to_vector(p) for p in poses])  # (N, 132)

    print(f"[{vid_id}] labelling with Claude")
    labels: list[dict] = []
    for start in range(0, len(frame_paths), BATCH_SIZE):
        batch = list(range(start, min(start + BATCH_SIZE, len(frame_paths))))
        paths = [str(frame_paths[i]) for i in batch]
        batch_poses = [poses[i] for i in batch]
        try:
            result = await analyze_frames_batch(paths, batch_poses, batch)
        except Exception as e:
            print(f"[{vid_id}] batch {start} failed: {e}")
            continue
        for a in result.get("actions", []):
            if a.get("confidence", 0) >= MIN_CONFIDENCE:
                labels.append(a)

    # Save pose sequence (compressed) + labels for this video.
    npz_path = DATA_DIR / f"{vid_id}.npz"
    np.savez_compressed(npz_path, poses=pose_matrix)
    label_path = DATA_DIR / f"{vid_id}.labels.json"
    label_path.write_text(json.dumps({"url": url, "labels": labels}, indent=2))

    print(f"[{vid_id}] saved {len(labels)} labels, {len(frame_paths)} frames")
    return {
        "id": vid_id,
        "url": url,
        "frames": len(frame_paths),
        "labels": len(labels),
        "poses_file": npz_path.name,
        "labels_file": label_path.name,
    }


def load_urls(args: list[str]) -> list[str]:
    if len(args) == 1 and Path(args[0]).exists():
        lines = Path(args[0]).read_text().splitlines()
        return [l.strip() for l in lines if l.strip() and not l.startswith("#")]
    return args


async def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(1)

    urls = load_urls(args)
    print(f"Building dataset from {len(urls)} video(s)\n")

    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else []
    seen = {m["url"] for m in manifest}

    for url in urls:
        if url in seen:
            print(f"skip (already in dataset): {url}")
            continue
        entry = await process_video(url)
        if entry:
            manifest.append(entry)
            MANIFEST.write_text(json.dumps(manifest, indent=2))  # checkpoint each video

    total_labels = sum(m["labels"] for m in manifest)
    print(f"\nDone. Dataset: {len(manifest)} videos, {total_labels} labels total.")
    print(f"Manifest: {MANIFEST}")


if __name__ == "__main__":
    asyncio.run(main())
