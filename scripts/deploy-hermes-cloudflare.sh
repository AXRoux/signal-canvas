#!/usr/bin/env bash
# Deploy hosted Hermes API on Cloudflare Workers (no Fly.io).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HERMES_ENV="${HOME}/.hermes/.env"
GATEWAY_KEY="${HERMES_GATEWAY_KEY:-signal-canvas-prod-gateway}"

read_env() {
  local key="$1"
  if [[ -f "$HERMES_ENV" ]]; then
    grep -E "^${key}=" "$HERMES_ENV" 2>/dev/null | tail -1 | cut -d= -f2- || true
  fi
}

NVIDIA_KEY="$(read_env NVIDIA_API_KEY)"
NIM_ENDPOINT="$(read_env NVIDIA_NIM_ENDPOINT)"

if ! command -v wrangler >/dev/null 2>&1; then
  echo "Install wrangler: npm i -g wrangler"
  exit 1
fi

cd "$ROOT/cloudflare"
npm install

echo "→ Setting Cloudflare secrets..."
printf '%s' "$GATEWAY_KEY" | wrangler secret put HERMES_GATEWAY_KEY
if [[ -n "$NVIDIA_KEY" ]]; then
  printf '%s' "$NVIDIA_KEY" | wrangler secret put NVIDIA_API_KEY
fi
if [[ -n "$NIM_ENDPOINT" ]]; then
  printf '%s' "$NIM_ENDPOINT" | wrangler secret put NVIDIA_NIM_ENDPOINT
fi

echo "→ Deploying worker..."
wrangler deploy

echo "→ Verifying hosted Hermes..."
if curl -sf -H "Authorization: Bearer ${GATEWAY_KEY}" \
  "https://signal-canvas.tethsiga.workers.dev/hermes/health" >/dev/null; then
  echo "✓ Hosted Hermes online at https://signal-canvas.tethsiga.workers.dev/hermes"
else
  echo "⚠ Health check failed (may propagate in ~30s)"
fi
