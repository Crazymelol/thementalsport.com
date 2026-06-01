#!/bin/bash
#
# Local AI for the Fencing app — Ollama setup (macOS)
# Double-click in Finder, or run:  bash setup_ollama_fencing.command
#
# It will:
#   1. Install Ollama (free, local AI — no key, no rate limits)
#   2. Start the Ollama server
#   3. Download a vision model (llama3.2-vision)
#   4. Point the fencing backend at Ollama (edits backend/.env)
#
# After it finishes: restart the backend and analyze a clip — fully free,
# no rate limits, runs entirely on your Mac.

set -e
cd "$(dirname "$0")"

# Default to a SMALL vision model that fits comfortably in 8 GB RAM.
# qwen2.5vl:3b (~3.2 GB) is a strong small VLM; moondream (~1.8 GB) is the
# lightweight fallback if the first pull fails or RAM is very tight.
MODEL="${OLLAMA_MODEL:-qwen2.5vl:3b}"
FALLBACK_MODEL="moondream"
BACKEND_ENV="fencing-ai/backend/.env"

echo "==================================================="
echo "   Fencing app — local AI (Ollama) setup"
echo "==================================================="
echo ""

# --- 1. Homebrew (for the install) -----------------------------------------
if ! command -v brew >/dev/null 2>&1; then
  echo "[1/5] Installing Homebrew (enter your Mac password if asked)..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi
eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null)" || \
eval "$(/usr/local/bin/brew shellenv 2>/dev/null)" || true

# --- 2. Install Ollama ------------------------------------------------------
if ! command -v ollama >/dev/null 2>&1; then
  echo "[2/5] Installing Ollama..."
  brew install --cask ollama-app 2>/dev/null || brew install ollama
fi
echo "[2/5] Ollama installed."

# --- 3. Start the Ollama server --------------------------------------------
if ! curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
  echo "[3/5] Starting Ollama server..."
  open -a Ollama 2>/dev/null || true            # launches the menu-bar app if present
  ( ollama serve >/dev/null 2>&1 & ) || true     # fallback: start the daemon directly
  printf "      waiting for Ollama"
  for _ in $(seq 1 30); do
    curl -s http://localhost:11434/api/tags >/dev/null 2>&1 && break
    printf "."
    sleep 1
  done
  echo ""
fi
curl -s http://localhost:11434/api/tags >/dev/null 2>&1 || {
  echo "ERROR: Ollama server didn't start. Open the Ollama app once, then rerun."
  read -r -p "Press Enter to close."; exit 1; }
echo "[3/5] Ollama is running."

# --- 4. Download the vision model ------------------------------------------
echo "[4/5] Downloading vision model '$MODEL' (a few GB — one-time)..."
if ! ollama pull "$MODEL"; then
  echo "      '$MODEL' unavailable — falling back to '$FALLBACK_MODEL'..."
  MODEL="$FALLBACK_MODEL"
  ollama pull "$MODEL"
fi
echo "[4/5] Model ready: $MODEL"

# --- 5. Point the fencing backend at Ollama --------------------------------
echo "[5/5] Configuring backend ($BACKEND_ENV)..."
if [ ! -f "$BACKEND_ENV" ]; then
  echo "  (no .env yet — creating one)"
  : > "$BACKEND_ENV"
fi
# Remove any existing provider/model lines, then set ours.
grep -vE '^(ANALYZER_PROVIDER|ANALYZER_MODEL|OLLAMA_HOST)=' "$BACKEND_ENV" > "$BACKEND_ENV.tmp" 2>/dev/null || true
mv "$BACKEND_ENV.tmp" "$BACKEND_ENV"
{
  echo "ANALYZER_PROVIDER=ollama"
  echo "ANALYZER_MODEL=$MODEL"
  echo "OLLAMA_HOST=http://localhost:11434"
} >> "$BACKEND_ENV"
echo "[5/5] Backend now uses local Ollama."

echo ""
echo "==================================================="
echo "  DONE — free local AI is set up."
echo ""
echo "  Now restart the backend:"
echo "    cd ~/thementalsport.com/fencing-ai/backend"
echo "    source .venv/bin/activate"
echo "    uvicorn main:app --reload --port 8000"
echo ""
echo "  Then analyze a clip in the browser — no rate limits, \$0."
echo "==================================================="
read -r -p "Press Enter to close."
