#!/usr/bin/env bash
# Build signed macOS app and publish DMG to Cloudflare R2 + download worker.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# shellcheck disable=SC1091
source "$ROOT/scripts/load-apple-env.sh"

VERSION="$(node -p "require('./src-tauri/tauri.conf.json').version")"
DMG="Signal Canvas_${VERSION}_aarch64.dmg"
DMG_PATH="$ROOT/src-tauri/target/release/bundle/dmg/$DMG"
BUCKET="signal-canvas-releases"
R2_KEY="Signal-Canvas-${VERSION}-aarch64.dmg"
R2_LATEST="Signal-Canvas-latest-aarch64.dmg"

if ! command -v wrangler >/dev/null 2>&1; then
  echo "Install wrangler: npm i -g wrangler"
  exit 1
fi

if ! wrangler whoami >/dev/null 2>&1; then
  echo "Not logged in. Run: wrangler login"
  exit 1
fi

echo "→ Building signed + notarized macOS app (v${VERSION})..."
npm run tauri build || true

APP_PATH="$ROOT/src-tauri/target/release/bundle/macos/Signal Canvas.app"
if [[ ! -f "$DMG_PATH" && -d "$APP_PATH" ]]; then
  echo "→ Tauri DMG bundling failed; creating DMG with hdiutil..."
  rm -f "$DMG_PATH"
  hdiutil create -volname "Signal Canvas" -srcfolder "$APP_PATH" -ov -format UDZO "$DMG_PATH"
fi

if [[ ! -f "$DMG_PATH" ]]; then
  echo "Missing DMG: $DMG_PATH"
  exit 1
fi

echo "→ Verifying notarization staple..."
if ! xcrun stapler validate "$ROOT/src-tauri/target/release/bundle/macos/Signal Canvas.app" 2>/dev/null; then
  echo "Warning: app staple check failed — DMG may still prompt Gatekeeper." >&2
fi
if ! xcrun stapler validate "$DMG_PATH" 2>/dev/null; then
  echo "→ Notarizing DMG..."
  xcrun notarytool submit "$DMG_PATH" \
    --apple-id "$APPLE_ID" \
    --password "$APPLE_PASSWORD" \
    --team-id "$APPLE_TEAM_ID" \
    --wait
  xcrun stapler staple "$DMG_PATH"
  xcrun stapler validate "$DMG_PATH"
fi

echo "→ Ensuring R2 bucket ${BUCKET}..."
if ! wrangler r2 bucket list 2>/dev/null | grep -q "$BUCKET"; then
  wrangler r2 bucket create "$BUCKET"
fi

echo "→ Uploading DMG to R2 (remote)..."
wrangler r2 object put "${BUCKET}/${R2_KEY}" \
  --file="$DMG_PATH" \
  --content-type="application/x-apple-diskimage" \
  --remote

wrangler r2 object put "${BUCKET}/${R2_LATEST}" \
  --file="$DMG_PATH" \
  --content-type="application/x-apple-diskimage" \
  --remote

echo "→ Deploying download worker..."
cd cloudflare
npm install
wrangler deploy

echo ""
echo "✓ macOS release published"
echo "  Landing:  https://signal-canvas.tethsiga.workers.dev/"
echo "  Direct:   https://signal-canvas.tethsiga.workers.dev/download"
echo "  Version:  ${VERSION}"
