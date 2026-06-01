"""
Export the trained PyTorch action classifier to ONNX so it can run in the
browser (offline) via onnxruntime-web.

Usage:
    python -m training.export_onnx
    python -m training.export_onnx --out ../frontend/public/models/sabre.onnx

After export, the browser loads the .onnx file and runs the exact same model
that was trained — no Python, no server, fully offline.
"""

import json
import argparse
from pathlib import Path

import torch

from training.train_action_classifier import PoseLSTM
from training.dataset_loader import ACTIONS

DEFAULT_MODEL = Path("training/model.pt")
DEFAULT_OUT = Path("../frontend/public/models/sabre.onnx")


def export(model_path: Path, out_path: Path):
    if not model_path.exists():
        raise FileNotFoundError(
            f"{model_path} not found. Train a model first:\n"
            f"  python -m training.train_action_classifier"
        )

    ckpt = torch.load(model_path, map_location="cpu")
    feature_dim = ckpt["feature_dim"]
    window = ckpt["window"]
    actions = ckpt.get("actions", ACTIONS)

    model = PoseLSTM(feature_dim, n_classes=len(actions))
    model.load_state_dict(ckpt["state_dict"])
    model.eval()

    # Dummy input: (batch=1, window, feature_dim)
    dummy = torch.zeros(1, window, feature_dim, dtype=torch.float32)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    torch.onnx.export(
        model,
        dummy,
        str(out_path),
        input_names=["pose_window"],
        output_names=["action_logits"],
        dynamic_axes={"pose_window": {0: "batch"}, "action_logits": {0: "batch"}},
        opset_version=17,
    )

    # Write a sidecar config the browser reads (window size, feature dim, labels)
    config = {
        "window": window,
        "feature_dim": feature_dim,
        "actions": actions,
    }
    config_path = out_path.with_suffix(".json")
    config_path.write_text(json.dumps(config, indent=2))

    # Validate the exported graph if onnx is available
    try:
        import onnx
        onnx.checker.check_model(onnx.load(str(out_path)))
        validated = " (graph validated)"
    except ImportError:
        validated = " (install `onnx` to validate the graph)"

    size_kb = out_path.stat().st_size // 1024
    print(f"✓ Exported {out_path} [{size_kb} KB]{validated}")
    print(f"✓ Wrote config {config_path}")
    print(f"  window={window}  feature_dim={feature_dim}  classes={len(actions)}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = ap.parse_args()
    export(args.model, args.out)


if __name__ == "__main__":
    main()
