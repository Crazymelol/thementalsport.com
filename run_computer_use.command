#!/bin/bash
#
# Anthropic Computer Use — one-click installer & launcher for macOS
# Double-click this file in Finder. It will:
#   1. Install Homebrew (if missing)
#   2. Install Docker Desktop (if missing)
#   3. Start Docker
#   4. Ask for your Anthropic API key (once)
#   5. Download & launch Computer Use, then open it in your browser
#
# You only need to: double-click, approve any macOS password prompts,
# and paste your API key when asked.

set -e
cd "$(dirname "$0")"

echo "==================================================="
echo "   Anthropic Computer Use — automatic setup"
echo "==================================================="
echo ""

# --- 1. Homebrew -----------------------------------------------------------
if ! command -v brew >/dev/null 2>&1; then
  echo "[1/5] Installing Homebrew (enter your Mac password if asked)..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi
# Make sure brew is on PATH (Apple Silicon installs to /opt/homebrew).
eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null)" || \
eval "$(/usr/local/bin/brew shellenv 2>/dev/null)" || true
echo "[1/5] Homebrew ready."

# --- 2. Docker Desktop -----------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  echo "[2/5] Installing Docker Desktop (this takes a few minutes)..."
  # The cask was renamed; try the new name first, fall back to the old one.
  brew install --cask docker-desktop || brew install --cask docker
fi
echo "[2/5] Docker installed."

# --- 3. Start Docker -------------------------------------------------------
if ! docker info >/dev/null 2>&1; then
  echo "[3/5] Starting Docker Desktop (approve the privileged-helper prompt if it appears)..."
  open -a "Docker" 2>/dev/null || open -a "Docker Desktop" 2>/dev/null || true
  printf "      waiting for Docker to be ready"
  for _ in $(seq 1 90); do
    if docker info >/dev/null 2>&1; then break; fi
    printf "."
    sleep 2
  done
  echo ""
fi
if ! docker info >/dev/null 2>&1; then
  echo "ERROR: Docker did not start. Open Docker Desktop manually, wait for the"
  echo "       whale icon to go steady, then double-click this file again."
  read -r -p "Press Enter to close."
  exit 1
fi
echo "[3/5] Docker is running."

# --- 4. API key ------------------------------------------------------------
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo ""
  echo "[4/5] Paste your Anthropic API key."
  echo "      Get one at: https://console.anthropic.com/settings/keys"
  echo "      (it stays hidden as you paste — press Enter when done)"
  read -rs ANTHROPIC_API_KEY
  echo ""
fi
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "ERROR: no API key entered. Run the file again and paste your sk-ant-... key."
  read -r -p "Press Enter to close."
  exit 1
fi
echo "[4/5] API key received."

# --- 5. Launch -------------------------------------------------------------
echo "[5/5] Downloading & starting Computer Use (first run pulls ~2 GB)..."
echo "      Your browser will open automatically at http://localhost:8080"
echo "      Leave THIS window open while you use it. Close it to stop."
echo ""

# Open the browser once the server is likely up.
( sleep 30; open "http://localhost:8080" ) >/dev/null 2>&1 &

exec docker run \
  -e ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  -v "$HOME/.anthropic:/home/computeruse/.anthropic" \
  -p 5900:5900 \
  -p 8501:8501 \
  -p 6080:6080 \
  -p 8080:8080 \
  -it ghcr.io/anthropics/anthropic-quickstarts:computer-use-demo-latest
