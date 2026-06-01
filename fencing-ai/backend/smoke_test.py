"""
Smoke test — validates the full fencing-AI pipeline without real videos or API calls.

Checks (in order):
  1. Python package imports
  2. ffmpeg binary on PATH
  3. Synthetic video creation (OpenCV)
  4. Frame extraction (VideoProcessor + ffmpeg)
  5. Pose estimation (MediaPipe on synthetic frames — no real pose expected)
  6. Pose-vector serialisation (numpy shape)
  7. AI analyzer module loads (Claude client not called)
  8. Dataset routes logic (in-memory manifest read/write)
  9. Job store (create / update / get)
 10. Training dataset loader (empty-manifest error path)
 11. (Optional) Claude API ping — only if ANTHROPIC_API_KEY is set

Run from the backend/ directory:
    python smoke_test.py
"""

import sys
import os
import json
import asyncio
import tempfile
import shutil
from pathlib import Path

# ── helpers ──────────────────────────────────────────────────────────────────

PASS  = "\033[32m✓\033[0m"
FAIL  = "\033[31m✗\033[0m"
SKIP  = "\033[33m–\033[0m"
WIDTH = 52

results: list[tuple[str, str, str]] = []  # (status, name, detail)

def check(name: str, fn):
    """Run fn(); record pass/fail/skip. fn() may return a string detail or raise."""
    try:
        detail = fn() or ""
        results.append((PASS, name, str(detail)))
        print(f"  {PASS}  {name:<{WIDTH}} {detail}")
    except SkipTest as e:
        results.append((SKIP, name, str(e)))
        print(f"  {SKIP}  {name:<{WIDTH}} SKIP: {e}")
    except Exception as e:
        results.append((FAIL, name, str(e)))
        print(f"  {FAIL}  {name:<{WIDTH}} {e}")

class SkipTest(Exception):
    pass

# ── scratch space ─────────────────────────────────────────────────────────────

SCRATCH = Path(tempfile.mkdtemp(prefix="fencing_smoke_"))


# ═══════════════════════════════════════════════════════════════════════════════
# 1. Python imports
# ═══════════════════════════════════════════════════════════════════════════════

print("\n── 1. Python package imports ──────────────────────────────────────────")

def _import(pkg): __import__(pkg)

for pkg in [
    "fastapi", "uvicorn", "anthropic", "mediapipe",
    "cv2", "yt_dlp", "ffmpeg", "numpy", "PIL",
    "aiofiles", "dotenv",
]:
    check(f"import {pkg}", lambda p=pkg: _import(p))

# Torch is optional (only needed for training)
def _import_torch():
    try:
        import torch
        return f"v{torch.__version__}"
    except ImportError:
        raise SkipTest("torch not installed — needed for training only")

check("import torch (training only)", _import_torch)


# ═══════════════════════════════════════════════════════════════════════════════
# 2. ffmpeg binary
# ═══════════════════════════════════════════════════════════════════════════════

print("\n── 2. System tools ────────────────────────────────────────────────────")

def _ffmpeg_bin():
    import subprocess
    # Use the same resolver the pipeline uses — it skips present-but-broken binaries.
    from services.video_processor import _ffmpeg_exe
    exe = _ffmpeg_exe()
    r = subprocess.run([exe, "-version"], capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"resolved ffmpeg returned non-zero: {exe}")
    first_line = r.stdout.splitlines()[0]
    version = first_line.split("version")[1].strip().split()[0] if "version" in first_line else "ok"
    source = "system" if exe.startswith(("/usr", "/bin", "/opt")) and "imageio" not in exe else "bundled"
    return f"{version} ({source})"

check("working ffmpeg resolved", _ffmpeg_bin)


# ═══════════════════════════════════════════════════════════════════════════════
# 3. Synthetic video creation
# ═══════════════════════════════════════════════════════════════════════════════

print("\n── 3. Synthetic video ─────────────────────────────────────────────────")

VIDEO_PATH = str(SCRATCH / "test_video.mp4")

def _make_video():
    import cv2, numpy as np
    h, w, fps, n = 480, 640, 10, 20
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(VIDEO_PATH, fourcc, fps, (w, h))
    if not out.isOpened():
        raise RuntimeError("VideoWriter failed to open")
    for i in range(n):
        frame = np.zeros((h, w, 3), dtype=np.uint8)
        # draw a moving white rectangle to give ffmpeg something to encode
        x = int((i / n) * (w - 80))
        cv2.rectangle(frame, (x, 180), (x + 60, 300), (220, 220, 220), -1)
        out.write(frame)
    out.release()
    size_kb = Path(VIDEO_PATH).stat().st_size // 1024
    return f"{n} frames, {size_kb} KB"

check("create synthetic MP4 (OpenCV)", _make_video)


# ═══════════════════════════════════════════════════════════════════════════════
# 4. Frame extraction
# ═══════════════════════════════════════════════════════════════════════════════

print("\n── 4. Frame extraction ────────────────────────────────────────────────")

FRAMES_DIR = str(SCRATCH / "frames" / "smoke")
Path(FRAMES_DIR).mkdir(parents=True, exist_ok=True)

# Patch VideoProcessor to use our scratch dir
import services.video_processor as _vpm
_orig_frames = _vpm.FRAMES_DIR
_vpm.FRAMES_DIR = SCRATCH / "frames"

async def _extract_frames():
    from services.video_processor import VideoProcessor
    vp = VideoProcessor()
    out = await vp.extract_frames(VIDEO_PATH, "smoke")
    jpgs = sorted(Path(out).glob("*.jpg"))
    if not jpgs:
        raise RuntimeError("No frames produced")
    return f"{len(jpgs)} frames in {out}"

def _run_extraction():
    return asyncio.run(_extract_frames())

check("extract frames via ffmpeg", _run_extraction)

_vpm.FRAMES_DIR = _orig_frames  # restore


# ═══════════════════════════════════════════════════════════════════════════════
# 5. Pose estimation
# ═══════════════════════════════════════════════════════════════════════════════

print("\n── 5. Pose estimation ─────────────────────────────────────────────────")

FRAME_PATHS = sorted((SCRATCH / "frames" / "smoke").glob("*.jpg"))

def _pose_on_synthetic():
    from services.pose_estimator import PoseEstimator, KEYPOINT_NAMES
    pe = PoseEstimator()
    # Synthetic frames won't have a human — that's fine; we just want no crash.
    results_p = [pe.estimate(str(p)) for p in FRAME_PATHS[:4]]
    detected = sum(1 for r in results_p if r is not None)
    return f"processed {len(results_p)} frames, {detected} poses detected (0 expected on synthetic)"

check("MediaPipe pose estimation (no crash)", _pose_on_synthetic)


# ═══════════════════════════════════════════════════════════════════════════════
# 6. Pose → numpy vector
# ═══════════════════════════════════════════════════════════════════════════════

print("\n── 6. Pose → vector serialisation ─────────────────────────────────────")

def _pose_vector():
    import numpy as np
    import cv2
    from services.pose_estimator import PoseEstimator
    from dataset.build_dataset import pose_to_vector, FEATURES_PER_FRAME

    # Write a standalone dummy frame — independent of the extraction step.
    dummy_path = str(SCRATCH / "dummy_frame.jpg")
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.imwrite(dummy_path, frame)

    pe = PoseEstimator()
    pose = pe.estimate(dummy_path)  # None on a blank frame — that's fine
    vec = pose_to_vector(pose)
    assert vec.shape == (FEATURES_PER_FRAME,), f"expected ({FEATURES_PER_FRAME},) got {vec.shape}"
    assert vec.dtype == np.float32
    return f"shape=({FEATURES_PER_FRAME},) dtype=float32"

check("pose_to_vector → correct shape/dtype", _pose_vector)


# ═══════════════════════════════════════════════════════════════════════════════
# 7. AI analyzer loads
# ═══════════════════════════════════════════════════════════════════════════════

print("\n── 7. AI analyzer ─────────────────────────────────────────────────────")

def _ai_analyzer_loads():
    import services.ai_analyzer as m
    assert hasattr(m, "analyze_frames_batch")
    assert hasattr(m, "FENCING_SYSTEM_PROMPT")
    assert len(m.FENCING_SYSTEM_PROMPT) > 200, "prompt seems too short"
    return f"prompt={len(m.FENCING_SYSTEM_PROMPT)} chars"

check("ai_analyzer module loads + prompt present", _ai_analyzer_loads)

def _json_parser_fallback():
    from services.ai_analyzer import _parse_json_response
    good = _parse_json_response('{"actions":[],"technique_notes":[],"scoring_events":[],"overall_assessment":"ok"}')
    assert good["actions"] == []
    bad  = _parse_json_response("Sorry, I cannot analyze this.")
    assert "overall_assessment" in bad
    return "valid JSON + graceful fallback"

check("_parse_json_response: valid + fallback", _json_parser_fallback)


# ═══════════════════════════════════════════════════════════════════════════════
# 8. Dataset routes (in-memory logic, no HTTP)
# ═══════════════════════════════════════════════════════════════════════════════

print("\n── 8. Dataset routes ──────────────────────────────────────────────────")

# Build a fake dataset in scratch so routes can read it.
FAKE_DATA_DIR = SCRATCH / "dataset" / "data"
FAKE_DATA_DIR.mkdir(parents=True, exist_ok=True)
import numpy as np

FAKE_MANIFEST = [
    {
        "id": "aabbccdd",
        "url": "https://www.youtube.com/watch?v=fake",
        "frames": 10,
        "labels": 2,
        "poses_file": "aabbccdd.npz",
        "labels_file": "aabbccdd.labels.json",
        "reviewed": False,
    }
]
(FAKE_DATA_DIR / "manifest.json").write_text(json.dumps(FAKE_MANIFEST, indent=2))
(FAKE_DATA_DIR / "aabbccdd.labels.json").write_text(json.dumps({
    "url": "https://www.youtube.com/watch?v=fake",
    "labels": [
        {"frame_range": [0, 3], "action": "attack", "confidence": 0.9,
         "description": "test attack", "fencer": "left"},
    ]
}))
np.savez_compressed(FAKE_DATA_DIR / "aabbccdd.npz", poses=np.zeros((10, 132), dtype=np.float32))

import dataset_routes as dr_mod

def _dataset_list():
    import dataset_routes as dr
    orig = dr.DATA_DIR
    dr.DATA_DIR = FAKE_DATA_DIR
    dr.MANIFEST = FAKE_DATA_DIR / "manifest.json"
    manifest = dr._load_manifest()
    assert len(manifest) == 1
    assert manifest[0]["id"] == "aabbccdd"
    dr.DATA_DIR = orig
    dr.MANIFEST = orig / "manifest.json"
    return f"{len(manifest)} video(s) in fake manifest"

check("dataset_routes._load_manifest()", _dataset_list)

def _dataset_save():
    import dataset_routes as dr
    from dataset_routes import SaveLabelsRequest, Label
    orig_data, orig_mf = dr.DATA_DIR, dr.MANIFEST
    dr.DATA_DIR = FAKE_DATA_DIR
    dr.MANIFEST = FAKE_DATA_DIR / "manifest.json"

    new_labels = [Label(frame_range=[1, 4], action="parry", confidence=1.0,
                        description="corrected", fencer="right")]
    req = SaveLabelsRequest(labels=new_labels, reviewed=True)

    async def _run():
        return await dr.save_labels("aabbccdd", req)

    result = asyncio.run(_run())
    assert result["saved"] is True
    assert result["reviewed"] is True
    saved = json.loads((FAKE_DATA_DIR / "aabbccdd.labels.json").read_text())
    assert saved["labels"][0]["action"] == "parry"
    assert saved["reviewed"] is True

    dr.DATA_DIR = orig_data
    dr.MANIFEST = orig_mf
    return "labels corrected + manifest updated"

check("dataset_routes.save_labels() round-trip", _dataset_save)


# ═══════════════════════════════════════════════════════════════════════════════
# 9. Job store
# ═══════════════════════════════════════════════════════════════════════════════

print("\n── 9. Job store ───────────────────────────────────────────────────────")

def _job_store():
    from services.job_store import JobStore
    js = JobStore()
    js.create("j1", {"source": "upload", "filename": "test.mp4"})
    js.update("j1", {"status": "processing", "progress": 42})
    j = js.get("j1")
    assert j["status"] == "processing"
    assert j["progress"] == 42
    assert js.get("nonexistent") is None
    return "create / update / get / miss all correct"

check("JobStore CRUD", _job_store)


# ═══════════════════════════════════════════════════════════════════════════════
# 10. Training dataset loader (empty-manifest error path)
# ═══════════════════════════════════════════════════════════════════════════════

print("\n── 10. Training dataset loader ─────────────────────────────────────────")

def _loader_no_manifest():
    # Point the loader at a directory with no manifest → should raise FileNotFoundError.
    import training.dataset_loader as dl
    orig = dl.MANIFEST
    dl.MANIFEST = SCRATCH / "no_such_manifest.json"
    try:
        dl.FencingPoseDataset()
        raise AssertionError("Expected FileNotFoundError")
    except FileNotFoundError:
        return "FileNotFoundError raised correctly (no manifest)"
    finally:
        dl.MANIFEST = orig

check("FencingPoseDataset raises on missing manifest", _loader_no_manifest)

def _loader_with_fake_data():
    import training.dataset_loader as dl
    orig_mf, orig_data = dl.MANIFEST, dl.DATA_DIR
    dl.MANIFEST = FAKE_DATA_DIR / "manifest.json"
    dl.DATA_DIR  = FAKE_DATA_DIR
    # After our save_labels test the labels file has 1 corrected label.
    try:
        ds = dl.FencingPoseDataset(window=4, stride=1)
        return f"{len(ds)} windows, feature_dim={ds.feature_dim}"
    finally:
        dl.MANIFEST = orig_mf
        dl.DATA_DIR  = orig_data

check("FencingPoseDataset loads fake data → windows", _loader_with_fake_data)


# ═══════════════════════════════════════════════════════════════════════════════
# 11. Claude API ping (optional — only if key is present)
# ═══════════════════════════════════════════════════════════════════════════════

print("\n── 11. Claude API (optional) ───────────────────────────────────────────")

def _claude_ping():
    from dotenv import load_dotenv
    load_dotenv()
    key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not key or key.startswith("your_"):
        raise SkipTest("ANTHROPIC_API_KEY not set — set it in backend/.env to test")

    import anthropic
    client = anthropic.Anthropic(api_key=key)
    msg = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=10,
        messages=[{"role": "user", "content": "Reply: ok"}],
    )
    return f"response: '{msg.content[0].text.strip()}'"

check("Claude API: minimal ping (claude-haiku)", _claude_ping)


# ═══════════════════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════════════════

shutil.rmtree(SCRATCH, ignore_errors=True)

passed  = sum(1 for s, *_ in results if s == PASS)
failed  = sum(1 for s, *_ in results if s == FAIL)
skipped = sum(1 for s, *_ in results if s == SKIP)
total   = len(results)

print(f"""
══════════════════════════════════════════════════════════════
  Results: {passed} passed  {failed} failed  {skipped} skipped  ({total} total)
══════════════════════════════════════════════════════════════""")

if failed:
    print("\nFailed checks:")
    for s, name, detail in results:
        if s == FAIL:
            print(f"  • {name}: {detail}")
    print()

sys.exit(1 if failed else 0)
