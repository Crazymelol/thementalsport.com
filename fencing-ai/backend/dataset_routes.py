"""
Dataset review/correction API.

Serves the distilled dataset (built by dataset/build_dataset.py) to the frontend
correction UI, and saves human-corrected labels back to disk. Correcting labels
is what lets the trained student model surpass its Claude teacher.
"""

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/dataset", tags=["dataset"])

DATA_DIR = Path("dataset/data")
MANIFEST = DATA_DIR / "manifest.json"


class Label(BaseModel):
    frame_range: list[int]
    action: str
    confidence: float = 1.0
    description: str = ""
    fencer: str = "unknown"


class SaveLabelsRequest(BaseModel):
    labels: list[Label]
    reviewed: bool = True


def _load_manifest() -> list[dict]:
    return json.loads(MANIFEST.read_text()) if MANIFEST.exists() else []


def _save_manifest(manifest: list[dict]):
    MANIFEST.write_text(json.dumps(manifest, indent=2))


@router.get("/videos")
async def list_videos():
    """All videos in the dataset, with label counts and review status."""
    manifest = _load_manifest()
    return [
        {
            "id": m["id"],
            "url": m["url"],
            "frames": m["frames"],
            "labels": m["labels"],
            "reviewed": m.get("reviewed", False),
        }
        for m in manifest
    ]


@router.get("/videos/{video_id}")
async def get_video(video_id: str):
    """A single video's labels plus the frame image URLs for scrubbing."""
    manifest = _load_manifest()
    entry = next((m for m in manifest if m["id"] == video_id), None)
    if not entry:
        raise HTTPException(404, "Video not found")

    label_file = DATA_DIR / entry["labels_file"]
    data = json.loads(label_file.read_text())

    # Frames are 1-indexed on disk (frame_0001.jpg); label indices are 0-based.
    frame_urls = [
        f"/frames/{video_id}/frame_{i + 1:04d}.jpg" for i in range(entry["frames"])
    ]

    return {
        "id": video_id,
        "url": entry["url"],
        "frames": entry["frames"],
        "reviewed": entry.get("reviewed", False),
        "labels": data.get("labels", []),
        "frame_urls": frame_urls,
    }


@router.put("/videos/{video_id}/labels")
async def save_labels(video_id: str, req: SaveLabelsRequest):
    """Overwrite a video's labels with human-corrected versions."""
    manifest = _load_manifest()
    entry = next((m for m in manifest if m["id"] == video_id), None)
    if not entry:
        raise HTTPException(404, "Video not found")

    label_file = DATA_DIR / entry["labels_file"]
    existing = json.loads(label_file.read_text())
    existing["labels"] = [l.model_dump() for l in req.labels]
    existing["reviewed"] = req.reviewed
    label_file.write_text(json.dumps(existing, indent=2))

    # Keep the manifest in sync so list/training see the new counts.
    entry["labels"] = len(req.labels)
    entry["reviewed"] = req.reviewed
    _save_manifest(manifest)

    return {"saved": True, "labels": len(req.labels), "reviewed": req.reviewed}
