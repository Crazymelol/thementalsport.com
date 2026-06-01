import os
import uuid
import asyncio
from pathlib import Path

# Load .env before importing anything that reads environment variables at import time
# (e.g. services.ai_analyzer reads ANALYZER_PROVIDER / API keys on import).
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import aiofiles

from services.video_processor import VideoProcessor
from services.analysis_pipeline import AnalysisPipeline
from services.job_store import JobStore
from dataset_routes import router as dataset_router

app = FastAPI(title="Fencing AI Analyzer", version="1.0.0")

# CORS_ORIGINS: comma-separated exact origins (e.g. "http://localhost:3000,https://myapp.com")
# CORS_ORIGIN_REGEX: regex for wildcard patterns (default covers all *.vercel.app deployments)
_cors_origins = [
    o.strip()
    for o in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")
    if o.strip()
]
_cors_regex = os.environ.get("CORS_ORIGIN_REGEX", r"https://.*\.vercel\.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=_cors_regex,
    # The API is stateless (keys live server-side, no cookies/sessions), so we
    # don't need credentialed CORS. Keeping this False avoids granting any
    # *.vercel.app origin credentialed access via the wildcard regex.
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
FRAMES_DIR = Path("frames")
FRAMES_DIR.mkdir(exist_ok=True)

job_store = JobStore()
video_processor = VideoProcessor()
pipeline = AnalysisPipeline()

# Dataset correction UI: routes + static serving of extracted frames.
app.include_router(dataset_router)
app.mount("/frames", StaticFiles(directory="frames"), name="frames")


class YouTubeRequest(BaseModel):
    url: str


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/analyze/upload")
async def analyze_upload(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    if not file.content_type or not file.content_type.startswith("video/"):
        raise HTTPException(400, "File must be a video")

    job_id = str(uuid.uuid4())
    # Strip any directory components from the client-supplied filename so a
    # crafted name like "../../etc/x" can't escape UPLOAD_DIR (path traversal).
    safe_name = Path(file.filename or "video").name
    video_path = UPLOAD_DIR / f"{job_id}_{safe_name}"

    # Stream to disk in chunks instead of file.read() — a multi-GB / multi-hour
    # video read whole into memory at once would OOM the backend.
    async with aiofiles.open(video_path, "wb") as f:
        while chunk := await file.read(1 << 20):  # 1 MiB at a time
            await f.write(chunk)

    job_store.create(job_id, {"filename": file.filename, "source": "upload"})
    background_tasks.add_task(run_pipeline, job_id, str(video_path))

    return {"job_id": job_id}


@app.post("/api/analyze/youtube")
async def analyze_youtube(req: YouTubeRequest, background_tasks: BackgroundTasks):
    if "youtube.com" not in req.url and "youtu.be" not in req.url:
        raise HTTPException(400, "Must be a YouTube URL")

    job_id = str(uuid.uuid4())
    job_store.create(job_id, {"url": req.url, "source": "youtube"})
    background_tasks.add_task(run_youtube_pipeline, job_id, req.url)

    return {"job_id": job_id}


@app.get("/api/jobs/{job_id}")
async def get_job(job_id: str):
    job = job_store.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job


async def run_pipeline(job_id: str, video_path: str):
    try:
        job_store.update(job_id, {"status": "processing", "progress": 5})
        frames_dir = await video_processor.extract_frames(video_path, job_id)
        job_store.update(job_id, {"progress": 20})

        result = await pipeline.analyze(frames_dir, job_id, job_store)

        job_store.update(job_id, {
            "status": "complete",
            "progress": 100,
            "result": result,
        })
    except Exception as e:
        job_store.update(job_id, {"status": "error", "error": str(e)})


async def run_youtube_pipeline(job_id: str, url: str):
    try:
        job_store.update(job_id, {"status": "downloading", "progress": 5})
        video_path = await video_processor.download_youtube(url, job_id)
        job_store.update(job_id, {"progress": 15})
        await run_pipeline(job_id, video_path)
    except Exception as e:
        job_store.update(job_id, {"status": "error", "error": str(e)})
