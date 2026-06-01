# Fencing AI Analyzer

AI-powered fencing video analysis: upload a video or paste a YouTube URL and get:
- **Action detection** — attacks, parries, ripostes, lunges, flèches, and more
- **Score tracking** — detected touches tallied per fencer
- **Technique feedback** — posture, blade work, footwork, arm extension
- **Performance stats** — pose metrics computed from every frame

## Architecture

```
fencing-ai/
├── frontend/    Next.js 15 + Tailwind  (port 3000)
└── backend/     Python FastAPI          (port 8000)
```

**Pipeline:**
1. Video ingested (upload or YouTube via yt-dlp)
2. ffmpeg extracts frames at 2 fps
3. MediaPipe estimates pose on every frame
4. Frames batched (6 at a time) → Claude vision API for action/technique/scoring analysis
5. Results aggregated and served to the frontend

## Setup

### Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies (requires Python 3.11+)
pip install -r requirements.txt

# Copy and fill in your API key
cp .env.example .env
# Edit .env and add: ANTHROPIC_API_KEY=sk-ant-...

# Run
uvicorn main:app --reload --port 8000
```

You also need **ffmpeg** installed on your system:
- macOS: `brew install ffmpeg`
- Ubuntu: `sudo apt install ffmpeg`
- Windows: download from https://ffmpeg.org/download.html

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |

### Frontend (`frontend/.env.local`)
| Variable | Default |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` |

## Training a custom model (knowledge distillation)

The live app uses Claude vision in a zero-shot way — accurate but slow and
metered. You can train a small, fast, **free** local model that imitates Claude,
using YouTube videos as your raw database. No manual labelling required to start.

```
YouTube videos  ──►  Claude labels them  ──►  train a student model
  (free data)        (the "teacher")          (fast, local, free)
```

### Step 1 — Collect video URLs
```bash
cd backend
cp dataset/urls.example.txt dataset/urls.txt
# Edit dataset/urls.txt — paste fencing-bout YouTube URLs (one per line).
```

### Step 2 — Build the dataset (Claude auto-labels every clip)
```bash
python -m dataset.build_dataset dataset/urls.txt
```
For each video this downloads it, extracts frames, runs MediaPipe pose
estimation, and asks Claude to label the actions. Results are saved to
`dataset/data/` (pose sequences as `.npz`, labels as `.json`) and tracked in
`dataset/data/manifest.json`. Re-running skips videos already processed, so you
can grow the dataset incrementally. *Costs Anthropic API credits per video.*

### Step 3 — Train the student model
```bash
python -m training.train_action_classifier --epochs 30
```
Trains a bidirectional LSTM on the pose sequences. Outputs `training/model.pt`
and `training/label_map.json`. The trained model classifies actions from pose
windows instantly and locally.

### Important honesty note
A student trained purely on Claude's labels **inherits Claude's mistakes** — it
imitates the teacher, it doesn't surpass it. To push past that ceiling, build a
small correction UI (or hand-edit the `.labels.json` files) to fix a slice of
labels, then retrain. Aim for **50+ videos** before expecting usable accuracy.

> **Legal note:** downloading YouTube videos may conflict with YouTube's Terms
> of Service, and competition footage is usually copyrighted. This is fine for
> private research/prototyping; get permission before any commercial use.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/analyze/upload` | Upload a video file |
| `POST` | `/api/analyze/youtube` | Submit a YouTube URL |
| `GET` | `/api/jobs/{id}` | Poll job status & results |
| `GET` | `/health` | Health check |
