---
name: signal-canvas-scan
description: OSINT scan for Signal Canvas — returns graph nodes, intel hits, and risk metadata as JSON
version: 0.1.0
platforms: [macos, linux]
metadata:
  hermes:
    tags: [osint, signal-canvas, scan, hackathon]
    category: signal-canvas
---

# Signal Canvas Scan

## When to Use
- User invokes `/signal-canvas-scan @handle [context]`
- Signal Canvas desktop app requests a scan operation
- Trigger: scan, load case, OSINT, grooming signals

## Procedure
1. Parse handle and context from input (default demo: `@demo_user_sp`, pt-BR grooming)
2. If live OSINT unavailable, use demo fixture data for São Paulo scenario
3. Optionally use Stripe Link skill to pay for enrichment APIs (user must approve)
4. Return **only** a fenced JSON block matching Signal Canvas schema:

```json
{
  "workspaceName": "Stratir Review Desk",
  "caseName": "Adolescent Digital Risk · São Paulo Demo",
  "handle": "@demo_user_sp",
  "nodes": [],
  "edges": [],
  "intel": [],
  "riskReview": {},
  "brief": {}
}
```

## Rules
- Always include `"Human review required"` in risk summary
- Never claim certified child-safety enforcement
- Institutional review console only
