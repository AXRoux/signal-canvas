---
name: signal-canvas-brief
description: Generate institutional review brief for Signal Canvas export
version: 0.1.0
platforms: [macos, linux]
metadata:
  hermes:
    tags: [signal-canvas, brief, ngo]
    category: signal-canvas
---

# Signal Canvas Brief

## When to Use
- User requests NGO/institutional review brief
- `/signal-canvas-brief` after scan completes

## Procedure
1. Summarize case from session context (Nemotron reasoning)
2. Structure sections: executive summary, risk indicators, timeline, linked accounts, recommendations
3. Include reviewer disclaimer: no autonomous enforcement
4. Return brief JSON inside `brief` key matching Signal Canvas BriefData schema
