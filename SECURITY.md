# Security

Signal Canvas is designed to be **open source with zero secrets in git**. All operator credentials live on the device or in Cloudflare Worker secrets — never in this repository.

## Never commit

| Item | Where it lives instead |
|------|------------------------|
| NVIDIA API key (`nvapi-...`) | Settings → NVIDIA, encrypted `~/.signal-canvas/integrations.json` |
| Nous / Hermes key (`sk-...`) | Settings → Hermes, same encrypted file |
| Stripe secret key (`sk_test_...`, `sk_live_...`) | Settings → Stripe, same encrypted file |
| Telegram API ID / hash | Settings → Telegram, same encrypted file |
| Telegram `.session` files | `~/.signal-canvas/telegram/` (gitignored locally) |
| Operator passcodes / password hashes | `~/.signal-canvas/auth.json` (local only) |
| Case vault / session DB | `~/.signal-canvas/vault.enc`, `workspace.db`, `data-key.enc` |
| Apple notarization credentials | `.env.apple` (copy from `.env.apple.example`) |
| Cloudflare Worker secrets | `wrangler secret put` (`HERMES_GATEWAY_KEY`, `NVIDIA_API_KEY`, etc.) |

## Safe in the repo

- Placeholder strings in docs (`nvapi-...`, `sk_test_...`, `API_SERVER_KEY=your_key`)
- Hosted gateway identifier `signal-canvas-prod-gateway` (public app auth, not a personal key)
- Apple Team ID in examples (public signing metadata)
- Worker URLs and R2 bucket names

## Before you push

```bash
npm run security:check
```

This scans staged files for common secret patterns and blocked paths.

If you ever paste a key into chat, a screenshot, or git history:

```bash
npm run security:reset-secrets
```

Then rotate the key at the provider (NVIDIA, Nous, Stripe, Telegram, Apple).

## Reporting

For security issues related to Signal Canvas, contact the STRATIR maintainers privately before opening a public issue with exploit details.
