import os
import uuid
import asyncio
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import aiofiles

from services.video_processor import VideoProcessor
from services.analysis_pipeline import AnalysisPipeline
from services.job_store import JobStore

app = FastAPI(title="Fencing AI Analyzer", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

job_store = JobStore()
video_processor = VideoProcessor()
pipeline = AnalysisPipeline()


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
    video_path = UPLOAD_DIR / f"{job_id}_{file.filename}"

    async with aiofiles.open(video_path, "wb") as f:
        content = await file.read()
        await f.write(content)

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
