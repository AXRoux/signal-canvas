# Signal Canvas Integrations

Hermes × NVIDIA × Stripe hackathon stack for institutional agent operations.

## Architecture

```
Signal Canvas (Tauri UI)
        ↕ invoke (Rust)
Hermes Gateway :8642
        ├── Nemotron 3 (via Nous Portal / NemoClaw)
        ├── signal-canvas-* skills
        └── Stripe skills (Link CLI, Projects)
```

## Quick setup

```bash
chmod +x scripts/setup-integrations.sh
./scripts/setup-integrations.sh
hermes gateway   # keep running in a terminal
npm run tauri dev
```

## Agent modes

| Mode | Behavior |
|------|----------|
| **Live** | Calls Hermes API; falls back to fixtures if gateway offline |
| **Fixture** | Offline demo data always |

Toggle in **Settings → Agent mode**.

## Hermes skills (this repo)

| Skill | Command |
|-------|---------|
| Scan | `/signal-canvas-scan @handle context` |
| Correlate | `/signal-canvas-correlate node_id=...` |
| Brief | `/signal-canvas-brief` |

Located in `.hermes/skills/`.

## Stripe

- **Link CLI** — agent-initiated purchases (user approves in Link app)
- **Projects** — provision Neon, Twilio, etc. via `stripe projects add`

Install via setup script or:

```bash
hermes skills install official/payments/stripe-link-cli
hermes skills install official/payments/stripe-projects
```

## NemoClaw (optional sandbox)

```bash
export NEMOCLAW_AGENT=hermes
curl -fsSL https://www.nvidia.com/nemoclaw.sh | bash
nemohermes onboard
```

Docs: https://docs.nvidia.com/nemoclaw/latest/get-started/quickstart-hermes.html

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `API_SERVER_KEY` | in `~/.hermes/.env` | Hermes auth |
| `HERMES_API_URL` | `http://127.0.0.1:8642` | Gateway URL |
| `API_SERVER_PORT` | `8642` | Gateway port |

## Open source

MIT licensed. No API keys in repo. Users supply their own Hermes, NVIDIA, and Stripe accounts.
