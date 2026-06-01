import os
import asyncio
import functools
import subprocess
from pathlib import Path
import yt_dlp
import ffmpeg


def _works(exe: str | None) -> bool:
    """True only if the binary exists AND actually executes (catches present-but-broken installs)."""
    if not exe:
        return False
    try:
        r = subprocess.run(
            [exe, "-version"],
            capture_output=True,
            timeout=10,
        )
        return r.returncode == 0
    except (OSError, subprocess.SubprocessError):
        return False


@functools.lru_cache(maxsize=1)
def _ffmpeg_exe() -> str:
    """
    Resolve a *working* ffmpeg binary.

    Prefers a functional system ffmpeg, but test-runs it first — a system binary
    can exist yet fail to execute (e.g. a half-installed package missing a shared
    library). Falls back to the static binary bundled with imageio-ffmpeg, which
    has no external .so dependencies.
    """
    import shutil

    candidates = []
    sys_ffmpeg = shutil.which("ffmpeg")
    if sys_ffmpeg:
        candidates.append(sys_ffmpeg)
    try:
        import imageio_ffmpeg
        candidates.append(imageio_ffmpeg.get_ffmpeg_exe())
    except ImportError:
        pass

    for exe in candidates:
        if _works(exe):
            return exe

    raise RuntimeError(
        "No working ffmpeg found.\n"
        f"  Tried: {candidates or '(none)'}\n"
        "Install one of:\n"
        "  pip install imageio-ffmpeg   (easiest, self-contained, no system package)\n"
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
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                ydl.download([url])
        except yt_dlp.utils.DownloadError as e:
            raise RuntimeError(self._download_hint(url, str(e))) from e

    @staticmethod
    def _download_hint(url: str, err: str) -> str:
        """Turn cryptic yt-dlp errors into an actionable message."""
        low = err.lower()
        installed = getattr(yt_dlp.version, "__version__", "unknown")

        # Symptoms of a stale yt-dlp vs. YouTube's current player/signature code.
        stale_markers = (
            "failed to extract any player response",
            "unable to extract",
            "sign in to confirm",
            "player response",
            "nsig extraction",
        )
        if any(m in low for m in stale_markers):
            return (
                f"YouTube download failed — this usually means yt-dlp is out of date "
                f"(installed: {installed}). YouTube changes its site often and breaks "
                f"older versions.\n"
                f"  Fix:  pip install -U yt-dlp     (or, if installed standalone: yt-dlp -U)\n"
                f"  URL:  {url}\n"
                f"  Original error: {err.strip().splitlines()[-1] if err.strip() else err}"
            )
        if "video unavailable" in low or "private" in low or "removed" in low:
            return f"This video is unavailable/private/removed: {url}"
        if "certificate" in low or "ssl" in low or "self-signed" in low:
            return (
                f"TLS/certificate error downloading {url}. A network proxy is likely "
                f"intercepting HTTPS with a self-signed certificate (common in sandboxed / "
                f"corporate / CI environments).\n"
                f"  • Run somewhere with direct internet access, or\n"
                f"  • Point requests at the proxy's CA bundle, or\n"
                f"  • Loosen the environment's network policy to allow the video host.\n"
                f"  Original error: {err.strip().splitlines()[-1] if err.strip() else err}"
            )
        if "http error 403" in low or "forbidden" in low:
            return (
                f"Download blocked (HTTP 403) for {url}. The host or your network may be "
                f"blocking it — try a different network, or check the environment's network policy."
            )
        return f"yt-dlp failed for {url} (version {installed}): {err.strip()}"
