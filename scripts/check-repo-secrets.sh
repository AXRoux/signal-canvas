#!/usr/bin/env bash
# Fail if tracked/staged files look like secrets or blocked paths.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail=0

blocked_paths=(
  .env.apple
  .env.local
  cloudflare/.dev.vars
  .signal-canvas
  auth.json
  integrations.json
  vault.enc
  workspace.db
  data-key.enc
)

for path in "${blocked_paths[@]}"; do
  if git ls-files --error-unmatch "$path" >/dev/null 2>&1; then
    echo "BLOCKED: $path is tracked by git" >&2
    fail=1
  fi
done

if git ls-files '*.session' '*.session-journal' '*.p12' '*.p8' 'AuthKey_*.p8' 2>/dev/null | grep -q .; then
  echo "BLOCKED: signing/session files are tracked" >&2
  git ls-files '*.session' '*.session-journal' '*.p12' '*.p8' 'AuthKey_*.p8' >&2
  fail=1
fi

patterns=(
  'nvapi-[A-Za-z0-9]{20,}'
  'sk_test_[A-Za-z0-9]{16,}'
  'sk_live_[A-Za-z0-9]{16,}'
  'sk-nous-[A-Za-z0-9]{16,}'
  'rk_test_[A-Za-z0-9]{16,}'
  'rk_live_[A-Za-z0-9]{16,}'
  'APPLE_PASSWORD=[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}'
  'TELEGRAM_API_HASH=[0-9a-f]{16,}'
)

while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  case "$file" in
    scripts/check-repo-secrets.sh|scripts/load-apple-env.sh|*.example|SECURITY.md) continue ;;
  esac
  for pattern in "${patterns[@]}"; do
    if grep -qE "$pattern" "$file" 2>/dev/null; then
      echo "SUSPECT: $file matches /$pattern/" >&2
      fail=1
    fi
  done
done < <(git ls-files -z 2>/dev/null | tr '\0' '\n' | grep -Ev '\.(svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot|mp4|dmg|zip|lock)$|node_modules/|target/|\.venv/|package-lock\.json$' || true)

if [[ "$fail" -ne 0 ]]; then
  echo "" >&2
  echo "Secret scan failed. Remove secrets before pushing." >&2
  exit 1
fi

echo "✓ No blocked paths or obvious secrets in git index"
