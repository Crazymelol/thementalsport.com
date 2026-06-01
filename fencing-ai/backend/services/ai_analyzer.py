"""
Fencing frame analysis — supports three providers:

  ANALYZER_PROVIDER=anthropic   (default) — Claude via Anthropic SDK
  ANALYZER_PROVIDER=openrouter  — free/paid models via openrouter.ai
  ANALYZER_PROVIDER=nvidia       — free tier models via NVIDIA NIM

Environment variables:
  ANTHROPIC_API_KEY   required for provider=anthropic
  OPENROUTER_API_KEY  required for provider=openrouter
  NVIDIA_API_KEY      required for provider=nvidia
  ANALYZER_MODEL      overrides the default model for the chosen provider
"""

import os
import base64
import json

# ---------------------------------------------------------------------------
# Provider / model selection
# ---------------------------------------------------------------------------

PROVIDER = os.environ.get("ANALYZER_PROVIDER", "anthropic").lower()

_DEFAULT_MODELS = {
    "anthropic":  "claude-haiku-4-5-20251001",
    "openrouter": "qwen/qwen-2-vl-7b-instruct:free",
    "nvidia":     "meta/llama-3.2-11b-vision-instruct",
}

# Free vision models (NVIDIA NIM / many OpenRouter free tiers) accept only ONE
# image per request and cap the inline base64 size. Anthropic handles the full
# batch in a single call. So for the OpenAI-compatible providers we send one
# downscaled frame per request and merge the results.
_SINGLE_IMAGE_PROVIDERS = {"openrouter", "nvidia"}
_MAX_IMAGE_EDGE = 768   # px — downscale longest side to keep payload small
_JPEG_QUALITY = 70

# Single-image providers make ONE request per frame, so a long video would fire
# hundreds of requests and hit free-tier rate limits. Cap how many frames we
# actually send to the AI (evenly sampled across the video). Pose stats are
# still computed on every frame. 0 = no cap (Anthropic sends full batches).
MAX_AI_FRAMES = 0 if PROVIDER == "anthropic" else 48

ANALYZER_MODEL = os.environ.get("ANALYZER_MODEL", _DEFAULT_MODELS.get(PROVIDER, "claude-haiku-4-5-20251001"))

# ---------------------------------------------------------------------------
# Client initialisation (lazy — only the selected provider is imported)
# ---------------------------------------------------------------------------

_anthropic_client = None
_openai_client = None   # shared for openrouter + nvidia


def _get_client():
    global _anthropic_client, _openai_client

    if PROVIDER == "anthropic":
        if _anthropic_client is None:
            import anthropic
            _anthropic_client = anthropic.AsyncAnthropic(
                api_key=os.environ.get("ANTHROPIC_API_KEY", "")
            )
        return _anthropic_client

    if PROVIDER in ("openrouter", "nvidia"):
        if _openai_client is None:
            import openai
            if PROVIDER == "openrouter":
                _openai_client = openai.AsyncOpenAI(
                    base_url="https://openrouter.ai/api/v1",
                    api_key=os.environ.get("OPENROUTER_API_KEY", ""),
                    default_headers={
                        "HTTP-Referer": "https://github.com/crazymelol/thementalsport.com",
                        "X-Title": "Fencing AI Analyzer",
                    },
                )
            else:  # nvidia
                _openai_client = openai.AsyncOpenAI(
                    base_url="https://integrate.api.nvidia.com/v1",
                    api_key=os.environ.get("NVIDIA_API_KEY", ""),
                )
        return _openai_client

    raise ValueError(f"Unknown ANALYZER_PROVIDER: {PROVIDER!r}. Use anthropic | openrouter | nvidia")


# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

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
  attack misses/falls short (attack "no longer"). In épée there is no right-of-way —
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


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def analyze_frames_batch(
    frame_paths: list[str],
    pose_data: list[dict | None],
    frame_indices: list[int],
) -> dict:
    if PROVIDER == "anthropic":
        return await _analyze_anthropic(frame_paths, pose_data, frame_indices)
    return await _analyze_openai_compat(frame_paths, pose_data, frame_indices)


# ---------------------------------------------------------------------------
# Anthropic path
# ---------------------------------------------------------------------------

async def _analyze_anthropic(frame_paths, pose_data, frame_indices) -> dict:
    client = _get_client()
    messages = _build_anthropic_messages(frame_paths, pose_data, frame_indices)

    response = await client.messages.create(
        model=ANALYZER_MODEL,
        max_tokens=2000,
        system=FENCING_SYSTEM_PROMPT,
        messages=messages,
    )

    return _parse_json_response(response.content[0].text)


def _build_anthropic_messages(frame_paths, pose_data, frame_indices) -> list[dict]:
    content = []

    for path, pose, idx in zip(frame_paths, pose_data, frame_indices):
        img_b64 = _encode_image(path)
        if img_b64 is None:
            continue
        content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": "image/jpeg", "data": img_b64},
        })
        pose_summary = _summarize_pose(pose) if pose else "No pose detected"
        content.append({"type": "text", "text": f"Frame {idx}: {pose_summary}"})

    content.append({
        "type": "text",
        "text": "Analyze these fencing frames. Identify all actions, technique observations, and any scoring touches. Return valid JSON only.",
    })

    return [{"role": "user", "content": content}]


# ---------------------------------------------------------------------------
# OpenAI-compatible path (OpenRouter / NVIDIA NIM)
# ---------------------------------------------------------------------------

async def _analyze_openai_compat(frame_paths, pose_data, frame_indices) -> dict:
    """
    Free vision models take one image per request. Send each frame individually
    (downscaled) and merge the JSON results back into one batch result.
    """
    client = _get_client()

    merged = {"actions": [], "technique_notes": [], "scoring_events": [], "overall_assessment": ""}
    assessments = []

    for path, pose, idx in zip(frame_paths, pose_data, frame_indices):
        img_b64 = _encode_image_small(path)
        if img_b64 is None:
            continue

        pose_summary = _summarize_pose(pose) if pose else "No pose detected"
        messages = [
            {"role": "system", "content": FENCING_SYSTEM_PROMPT},
            {"role": "user", "content": [
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_b64}"}},
                {"type": "text", "text": (
                    f"This is frame {idx} of a fencing bout. Pose: {pose_summary}. "
                    "Identify the action, any technique observations, and any scoring touch "
                    f"in THIS frame. Use frame_range [{idx}, {idx}]. Return valid JSON only."
                )},
            ]},
        ]

        try:
            response = await client.chat.completions.create(
                model=ANALYZER_MODEL,
                max_tokens=1024,
                messages=messages,
            )
        except Exception as e:
            # One bad frame shouldn't kill the whole batch — skip and continue.
            print(f"[ai_analyzer] frame {idx} failed: {e}")
            continue

        result = _parse_json_response(response.choices[0].message.content)
        merged["actions"].extend(result.get("actions", []))
        merged["technique_notes"].extend(result.get("technique_notes", []))
        merged["scoring_events"].extend(result.get("scoring_events", []))
        if result.get("overall_assessment"):
            assessments.append(result["overall_assessment"])

    merged["overall_assessment"] = " ".join(assessments)[:500]
    return merged


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _encode_image(path: str) -> str | None:
    try:
        with open(path, "rb") as f:
            return base64.standard_b64encode(f.read()).decode("utf-8")
    except Exception:
        return None


def _encode_image_small(path: str) -> str | None:
    """Downscale + re-encode a frame so it fits free vision models' size limit."""
    try:
        from PIL import Image
        import io

        img = Image.open(path).convert("RGB")
        img.thumbnail((_MAX_IMAGE_EDGE, _MAX_IMAGE_EDGE))
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=_JPEG_QUALITY)
        return base64.standard_b64encode(buf.getvalue()).decode("utf-8")
    except Exception:
        # Fall back to the raw file if Pillow/resize fails.
        return _encode_image(path)


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
