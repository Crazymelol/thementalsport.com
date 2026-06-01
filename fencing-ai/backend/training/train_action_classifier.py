"""
Trains a pose-sequence action classifier on the distilled dataset.

A small bidirectional LSTM reads a window of MediaPipe pose vectors and predicts
the fencing action at the window centre. This is the "student" that imitates
Claude's labels — once trained it runs locally, instantly, for free.

Usage:
    python -m training.train_action_classifier
    python -m training.train_action_classifier --epochs 40 --batch 64

Output:
    training/model.pt          trained weights + config
    training/label_map.json    index -> action name
"""

import json
import argparse
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split

from training.dataset_loader import FencingPoseDataset, ACTIONS

OUT_DIR = Path("training")


class PoseLSTM(nn.Module):
    def __init__(self, feature_dim: int, hidden: int = 128, n_classes: int = len(ACTIONS)):
        super().__init__()
        self.lstm = nn.LSTM(
            feature_dim, hidden, num_layers=2,
            batch_first=True, bidirectional=True, dropout=0.3,
        )
        self.head = nn.Sequential(
            nn.Linear(hidden * 2, hidden),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden, n_classes),
        )

    def forward(self, x):                 # x: (B, T, F)
        out, _ = self.lstm(x)
        return self.head(out[:, -1, :])   # last timestep -> logits


def run_epoch(model, loader, criterion, optimizer, device, train: bool):
    model.train() if train else model.eval()
    total_loss, correct, n = 0.0, 0, 0
    torch.set_grad_enabled(train)
    for x, y in loader:
        x, y = x.to(device), y.to(device)
        logits = model(x)
        loss = criterion(logits, y)
        if train:
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
        total_loss += loss.item() * x.size(0)
        correct += (logits.argmax(1) == y).sum().item()
        n += x.size(0)
    return total_loss / n, correct / n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--epochs", type=int, default=30)
    ap.add_argument("--batch", type=int, default=64)
    ap.add_argument("--lr", type=float, default=1e-3)
    ap.add_argument("--val-split", type=float, default=0.2)
    args = ap.parse_args()

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {device}")

    dataset = FencingPoseDataset()
    print(f"Dataset: {len(dataset)} windows, feature_dim={dataset.feature_dim}")

    n_val = max(1, int(len(dataset) * args.val_split))
    n_train = len(dataset) - n_val
    train_ds, val_ds = random_split(
        dataset, [n_train, n_val], generator=torch.Generator().manual_seed(42)
    )
    train_loader = DataLoader(train_ds, batch_size=args.batch, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=args.batch)

    model = PoseLSTM(dataset.feature_dim).to(device)
    # Up-weight rare actions; most frames are "none".
    criterion = nn.CrossEntropyLoss(weight=dataset.class_weights().to(device))
    optimizer = torch.optim.Adam(model.parameters(), lr=args.lr)

    best_val = 0.0
    for epoch in range(1, args.epochs + 1):
        tr_loss, tr_acc = run_epoch(model, train_loader, criterion, optimizer, device, True)
        va_loss, va_acc = run_epoch(model, val_loader, criterion, optimizer, device, False)
        print(f"epoch {epoch:3d}  train_acc={tr_acc:.3f}  val_acc={va_acc:.3f}  val_loss={va_loss:.3f}")

        if va_acc >= best_val:
            best_val = va_acc
            torch.save(
                {
                    "state_dict": model.state_dict(),
                    "feature_dim": dataset.feature_dim,
                    "actions": ACTIONS,
                    "window": dataset.samples[0][0].shape[0],
                },
                OUT_DIR / "model.pt",
            )

    (OUT_DIR / "label_map.json").write_text(
        json.dumps({i: a for i, a in enumerate(ACTIONS)}, indent=2)
    )
    print(f"\nBest val accuracy: {best_val:.3f}")
    print(f"Saved -> {OUT_DIR / 'model.pt'}")


if __name__ == "__main__":
    main()
