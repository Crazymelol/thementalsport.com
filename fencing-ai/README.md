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

## Deployment (Vercel + Railway)

GitHub Actions auto-deploy the frontend to Vercel and the backend to Railway
on every push to `main`. Run the setup script **once** on your local machine to
link accounts, then pushes handle everything automatically.

### One-time setup (run locally, ~5 minutes)

**Prerequisites:** Node.js, [GitHub CLI](https://cli.github.com), `jq`

```bash
# Clone the repo locally first if you haven't
git clone https://github.com/crazymelol/thementalsport.com
cd thementalsport.com/fencing-ai

chmod +x setup_deploy.sh
./setup_deploy.sh
```

The script will:
1. Install Vercel CLI and link the frontend project (opens browser to log in)
2. Ask for your Vercel token → [vercel.com/account/tokens](https://vercel.com/account/tokens)
3. Ask for your Railway token → [railway.app/account/tokens](https://railway.app/account/tokens)
4. Ask for your Railway service ID (from your Railway project settings)
5. Set all secrets in GitHub automatically
6. Set `NEXT_PUBLIC_API_URL` in Vercel pointing at your Railway backend

After that, push to `main` → both services deploy automatically via GitHub Actions.

### Railway first-time project creation

Before running the setup script, create the Railway project:
1. [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
2. Select this repo, set root directory → **`fencing-ai/backend`**
3. Railway detects the `Dockerfile` and builds it
4. In **Variables** add: `ANTHROPIC_API_KEY = sk-ant-...`
5. Copy the **Service ID** from the service's Settings page (needed by the setup script)

> **RAM:** choose a plan with **≥1 GB RAM** — mediapipe needs it ($5/month Hobby tier).

### What auto-deploys on push

| File changed | Action triggered |
|---|---|
| `fencing-ai/frontend/**` | Frontend deploys to Vercel |
| `fencing-ai/backend/**`  | Backend deploys to Railway |

> **Note on storage:** Railway containers have an ephemeral filesystem — uploaded
> videos and frames are available during the session but lost on restart.
> For persistent storage, add a Railway Volume or use S3.

## Quick test — analyse one video from the command line

The fastest way to verify everything works on real footage, without starting the
web server or frontend:

```bash
cd backend
cp .env.example .env          # add ANTHROPIC_API_KEY=sk-ant-...
pip install -r requirements.txt

python run_analysis.py "https://www.youtube.com/watch?v=<a-real-FIE-bout>"
# or a local file:
python run_analysis.py /path/to/bout.mp4
```

It downloads/reads the video, extracts frames, runs pose estimation + Claude
analysis, and prints a full report (score, actions, technique notes, stats).
A `preflight` step checks your API key and ffmpeg up front and fails with a clear
message if either is missing.

> **Note on networks:** this needs outbound access to the video host (YouTube).
> Some sandboxed/CI environments block that — run it where YouTube is reachable
> (e.g. your own machine). The Claude API call only needs `api.anthropic.com`.

> **Note on your API key:** keep it in `backend/.env` (which is git-ignored).
> Don't paste it into chats, commits, or screenshots.

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
**Best source: the official FIE channel** — https://www.youtube.com/@FIEvideo —
thousands of full bouts, all shot from the standard side-on piste camera, which
is exactly the consistent angle pose estimation needs. Open the bout videos you
want and paste their URLs into `dataset/urls.txt`.

### Step 2 — Build the dataset (Claude auto-labels every clip)
```bash
python -m dataset.build_dataset dataset/urls.txt
```
For each video this downloads it, extracts frames, runs MediaPipe pose
estimation, and asks Claude to label the actions. Results are saved to
`dataset/data/` (pose sequences as `.npz`, labels as `.json`) and tracked in
`dataset/data/manifest.json`. Re-running skips videos already processed, so you
can grow the dataset incrementally. *Costs Anthropic API credits per video.*

### Step 3 — Correct the labels (this is what beats the teacher)
Claude's labels have errors. Fix a slice of them in the browser:
1. Start the backend (`uvicorn main:app --reload`) and frontend (`npm run dev`).
2. Go to **http://localhost:3000/dataset** — every video shows its review status.
3. Open a video to scrub frame-by-frame, fix/add/delete labels (action, frame
   range, which fencer), and **Save & mark reviewed**.

Corrected labels overwrite the auto-generated `.labels.json` files, so the next
training run learns from human-verified data.

### Step 4 — Train the student model
```bash
python -m training.train_action_classifier --epochs 30
```
Trains a bidirectional LSTM on the pose sequences. Outputs `training/model.pt`
and `training/label_map.json`. The trained model classifies actions from pose
windows instantly and locally.

### Important honesty note
A student trained purely on Claude's labels **inherits Claude's mistakes** — it
imitates the teacher, it doesn't surpass it. The correction UI (Step 3) is how
you break that ceiling: human-verified labels let the model exceed Claude.
Aim for **50+ videos** before expecting usable accuracy.

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
