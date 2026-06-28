#!/usr/bin/env bash
# Deploy Signal Canvas web MVP to Cloudflare Workers + D1.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v wrangler >/dev/null 2>&1; then
  echo "Install wrangler: npm i -g wrangler"
  exit 1
fi

echo "→ Checking Cloudflare auth..."
if ! wrangler whoami >/dev/null 2>&1; then
  echo "Not logged in. Run: wrangler login"
  exit 1
fi

echo "→ Building web bundle..."
npm run build:web

echo "→ Installing worker deps..."
cd cloudflare
npm install

DB_NAME="signal-canvas"
if ! wrangler d1 list 2>/dev/null | grep -q "$DB_NAME"; then
  echo "→ Creating D1 database $DB_NAME..."
  wrangler d1 create "$DB_NAME"
  echo "Update cloudflare/wrangler.toml database_id if wrangler printed a new id."
fi

echo "→ Applying D1 migrations (remote)..."
wrangler d1 migrations apply "$DB_NAME" --remote

if ! wrangler secret list 2>/dev/null | grep -q JWT_SECRET; then
  echo "→ Set secrets (one-time):"
  echo "  wrangler secret put JWT_SECRET"
  echo "  wrangler secret put ENCRYPTION_KEY"
  echo "  wrangler secret put TELEGRAM_BRIDGE_URL   # after Fly deploy"
fi

echo "→ Deploying worker..."
wrangler deploy

echo "✓ Deploy complete. Open the workers.dev URL printed above."
