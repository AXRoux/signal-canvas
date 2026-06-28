#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HERMES_DIR="$HOME/.hermes"
SKILLS_SRC="$ROOT/.hermes/skills"
ENV_FILE="$HERMES_DIR/.env"
CONFIG_FILE="$HERMES_DIR/config.yaml"

echo "==> Signal Canvas integration setup"
echo "    Project: $ROOT"

mkdir -p "$SKILLS_SRC"

if [[ -f "$ENV_FILE" ]]; then
  if ! grep -q "API_SERVER_ENABLED" "$ENV_FILE"; then
    cat >> "$ENV_FILE" <<'EOF'

# Signal Canvas integration
API_SERVER_ENABLED=true
API_SERVER_KEY=signal-canvas-local-dev
API_SERVER_HOST=127.0.0.1
API_SERVER_PORT=8642
GATEWAY_ALLOW_ALL_USERS=true
EOF
    echo "✓ Added API server config to ~/.hermes/.env"
  else
    echo "✓ Hermes API server config already present"
  fi
else
  echo "⚠ ~/.hermes/.env not found — run: curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash"
fi

if command -v hermes &>/dev/null; then
  echo "✓ Hermes found: $(hermes --version 2>/dev/null | head -1)"

  if [[ -f "$CONFIG_FILE" ]]; then
    if ! grep -q "SignalCanvas" "$CONFIG_FILE" 2>/dev/null; then
      echo ""
      echo "Add to $CONFIG_FILE under skills.external_dirs:"
      echo "  - $SKILLS_SRC"
    fi
  fi
else
  echo "⚠ Hermes not installed"
  echo "  curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash"
fi

echo ""
echo "==> Next steps"
echo "1. Paste Hermes API key + NVIDIA key in Settings → Save"
echo "2. Or run: bash scripts/hermes/start-gateway.sh"
echo "3. Verify health: curl http://127.0.0.1:8642/health"
echo "4. Run Signal Canvas: cd $ROOT && npm run tauri dev"
