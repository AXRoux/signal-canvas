#!/usr/bin/env bash
# Wipes locally stored integration secrets. Run after rotating any exposed keys.
set -euo pipefail

SC_DIR="${HOME}/.signal-canvas"
HERMES_ENV="${HOME}/.hermes/.env"
INTEGRATIONS="${SC_DIR}/integrations.json"
VAULT="${SC_DIR}/vault.enc"
AUTH="${SC_DIR}/auth.json"

mkdir -p "$SC_DIR"

rm -f "$INTEGRATIONS" "$VAULT"

if [[ -f "$HERMES_ENV" ]]; then
  cp "$HERMES_ENV" "${HERMES_ENV}.bak.$(date +%s)"
  grep -v -E '^(NOUS_API_KEY|NVIDIA_API_KEY|TELEGRAM_API_ID|TELEGRAM_API_HASH|API_SERVER_KEY)=' "$HERMES_ENV" > "${HERMES_ENV}.tmp" || true
  mv "${HERMES_ENV}.tmp" "$HERMES_ENV"
  {
    echo 'API_SERVER_KEY='
    echo 'NOUS_API_KEY='
    echo 'NVIDIA_API_KEY='
    echo 'TELEGRAM_API_ID='
    echo 'TELEGRAM_API_HASH='
  } >> "$HERMES_ENV"
fi

echo "✓ Removed ${INTEGRATIONS} and ${VAULT} if present (operator accounts in ${AUTH} preserved)"
echo "✓ Cleared secret fields in ${HERMES_ENV} (backup created if file existed)"
echo "Next: open Signal Canvas → Settings and re-enter keys. Rotate any keys previously pasted in chat."
