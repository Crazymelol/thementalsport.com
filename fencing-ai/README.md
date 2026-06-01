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

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/analyze/upload` | Upload a video file |
| `POST` | `/api/analyze/youtube` | Submit a YouTube URL |
| `GET` | `/api/jobs/{id}` | Poll job status & results |
| `GET` | `/health` | Health check |
