#!/usr/bin/env bash
# Load Apple notarization credentials (never commit the real file).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${APPLE_ENV_FILE:-$ROOT/.env.apple}"

if [[ ! -f "$ENV_FILE" ]]; then
  cat >&2 <<EOF
Missing Apple notarization credentials: $ENV_FILE

Create it with ONE of these options:

Option A — Apple ID (simplest)
  APPLE_ID=you@example.com
  APPLE_PASSWORD=xxxx-xxxx-xxxx-xxxx
  APPLE_TEAM_ID=NJ5N9JKMK5

  Generate APPLE_PASSWORD at https://appleid.apple.com → Sign-In and Security → App-Specific Passwords

Option B — App Store Connect API key (CI-friendly)
  APPLE_API_ISSUER=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  APPLE_API_KEY=XXXXXXXXXX
  APPLE_API_KEY_PATH=/absolute/path/to/AuthKey_XXXXXXXXXX.p8

Then re-run: npm run deploy:release
EOF
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [[ -z "${APPLE_TEAM_ID:-}" ]]; then
  export APPLE_TEAM_ID="NJ5N9JKMK5"
fi

if [[ -z "${APPLE_ID:-}" && -z "${APPLE_API_KEY_PATH:-}" ]]; then
  echo "Set APPLE_ID + APPLE_PASSWORD or APPLE_API_KEY_PATH in $ENV_FILE" >&2
  exit 1
fi
