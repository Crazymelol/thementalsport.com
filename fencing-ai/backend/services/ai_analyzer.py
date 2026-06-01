import os
import base64
import asyncio
import json
from pathlib import Path
import anthropic

client = anthropic.AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))

FENCING_SYSTEM_PROMPT = """You are an expert fencing coach and analyst with deep knowledge of foil, épée, and sabre.
You analyze video frames from fencing bouts to detect actions, assess technique, and track scoring.

When given a sequence of frames with pose data, respond with a JSON object containing:
{
  "actions": [
    {
      "frame_range": [start, end],
      "action": "attack|parry|riposte|lunge|fleche|advance|retreat|en_garde|touch|halt",
      "confidence": 0.0-1.0,
      "description": "brief description",
      "fencer": "left|right|unknown"
    }
  ],
  "technique_notes": [
    {
      "observation": "specific technical observation",
      "severity": "excellent|good|needs_work|critical",
      "fencer": "left|right|both"
    }
  ],
  "scoring_events": [
    {
      "frame": int,
      "touch_by": "left|right",
      "target_area": "valid|invalid|unclear",
      "confidence": 0.0-1.0
    }
  ],
  "overall_assessment": "1-2 sentence summary"
}

FENCING RULES TO APPLY:
- Right-of-way (foil & sabre): the fencer who starts the attack first has priority.
  A touch by the defender only counts if they first parry, or if the attacker's
  attack misses/falls short (attack "no longer". In épée there is no right-of-way —
  both can score; double-touches count for both.
- Valid target: foil = torso only; sabre = everything above the waist; épée = whole body.
- A "touch" is the landing of a hit. "halt" is when action stops (referee call / light on).
- "en_garde" is the ready stance between actions.

LABELLING DISCIPLINE (important — these labels are used to train a model):
- Be consistent: use ONLY the action vocabulary listed above, lowercase.
- frame_range must be tight — the first and last frame the action is actually visible.
- One action per entry. If both fencers act simultaneously, emit one entry each.
- Set confidence honestly; use 0.3-0.5 when the camera angle is poor or the blade
  is not clearly visible. Low-confidence labels are filtered out during training.
- If you cannot tell which fencer acted, use "unknown" rather than guessing.

Be specific about fencing terminology. Focus on blade work, footwork, distance management, and timing."""


async def analyze_frames_batch(
    frame_paths: list[str],
    pose_data: list[dict | None],
    frame_indices: list[int],
) -> dict:
    messages = _build_messages(frame_paths, pose_data, frame_indices)

    response = await client.messages.create(
        model="claude-opus-4-8",
        max_tokens=2000,
        system=FENCING_SYSTEM_PROMPT,
        messages=messages,
    )

    text = response.content[0].text
    return _parse_json_response(text)


def _build_messages(
    frame_paths: list[str],
    pose_data: list[dict | None],
    frame_indices: list[int],
) -> list[dict]:
    content = []

    for i, (path, pose, idx) in enumerate(zip(frame_paths, pose_data, frame_indices)):
        img_b64 = _encode_image(path)
        if img_b64 is None:
            continue

        content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": "image/jpeg", "data": img_b64},
        })

        pose_summary = _summarize_pose(pose) if pose else "No pose detected"
        content.append({
            "type": "text",
            "text": f"Frame {idx}: {pose_summary}",
        })

    content.append({
        "type": "text",
        "text": "Analyze these fencing frames. Identify all actions, technique observations, and any scoring touches. Return valid JSON only.",
    })

    return [{"role": "user", "content": content}]


def _encode_image(path: str) -> str | None:
    try:
        with open(path, "rb") as f:
            return base64.standard_b64encode(f.read()).decode("utf-8")
    except Exception:
        return None


def _summarize_pose(pose: dict) -> str:
    if not pose:
        return "No pose"
    m = pose.get("metrics", {})
    parts = []
    if "right_knee_angle" in m:
        parts.append(f"R-knee={m['right_knee_angle']}°")
    if "sword_arm_angle" in m:
        parts.append(f"sword-arm={m['sword_arm_angle']}°")
    if "torso_lean_deg" in m:
        parts.append(f"torso-lean={m['torso_lean_deg']}°")
    if "stance_width_pct" in m:
        parts.append(f"stance={m['stance_width_pct']}%")
    return " | ".join(parts) if parts else "Pose detected"


def _parse_json_response(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {
            "actions": [],
            "technique_notes": [],
            "scoring_events": [],
            "overall_assessment": text[:500],
        }
