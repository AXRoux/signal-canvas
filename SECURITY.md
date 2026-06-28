# Security Policy

Signal Canvas is designed to be **open source with zero secrets in git**. This document describes how we protect operator data, what must never be committed, and how to report vulnerabilities.

## Scope

| In scope | Out of scope |
|----------|----------------|
| Signal Canvas desktop app (Tauri/Rust) | Third-party Telegram, NVIDIA, or Stripe platform bugs |
| Encrypted local vault and session storage | Compromise of operator machine outside the app |
| Cloudflare Worker download + Hermes gateway | Social engineering of analysts |

## Threat model (summary)

- **Operator device** is the trust boundary. Passcodes and encryption keys protect case data at rest.
- **API keys** are BYOK — analysts supply NVIDIA, Telegram, and optional Nous/Stripe credentials; these are encrypted locally, not sent to our git repo.
- **Hosted Hermes gateway** authenticates the app with a public gateway identifier; inference uses the analyst's NVIDIA key passed per request.
- **No cloud sync of case vault** in v0.1.0 — sessions stay on disk under `~/.signal-canvas/`.

## Never commit

| Secret | Where it lives |
|--------|----------------|
| NVIDIA API key (`nvapi-...`) | Settings → NVIDIA → encrypted `integrations.json` |
| Nous / Hermes key (`sk-...`) | Settings → Hermes → same file |
| Stripe secret (`sk_test_...`, `sk_live_...`) | Settings → Stripe → same file |
| Telegram API ID / hash | Settings → Telegram → same file |
| Telegram `.session` files | `~/.signal-canvas/telegram/` |
| Operator passcodes / hashes | `~/.signal-canvas/auth.json` |
| Case vault / DB | `vault.enc`, `workspace.db`, `data-key.enc` |
| Apple notarization credentials | `.env.apple` (from `.env.apple.example`) |
| Cloudflare Worker secrets | `wrangler secret put HERMES_GATEWAY_KEY`, `NVIDIA_API_KEY`, etc. |

## Safe in the repository

- Documentation placeholders (`nvapi-...`, `sk_test_...`)
- Public gateway identifier `signal-canvas-prod-gateway` (app auth, not a personal key)
- Worker URLs, R2 bucket names, Apple Team ID in examples
- Signed release artifacts uploaded to R2 (not stored in git)

## Developer checks

Before every commit or push:

```bash
npm run security:check
```

This script fails if blocked paths are tracked or common secret patterns appear in source.

If keys were pasted into chat, a screenshot, or git history:

```bash
npm run security:reset-secrets
```

Then **rotate** affected keys at each provider (NVIDIA, Nous, Stripe, Telegram, Apple).

## Local data locations (macOS)

```
~/.signal-canvas/
├── auth.json              # operator accounts (hashed passcodes)
├── integrations.json      # encrypted API keys
├── workspace.db           # encrypted case sessions
├── data-key.enc           # passcode-wrapped encryption key
├── vault.enc              # legacy vault (migrated to workspace.db)
└── telegram/              # MTProto session files
```

## Reporting a vulnerability

**Please do not** open public GitHub issues for exploitable security bugs.

1. Report privately via **[GitHub Security Advisories](https://github.com/AXRoux/signal-canvas/security/advisories/new)** or email **security@stratir.com** with:
   - Description and impact
   - Steps to reproduce
   - Affected version (app build date or git SHA)
   - Your environment (macOS version, if relevant)
2. Allow reasonable time for a fix before public disclosure.
3. We will acknowledge receipt and share remediation timeline when possible.

## Secure release process

- macOS builds are **Developer ID signed** and **notarized** before R2 upload.
- Release script: `npm run deploy:release` (requires `.env.apple`, never committed).
- Download worker serves stapled DMG from R2 only — no secrets in the worker bundle.

## Acknowledgments

We appreciate responsible disclosure from researchers and operators who help keep institutional review tools trustworthy.
