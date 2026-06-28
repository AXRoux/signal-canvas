---
name: signal-canvas-correlate
description: Expand Signal Canvas graph with correlated linked accounts
version: 0.1.0
platforms: [macos, linux]
metadata:
  hermes:
    tags: [osint, signal-canvas, correlate]
    category: signal-canvas
---

# Signal Canvas Correlate

## When to Use
- User invokes `/signal-canvas-correlate node_id=<id>`
- After a scan, when analyst selects a node and requests correlation

## Procedure
1. Parse `node_id` from input
2. Find linked accounts across platforms (Instagram alt, Discord, backup accounts)
3. Return **only** JSON:

```json
{
  "correlateNodes": [],
  "correlateEdges": []
}
```

Use dashed edge style hints in edge labels: `"correlated"`.
