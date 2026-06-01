#!/usr/bin/env bash
# One-time deployment setup for Fencing AI.
# Run this ONCE from your local machine to link accounts and configure GitHub secrets.
# After this, every push to main auto-deploys via GitHub Actions.
#
# Prerequisites: node, npm, git, gh (GitHub CLI)
# Install gh: https://cli.github.com

set -e
REPO="crazymelol/thementalsport.com"
cd "$(dirname "$0")"

# ── colours ──────────────────────────────────────────────────────────────────
G="\033[32m"; Y="\033[33m"; R="\033[31m"; B="\033[1m"; X="\033[0m"
ok()   { echo -e "${G}✓${X} $*"; }
info() { echo -e "${B}→${X} $*"; }
die()  { echo -e "${R}✗ $*${X}"; exit 1; }

echo ""
echo -e "${B}═══════════════════════════════════════════════${X}"
echo -e "${B}  Fencing AI — one-time deployment setup       ${X}"
echo -e "${B}═══════════════════════════════════════════════${X}"
echo ""

# ── 0. Check prerequisites ────────────────────────────────────────────────────
command -v npm  >/dev/null 2>&1 || die "npm not found. Install Node.js first."
command -v gh   >/dev/null 2>&1 || die "GitHub CLI not found. Install from https://cli.github.com"
command -v jq   >/dev/null 2>&1 || die "jq not found. Install with: brew install jq / apt install jq"

# ── 1. Vercel ─────────────────────────────────────────────────────────────────
echo -e "\n${B}── Step 1: Vercel (frontend) ──────────────────${X}"

npm install -g vercel -q
ok "Vercel CLI installed"

info "Logging into Vercel and linking the frontend project…"
info "(A browser window will open — log in with your Vercel account)"
echo ""

(cd frontend && vercel link --yes)
ok "Vercel project linked"

VERCEL_ORG_ID=$(jq -r '.orgId'     frontend/.vercel/project.json)
VERCEL_PROJECT_ID=$(jq -r '.projectId' frontend/.vercel/project.json)

echo ""
info "Get your Vercel token from: https://vercel.com/account/tokens"
read -rp "  Paste your Vercel token: " VERCEL_TOKEN
[ -z "$VERCEL_TOKEN" ] && die "Token cannot be empty"

# ── 2. Railway ────────────────────────────────────────────────────────────────
echo ""
echo -e "${B}── Step 2: Railway (backend) ───────────────────${X}"
echo ""
info "You need a Railway account with a project set up."
info "If you haven't yet:"
info "  1. Go to https://railway.app → New Project → Deploy from GitHub repo"
info "  2. Select this repo, set root directory = fencing-ai/backend"
info "  3. In Variables add: ANTHROPIC_API_KEY=sk-ant-..."
info "  4. Copy the Service ID from the service settings"
echo ""
info "Get your Railway token from: https://railway.app/account/tokens"
read -rp "  Paste your Railway token:   " RAILWAY_TOKEN
[ -z "$RAILWAY_TOKEN" ] && die "Token cannot be empty"
read -rp "  Paste your Railway service ID (from service settings URL): " RAILWAY_SERVICE_ID
[ -z "$RAILWAY_SERVICE_ID" ] && die "Service ID cannot be empty"

# ── 3. Set GitHub secrets ─────────────────────────────────────────────────────
echo ""
echo -e "${B}── Step 3: Adding secrets to GitHub ────────────${X}"

gh auth status >/dev/null 2>&1 || (info "Logging into GitHub CLI…" && gh auth login)

secrets=(
  "VERCEL_TOKEN=$VERCEL_TOKEN"
  "VERCEL_ORG_ID=$VERCEL_ORG_ID"
  "VERCEL_PROJECT_ID=$VERCEL_PROJECT_ID"
  "RAILWAY_TOKEN=$RAILWAY_TOKEN"
  "RAILWAY_SERVICE_ID=$RAILWAY_SERVICE_ID"
)

for secret in "${secrets[@]}"; do
  name="${secret%%=*}"
  value="${secret#*=}"
  gh secret set "$name" --repo "$REPO" --body "$value"
  ok "Set secret: $name"
done

# ── 4. Set Vercel env var ──────────────────────────────────────────────────────
echo ""
echo -e "${B}── Step 4: Vercel environment variable ─────────${X}"
info "What is your Railway backend URL? (e.g. https://fencing-ai-backend.up.railway.app)"
info "Find it in Railway → your service → Settings → Networking → Public domain"
read -rp "  Railway URL: " RAILWAY_URL
[ -z "$RAILWAY_URL" ] && die "URL cannot be empty"

echo "$RAILWAY_URL" | (cd frontend && vercel env add NEXT_PUBLIC_API_URL production --token "$VERCEL_TOKEN")
ok "Set NEXT_PUBLIC_API_URL on Vercel"

# ── Done ───────────────────────────────────────────────────────────────────────
echo ""
echo -e "${G}${B}═══════════════════════════════════════════════${X}"
echo -e "${G}${B}  All done! GitHub Actions will now auto-deploy${X}"
echo -e "${G}${B}  on every push to main.                       ${X}"
echo -e "${G}${B}═══════════════════════════════════════════════${X}"
echo ""
echo -e "  Frontend: push to main → Vercel auto-deploys"
echo -e "  Backend:  push to main → Railway auto-deploys"
echo ""
info "To trigger the first deploy now:"
echo -e "    git push origin claude/new-project-BzhH4"
echo ""
