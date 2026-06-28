# Tech Stack

## Desktop shell

- **Tauri 2** (Rust backend, lightweight native shell)
- macOS first, Windows later if needed

## Frontend

- **React** + **TypeScript** (or Svelte if preferred later)
- **Vite** for dev/build
- **Tailwind CSS** for glass design system

## Canvas / graph

- **React Flow** for node graph (recommended for speed)
- custom SVG fallback if bundle size matters

## State

- **Zustand** or React context for workspace, case, canvas state
- local JSON for demo fixtures

## AI / risk summary

- OpenAI or existing Stratir LLM path
- prompt template: institutional review tone, always requires human review disclaimer

## OSINT (v1)

- mock fixture layer first (`/fixtures/demo-sp.json`)
- optional live hooks later:
  - identity search APIs
  - social intel endpoints
  - username enumeration

## Export

- brief PDF via Rust sidecar or frontend print-to-PDF
- optional HTML brief template

## Security notes

- no covert monitoring positioning
- local-only demo data by default
- API keys in OS keychain via Tauri
- audit log table in local SQLite (phase 2)

## Suggested folder structure (when coding starts)

```
SignalCanvas/
├── src-tauri/          # Rust: commands, export, keychain
├── src/
│   ├── components/     # glass panels, tool rail, command bar
│   ├── canvas/         # graph nodes, edges
│   ├── panels/         # risk review, intel strip, brief
│   ├── commands/       # ⌘K palette logic
│   ├── fixtures/       # demo data
│   └── styles/         # design tokens
├── docs/               # planning (this folder)
└── README.md
```

## Dependencies to evaluate

- `@tauri-apps/api`
- `reactflow`
- `framer-motion` (light motion only)
- `cmdk` (command palette)
- `@react-pdf/renderer` or Tauri print plugin

## Non-goals for stack v1

- Convex (separate product, no Feynman coupling)
- Next.js
- cloud sync
- multi-user auth
