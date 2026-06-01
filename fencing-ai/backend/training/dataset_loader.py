"""
Loads the distilled dataset (built by dataset/build_dataset.py) into windowed
samples for training. Each sample = a sliding window of pose feature vectors,
labelled with the action occurring at the window's centre frame.
"""

import json
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import Dataset

DATA_DIR = Path("dataset/data")
MANIFEST = DATA_DIR / "manifest.json"

# Fixed action vocabulary (must match the prompt in services/ai_analyzer.py).
# Index 0 = "none" (no labelled action at this frame).
ACTIONS = [
    "none", "attack", "parry", "riposte", "lunge", "fleche",
    "advance", "retreat", "en_garde", "touch", "halt",
]
ACTION_TO_IDX = {a: i for i, a in enumerate(ACTIONS)}

WINDOW = 8          # frames per sample (8 frames = 4s at 2 fps)
STRIDE = 2          # hop between windows


def _frame_labels(labels: list[dict], n_frames: int) -> np.ndarray:
    """Build a per-frame label array from Claude's frame_range annotations."""
    arr = np.zeros(n_frames, dtype=np.int64)  # default "none"
    for lab in labels:
        rng = lab.get("frame_range")
        action = lab.get("action")
        if not rng or action not in ACTION_TO_IDX:
            continue
        start, end = int(rng[0]), int(rng[1])
        start = max(0, start)
        end = min(n_frames - 1, end)
        for f in range(start, end + 1):
            arr[f] = ACTION_TO_IDX[action]
    return arr


class FencingPoseDataset(Dataset):
    def __init__(self, window: int = WINDOW, stride: int = STRIDE):
        self.samples: list[tuple[np.ndarray, int]] = []

        if not MANIFEST.exists():
            raise FileNotFoundError(
                f"{MANIFEST} not found. Build the dataset first:\n"
                f"  python -m dataset.build_dataset urls.txt"
            )

        manifest = json.loads(MANIFEST.read_text())
        for entry in manifest:
            poses = np.load(DATA_DIR / entry["poses_file"])["poses"]  # (N, 132)
            labels = json.loads((DATA_DIR / entry["labels_file"]).read_text())["labels"]
            frame_labels = _frame_labels(labels, len(poses))

            for start in range(0, len(poses) - window + 1, stride):
                win = poses[start:start + window]
                centre = start + window // 2
                self.samples.append((win, int(frame_labels[centre])))

        if not self.samples:
            raise ValueError("Dataset is empty — no windows produced.")

    @property
    def feature_dim(self) -> int:
        return self.samples[0][0].shape[1]

    def class_weights(self) -> torch.Tensor:
        """Inverse-frequency weights — most frames are 'none', so up-weight rare actions."""
        counts = np.bincount([y for _, y in self.samples], minlength=len(ACTIONS))
        weights = 1.0 / np.clip(counts, 1, None)
        weights = weights / weights.sum() * len(ACTIONS)
        return torch.tensor(weights, dtype=torch.float32)

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, i: int):
        win, label = self.samples[i]
        return torch.from_numpy(win).float(), torch.tensor(label, dtype=torch.long)
