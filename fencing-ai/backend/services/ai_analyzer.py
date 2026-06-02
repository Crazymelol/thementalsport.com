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

import asyncio
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
    "ollama":     "llama3.2-vision",
}

# Free vision models (NVIDIA NIM / many OpenRouter free tiers) accept only ONE
# image per request and cap the inline base64 size. Anthropic handles the full
# batch in a single call. So for the OpenAI-compatible providers we send one
# downscaled frame per request and merge the results. Ollama (local) is also
# OpenAI-compatible and one-image-at-a-time.
_SINGLE_IMAGE_PROVIDERS = {"openrouter", "nvidia", "ollama"}
_MAX_IMAGE_EDGE = 768   # px — downscale longest side to keep payload small
_JPEG_QUALITY = 70

# Ollama runs locally with no rate limits or per-request cost, so we don't need
# to pace requests for it (only the metered cloud free tiers).
_RATE_LIMITED_PROVIDERS = {"openrouter", "nvidia"}

# Single-image providers make ONE request per frame, so a long video would fire
# hundreds of requests and hit free-tier rate limits. Cap how many frames we
# actually send to the AI (evenly sampled across the video). Pose stats are
# still computed on every frame. 0 = no cap (Anthropic sends full batches).
# Fewer frames = fewer requests against the free-tier rate limit, and a faster
# job. 24 evenly-sampled frames is plenty of coverage for a short clip.
# Override with MAX_AI_FRAMES env var if you have higher limits (paid key).
MAX_AI_FRAMES = 0 if PROVIDER == "anthropic" else int(os.environ.get("MAX_AI_FRAMES", "24"))

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

    if PROVIDER in ("openrouter", "nvidia", "ollama"):
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
            elif PROVIDER == "nvidia":
                _openai_client = openai.AsyncOpenAI(
                    base_url="https://integrate.api.nvidia.com/v1",
                    api_key=os.environ.get("NVIDIA_API_KEY", ""),
                )
            else:  # ollama — local server, OpenAI-compatible endpoint
                base = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
                _openai_client = openai.AsyncOpenAI(
                    base_url=f"{base.rstrip('/')}/v1",
                    api_key="ollama",  # required by the SDK but ignored by Ollama
                    timeout=600,        # local vision inference can be slow
                )
        return _openai_client

    raise ValueError(f"Unknown ANALYZER_PROVIDER: {PROVIDER!r}. Use anthropic | openrouter | nvidia | ollama")


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

_resolved_model: str | None = None
_ranked_models: list[str] = []   # all free vision candidates, best first
_model_idx: int = 0              # which one we're currently using


def _advance_model() -> str | None:
    """
    Move to the next candidate free model (called when the current one is
    persistently rate-limited). Returns the new model id, or None if exhausted.
    """
    global _model_idx, _resolved_model
    if _model_idx + 1 < len(_ranked_models):
        _model_idx += 1
        _resolved_model = _ranked_models[_model_idx]
        print(f"[ai_analyzer] switching to next free model: {_resolved_model}")
        return _resolved_model
    return None


async def _resolve_model() -> str:
    """
    Pick a working model. An explicit ANALYZER_MODEL always wins. Otherwise, for
    OpenRouter, query the live catalogue and auto-pick a FREE vision model — the
    free list changes often, so hard-coding a name leads to 404s.
    """
    global _resolved_model
    if _resolved_model:
        return _resolved_model

    override = os.environ.get("ANALYZER_MODEL")
    if override:
        _resolved_model = override
        return _resolved_model

    if PROVIDER == "openrouter":
        try:
            import httpx
            async with httpx.AsyncClient(timeout=20) as c:
                r = await c.get(
                    "https://openrouter.ai/api/v1/models",
                    headers={"Authorization": f"Bearer {os.environ.get('OPENROUTER_API_KEY', '')}"},
                )
                data = r.json().get("data", [])

            free_vision = []
            for m in data:
                mid = m.get("id", "")
                arch = m.get("architecture", {}) or {}
                mods = arch.get("input_modalities") or arch.get("modality") or []
                if isinstance(mods, str):
                    mods = [mods]
                pricing = m.get("pricing", {}) or {}
                is_free = str(pricing.get("prompt", "1")) in ("0", "0.0") or mid.endswith(":free")
                has_vision = any("image" in str(x).lower() for x in mods)
                if is_free and has_vision:
                    free_vision.append(mid)

            if free_vision:
                # "reasoning"/"omni" models spend their token budget on internal
                # thinking and often return empty content before emitting the JSON
                # we need — they make poor structured-output labellers. Rank plain
                # vision-language models first, fall back to the rest only if none.
                def _is_reasoner(mid: str) -> bool:
                    low = mid.lower()
                    # Exclude known reasoning/thinking architectures by name pattern.
                    # "kimi-k2" and "kimi-k1.5" are Moonshot reasoning models;
                    # "o1", "o3", "r1" suffixes/prefixes are also common patterns.
                    patterns = ("reasoning", "thinking", "-omni", "kimi-k", "/o1", "/o3",
                                "/r1", "-r1", "deepseek-r", "qwq", "marco-o")
                    return any(p in low for p in patterns)

                global _ranked_models, _model_idx
                preferred = [m for m in free_vision if not _is_reasoner(m)]
                ranked = preferred + [m for m in free_vision if m not in preferred]
                _ranked_models = ranked
                _model_idx = 0
                _resolved_model = ranked[0]
                print(f"[ai_analyzer] auto-selected free vision model: {_resolved_model}")
                print(f"[ai_analyzer] available free vision models: {ranked[:10]}")
                return _resolved_model
            print("[ai_analyzer] no free vision models found on OpenRouter right now.")
        except Exception as e:
            # Don't cache on failure (e.g. transient network blip) — leave
            # _resolved_model unset so the next batch can retry auto-resolution.
            print(f"[ai_analyzer] model auto-resolve failed: {e}")
            return ANALYZER_MODEL

    _resolved_model = ANALYZER_MODEL
    return _resolved_model


async def _analyze_openai_compat(frame_paths, pose_data, frame_indices) -> dict:
    """
    Free vision models take one image per request. Send each frame individually
    (downscaled) and merge the JSON results back into one batch result.
    """
    client = _get_client()
    model = await _resolve_model()

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

        response = None
        for attempt in range(3):
            try:
                response = await client.chat.completions.create(
                    model=model,
                    # Headroom so reasoning-capable models can finish thinking AND
                    # still emit the JSON payload (1024 was often exhausted first).
                    max_tokens=3000,
                    messages=messages,
                )
                break
            except Exception as e:
                err = str(e)
                is_rate_limit = "429" in err or "rate" in err.lower() or "rate_limit" in err.lower()
                if is_rate_limit:
                    # First try a short backoff on the same model; if it's still
                    # jammed, rotate to the next free model and retry on that.
                    if attempt == 0:
                        print(f"[ai_analyzer] frame {idx} rate-limited on {model}, waiting 8s…")
                        await asyncio.sleep(8)
                        continue
                    nxt = _advance_model()
                    if nxt:
                        model = nxt
                        continue
                    print(f"[ai_analyzer] frame {idx}: all free models rate-limited, skipping")
                    break
                print(f"[ai_analyzer] frame {idx} failed: {e}")
                break
        if response is None:
            continue

        result = _parse_json_response(response.choices[0].message.content)
        merged["actions"].extend(result.get("actions", []))
        merged["technique_notes"].extend(result.get("technique_notes", []))
        merged["scoring_events"].extend(result.get("scoring_events", []))
        if result.get("overall_assessment"):
            assessments.append(result["overall_assessment"])

        # Pace requests to stay within free-tier rate limits (~6 req/min).
        # Local Ollama has no limits, so don't slow it down.
        if PROVIDER in _RATE_LIMITED_PROVIDERS:
            await asyncio.sleep(2)

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


def _empty_result(assessment: str = "") -> dict:
    return {
        "actions": [],
        "technique_notes": [],
        "scoring_events": [],
        "overall_assessment": assessment,
    }


def _normalize_result(parsed, raw_text: str = "") -> dict:
    """
    Coerce whatever the model returned into our expected dict shape. Small local
    models (moondream, etc.) are loose: they may return a bare JSON list, a dict
    with the wrong field types, or an object nested under another key. Never let
    that crash the merge step — always hand back the four expected keys with the
    right types.
    """
    # A bare list — the model emitted just the actions array (or a list of
    # objects). Treat list-of-dicts as actions; anything else is unusable.
    if isinstance(parsed, list):
        actions = [x for x in parsed if isinstance(x, dict)]
        return {
            "actions": actions,
            "technique_notes": [],
            "scoring_events": [],
            "overall_assessment": "",
        }

    if not isinstance(parsed, dict):
        # A bare string/number/bool — keep the raw text as the assessment.
        return _empty_result(str(raw_text or parsed)[:500])

    def _as_list(v):
        if isinstance(v, list):
            return [x for x in v if isinstance(x, dict)]
        if isinstance(v, dict):
            return [v]
        return []

    assessment = parsed.get("overall_assessment", "")
    if not isinstance(assessment, str):
        assessment = str(assessment)

    return {
        "actions": _as_list(parsed.get("actions")),
        "technique_notes": _as_list(parsed.get("technique_notes")),
        "scoring_events": _as_list(parsed.get("scoring_events")),
        "overall_assessment": assessment[:500],
    }


def _parse_json_response(text: str | None) -> dict:
    if not text:
        return _empty_result()
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
        text = text.strip()
    # Small models often wrap JSON in prose. Try a direct parse first, then fall
    # back to extracting the first {...} or [...] block from the surrounding text.
    try:
        return _normalize_result(json.loads(text), text)
    except json.JSONDecodeError:
        pass

    snippet = _extract_json_block(text)
    if snippet is not None:
        try:
            return _normalize_result(json.loads(snippet), text)
        except json.JSONDecodeError:
            pass

    # No parseable JSON at all — keep the prose as the assessment so the user
    # still sees what the model said instead of a blank result.
    return _empty_result(text[:500])


def _extract_json_block(text: str) -> str | None:
    """Return the first balanced {...} or [...] block found in text, else None."""
    starts = [i for i in (text.find("{"), text.find("[")) if i != -1]
    if not starts:
        return None
    start = min(starts)
    open_ch = text[start]
    close_ch = "}" if open_ch == "{" else "]"
    depth = 0
    for i in range(start, len(text)):
        if text[i] == open_ch:
            depth += 1
        elif text[i] == close_ch:
            depth -= 1
            if depth == 0:
                return text[start:i + 1]
    return None
