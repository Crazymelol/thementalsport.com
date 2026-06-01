import os
import asyncio
from pathlib import Path
import yt_dlp
import ffmpeg


def _ffmpeg_exe() -> str:
    """Return the ffmpeg binary path. Prefer system ffmpeg; fall back to imageio_ffmpeg bundle."""
    import shutil
    sys_ffmpeg = shutil.which("ffmpeg")
    if sys_ffmpeg:
        return sys_ffmpeg
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        pass
    raise RuntimeError(
        "ffmpeg not found on PATH and imageio-ffmpeg is not installed.\n"
        "Install one of:\n"
        "  pip install imageio-ffmpeg   (easiest, no system package needed)\n"
        "  brew install ffmpeg / apt install ffmpeg"
    )


FRAMES_DIR = Path("frames")
DOWNLOADS_DIR = Path("downloads")
FRAMES_DIR.mkdir(exist_ok=True)
DOWNLOADS_DIR.mkdir(exist_ok=True)

# Extract 2 frames per second — enough for action detection without being too slow
FRAME_RATE = 2


class VideoProcessor:
    async def extract_frames(self, video_path: str, job_id: str) -> str:
        out_dir = FRAMES_DIR / job_id
        out_dir.mkdir(parents=True, exist_ok=True)

        await asyncio.to_thread(self._run_ffmpeg, video_path, str(out_dir))
        return str(out_dir)

    def _run_ffmpeg(self, video_path: str, out_dir: str):
        (
            ffmpeg
            .input(video_path)
            .filter("fps", fps=FRAME_RATE)
            .filter("scale", 640, -1)
            .output(
                os.path.join(out_dir, "frame_%04d.jpg"),
                qscale=2,
            )
            .overwrite_output()
            .run(
                cmd=_ffmpeg_exe(),
                capture_stdout=True,
                capture_stderr=True,
            )
        )

    async def download_youtube(self, url: str, job_id: str) -> str:
        out_path = str(DOWNLOADS_DIR / f"{job_id}.mp4")

        ydl_opts = {
            "format": "bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4][height<=720]/best",
            "outtmpl": out_path,
            "quiet": True,
            "no_warnings": True,
        }

        await asyncio.to_thread(self._download, url, ydl_opts)
        return out_path

    def _download(self, url: str, opts: dict):
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([url])
