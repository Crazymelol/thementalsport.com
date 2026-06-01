# Trained model goes here

The live judge (`/live`) automatically uses a trained AI model for action
detection **if** these two files are present:

- `sabre.onnx`  — the exported model
- `sabre.json`  — its config (window size, feature dim, action labels)

If they're absent, the live judge falls back to rule-based heuristics (the
header badge shows `HEURISTICS` vs `AI MODEL`).

## How to produce them

```bash
cd ../../backend

# 1. Build a dataset from FIE videos (Claude auto-labels)
python -m dataset.build_dataset dataset/urls.txt

# 2. (Recommended) correct labels in the browser at /dataset

# 3. Train the model
python -m training.train_action_classifier

# 4. Export to ONNX, written straight into this folder
python -m training.export_onnx
```

After step 4, reload `/live` — the badge flips to `AI MODEL` and the trained
model drives action detection (right-of-way and scoring stay as deterministic
rules on top of it).
