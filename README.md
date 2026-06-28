# Signal Canvas

Institutional digital protection review console — **Hermes × NVIDIA × Stripe hackathon build**.

Desktop intelligence desk for NGOs and CSOs. Human-in-the-loop review with an agent layer that scans, correlates, and generates briefs.

## Quick start

```bash
npm install
npm run setup:integrations   # Hermes API + Stripe CLI checks
hermes gateway               # terminal 1 — keep running
npm run tauri dev            # terminal 2
```

Production build:

```bash
npm run tauri build
# → src-tauri/target/release/bundle/macos/Signal Canvas.app
```

## Hackathon stack

| Layer | Integration |
|-------|-------------|
| UI | Tauri 2 + React + **@xyflow/react** (Bezier signal edges) |
| Agent | [Hermes Agent](https://github.com/NousResearch/hermes-agent) gateway `:8642` |
| Model | Nemotron via Nous Portal / [NemoClaw](https://docs.nvidia.com/nemoclaw/) |
| Payments | Stripe Link CLI + Projects skills |

See [integrations/README.md](integrations/README.md).

## Agent modes

- **Live** — calls Hermes; fixture fallback if gateway offline
- **Fixture** — offline demo always

Toggle in **Settings → Agent mode**.

## City themes

Mykonos (default), Monaco, Angola — flag-inspired palettes in Settings.

## Open source

MIT. No secrets in repo. Bring your own Hermes, NVIDIA, and Stripe accounts.

## Docs

- [Product vision](docs/01-product-vision.md)
- [Demo flow](docs/03-demo-flow.md)
- [Integrations](integrations/README.md)
