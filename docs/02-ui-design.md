# UI Design

## Reference aesthetic

Inspired by floating canvas tools with glass panels over a scenic or abstract background.

Key traits:

- full-bleed background (scenic default, theme-switchable)
- dark translucent floating panels
- heavy border radius (16 to 20px)
- thin 1px borders at white/10 opacity
- minimal chrome, no traditional enterprise sidebar
- bottom command palette
- left vertical tool rail

## Layout

```
┌─────────────────────────────────────────────────────────┐
│  [workspace pill]              [theme] [settings] [?]   │
│                                                         │
│  ┌──┐   ┌─────────────────────────────────┐  ┌───────┐ │
│  │T │   │                                 │  │ Risk  │ │
│  │o │   │         Signal Canvas           │  │ Review│ │
│  │o │   │    (nodes, links, clusters)    │  │ Panel │ │
│  │l │   │                                 │  │       │ │
│  │  │   └─────────────────────────────────┘  └───────┘ │
│  └──┘                                                   │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Try "scan @handle for grooming signals in pt-BR" ⌘K│  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Tool rail (left)

| Icon | Tool | Action |
|------|------|--------|
| Cursor | Select | Inspect nodes on canvas |
| Scan | Scan | Run OSINT on handle, keyword, or URL |
| Watch | Watch | Pin selector to watch dock |
| Link | Correlate | Expand graph from selected node |
| Brief | Brief | Open export preview |
| Export | Export | Generate review packet |

Active tool uses orange accent (`#E87B35` or similar).

## Panels

### Top pill

- workspace name
- active case
- theme dropdown (Default, Outrun, Night Ops)
- settings
- feedback (optional, demo only)

### Center canvas

- graph of accounts, keywords, platforms, risk clusters
- nodes pulse when new signal arrives
- click node to open intel strip

### Right glass panel: Risk Review

- risk score (informational, not autonomous enforcement)
- grooming indicators
- escalation timeline
- off-platform migration notes
- languages detected
- **Human review required** badge always visible

### Bottom command bar

- natural language input
- suggested commands on empty state
- `⌘K` opens command palette

Example prompts:

- `scan @demo_user pt-BR`
- `watch keyword "manda foto"`
- `correlate linked accounts`
- `generate brief for NGO review`
- `switch to outrun theme`

## Design tokens

```css
--glass-bg: rgba(12, 14, 18, 0.55);
--glass-border: rgba(255, 255, 255, 0.10);
--glass-blur: 24px;
--accent: #E87B35;
--text-primary: #F5F7FB;
--text-muted: rgba(245, 247, 251, 0.62);
--radius-panel: 18px;
--radius-pill: 999px;
```

## Typography

- UI: system sans or Geist
- signals, handles, hashes: monospace
- brief export: serif optional for document feel

## Motion

- panels fade/slide in (200 to 300ms)
- new canvas nodes scale in subtly
- risk score updates with short number tween
- no heavy animation, keep it professional

## Themes

1. **Default** — scenic lake/mountain background (reference screenshot mood)
2. **Outrun** — dark neon gradient, synth aesthetic for demo flair
3. **Night Ops** — near-black, minimal, institutional
