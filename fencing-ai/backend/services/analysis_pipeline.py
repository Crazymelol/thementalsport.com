import asyncio
from pathlib import Path
from typing import Any

from .pose_estimator import PoseEstimator
from .ai_analyzer import analyze_frames_batch, MAX_AI_FRAMES, PROVIDER

# Touch/right-of-way judgments need to see motion ACROSS frames. The single-image
# free providers analyze each frame in isolation, so their scoring is unreliable;
# only the multi-frame Anthropic path produces a trustworthy tally.
SCORE_RELIABLE = PROVIDER == "anthropic"

# How many frames to send to Claude per batch (stay under token limit)
BATCH_SIZE = 6

pose_estimator = PoseEstimator()


class AnalysisPipeline:
    async def analyze(self, frames_dir: str, job_id: str, job_store: Any) -> dict:
        frame_paths = sorted(Path(frames_dir).glob("*.jpg"))
        total = len(frame_paths)

        if total == 0:
            raise ValueError("No frames extracted from video")

        # Run pose estimation on all frames (CPU-bound, run in thread pool)
        job_store.update(job_id, {"progress": 25, "status": "estimating_poses"})
        pose_results = await asyncio.to_thread(
            self._run_pose_all, [str(p) for p in frame_paths]
        )

        # Send frames to Claude in batches
        job_store.update(job_id, {"progress": 40, "status": "ai_analysis"})
        all_actions = []
        all_technique_notes = []
        all_scoring_events = []
        overall_assessments = []

        # For single-image (free) providers, evenly sample down to MAX_AI_FRAMES
        # so we don't fire hundreds of requests and hit rate limits.
        ai_frames = list(enumerate(frame_paths))
        if MAX_AI_FRAMES and total > MAX_AI_FRAMES:
            stride = total / MAX_AI_FRAMES
            picked = sorted({int(k * stride) for k in range(MAX_AI_FRAMES)})
            ai_frames = [(i, frame_paths[i]) for i in picked]

        batches = list(_chunk(ai_frames, BATCH_SIZE))
        for batch_idx, batch in enumerate(batches):
            indices = [i for i, _ in batch]
            paths = [str(p) for _, p in batch]
            poses = [pose_results[i] for i in indices]

            batch_result = await analyze_frames_batch(paths, poses, indices)

            all_actions.extend(batch_result.get("actions", []))
            all_technique_notes.extend(batch_result.get("technique_notes", []))
            all_scoring_events.extend(batch_result.get("scoring_events", []))
            if batch_result.get("overall_assessment"):
                overall_assessments.append(batch_result["overall_assessment"])

            progress = 40 + int((batch_idx + 1) / len(batches) * 50)
            job_store.update(job_id, {"progress": progress})

        # Aggregate stats from pose data
        performance_stats = self._compute_stats(pose_results)

        # Tally score
        score = self._tally_score(all_scoring_events)

        return {
            "total_frames": total,
            "duration_seconds": round(total / 2, 1),  # 2 fps extraction
            "actions": all_actions,
            "technique_notes": all_technique_notes,
            "scoring_events": all_scoring_events,
            "score": score,
            "score_reliable": SCORE_RELIABLE,
            "performance_stats": performance_stats,
            "overall_assessment": " ".join(overall_assessments) or "Analysis complete.",
        }

    def _run_pose_all(self, paths: list[str]) -> list[dict | None]:
        return [pose_estimator.estimate(p) for p in paths]

    def _compute_stats(self, poses: list[dict | None]) -> dict:
        knee_angles = [
            p["metrics"]["right_knee_angle"]
            for p in poses
            if p and "right_knee_angle" in p.get("metrics", {})
        ]
        arm_angles = [
            p["metrics"]["sword_arm_angle"]
            for p in poses
            if p and "sword_arm_angle" in p.get("metrics", {})
        ]
        stance_widths = [
            p["metrics"]["stance_width_pct"]
            for p in poses
            if p and "stance_width_pct" in p.get("metrics", {})
        ]

        def safe_stats(values: list) -> dict:
            if not values:
                return {}
            return {
                "mean": round(sum(values) / len(values), 1),
                "min": round(min(values), 1),
                "max": round(max(values), 1),
            }

        return {
            "pose_detected_pct": round(
                sum(1 for p in poses if p) / max(len(poses), 1) * 100, 1
            ),
            "knee_angle": safe_stats(knee_angles),
            "sword_arm_angle": safe_stats(arm_angles),
            "stance_width_pct": safe_stats(stance_widths),
        }

    def _tally_score(self, scoring_events: list[dict]) -> dict:
        left = sum(
            1 for e in scoring_events
            if e.get("touch_by") == "left" and e.get("target_area") == "valid"
        )
        right = sum(
            1 for e in scoring_events
            if e.get("touch_by") == "right" and e.get("target_area") == "valid"
        )
        return {"left": left, "right": right}


def _chunk(lst: list, n: int):
    for i in range(0, len(lst), n):
        yield lst[i:i + n]
