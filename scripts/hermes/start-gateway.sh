#!/usr/bin/env bash
# Start Hermes gateway for Signal Canvas (desktop). Keys must already be in ~/.hermes/.env (synced by app).
set -euo pipefail

HERMES_ENV="$HOME/.hermes/.env"
GATEWAY_URL="http://127.0.0.1:8642"
HERMES_BIN="${HERMES_BIN:-}"

if [[ -z "$HERMES_BIN" ]]; then
  if command -v hermes >/dev/null 2>&1; then
    HERMES_BIN="$(command -v hermes)"
  elif [[ -x "$HOME/.local/bin/hermes" ]]; then
    HERMES_BIN="$HOME/.local/bin/hermes"
  elif [[ -x "$HOME/.hermes/hermes-agent/venv/bin/hermes" ]]; then
    HERMES_BIN="$HOME/.hermes/hermes-agent/venv/bin/hermes"
  fi
fi

if [[ -z "$HERMES_BIN" ]]; then
  echo "Hermes not installed. Run: curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash"
  exit 1
fi

if [[ "${HERMES_RESTART:-0}" == "1" ]]; then
  lsof -ti tcp:8642 2>/dev/null | xargs kill -9 2>/dev/null || true
  pkill -f "hermes gateway" 2>/dev/null || true
  sleep 1
elif curl -sf "${GATEWAY_URL}/health" >/dev/null 2>&1; then
  echo "Hermes gateway already running on :8642"
  exit 0
fi

if [[ ! -f "$HERMES_ENV" ]]; then
  mkdir -p "$(dirname "$HERMES_ENV")"
  cat > "$HERMES_ENV" <<'EOF'
API_SERVER_ENABLED=true
API_SERVER_HOST=127.0.0.1
API_SERVER_PORT=8642
API_SERVER_KEY=signal-canvas-local-dev
GATEWAY_ALLOW_ALL_USERS=true
EOF
fi

echo "Starting Hermes gateway via $HERMES_BIN (background)..."
mkdir -p "$HOME/.signal-canvas"
nohup "$HERMES_BIN" gateway >> "$HOME/.signal-canvas/hermes-gateway.log" 2>&1 &
sleep 3
if curl -sf "${GATEWAY_URL}/health" >/dev/null 2>&1; then
  echo "✓ Hermes gateway online at ${GATEWAY_URL}"
else
  echo "⚠ Gateway may still be starting — check $HOME/.signal-canvas/hermes-gateway.log"
fi
