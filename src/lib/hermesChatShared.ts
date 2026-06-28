import type { HermesChatContext } from "./hermesChatClient";

/** Build a concise analyst prompt — natural language in, natural language out. */
export function buildHermesChatPrompt(message: string, context: HermesChatContext, language: "en" | "pt"): string {
  const ctx = [
    `Case: ${context.caseName}`,
    context.scanTarget ? `Scan target: ${context.scanTarget}` : null,
    context.selectedNodeId ? `Selected node: ${context.selectedNodeId}` : null,
    `Graph: ${context.nodeCount} nodes, ${context.edgeCount} edges`,
    context.watchlist.length ? `Watchlist: ${context.watchlist.join(", ")}` : null,
    context.recentStreamCount ? `Recent Telegram messages: ${context.recentStreamCount}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const locale = language === "pt" ? "Reply in Portuguese (Brazil)." : "Reply in English.";

  return `You are Hermes, the analyst on Signal Canvas — an institutional review desk for human-in-the-loop investigations.

Session context:
${ctx}

Rules:
- Reply in plain conversational prose only. No JSON, no markdown code fences, no bullet dumps unless the analyst asks.
- Be concise, warm, and precise. Understand nuance and implicit intent.
- Do NOT run scan, correlate, or brief skills unless the analyst explicitly asks (e.g. "run scan", "/scan @handle", "correlate").
- When the analyst asks a question, answer it directly from context.
- If you propose graph changes (new nodes, links, intel), append ONE fenced block at the very end:

\`\`\`canvas_actions
{"type":"canvas_actions","agent_message":"short summary for the analyst","actions":[...]}
\`\`\`

Use canvas_actions ops: place_node, connect, annotate, intel_hit, agent_attach. Works for both STRATIR and flowsint graph layouts.
${locale}

Analyst:
${message.trim()}`;
}

export interface CanvasActionsBlock {
  type?: string;
  agent_message?: string;
  actions?: unknown[];
}

/** Strip canvas_actions fence and raw JSON from user-visible chat text. */
export function normalizeChatDisplay(raw: string): { display: string; canvasActions: CanvasActionsBlock | null } {
  let text = raw.trim();
  let canvasActions: CanvasActionsBlock | null = null;

  const fence = /```canvas_actions\s*([\s\S]*?)```/i;
  const match = text.match(fence);
  if (match) {
    try {
      canvasActions = JSON.parse(match[1].trim()) as CanvasActionsBlock;
    } catch {
      /* ignore parse errors */
    }
    text = text.replace(fence, "").trim();
  }

  if (!canvasActions) {
    try {
      const parsed = JSON.parse(text) as CanvasActionsBlock;
      if (parsed.type === "canvas_actions" || parsed.actions) {
        canvasActions = parsed;
        text = (parsed.agent_message ?? "").trim();
      }
    } catch {
      /* not json */
    }
  }

  if (canvasActions?.agent_message && !text) {
    text = canvasActions.agent_message;
  }

  // Drop accidental JSON blobs at start/end
  text = text.replace(/^```json[\s\S]*?```\s*/i, "").trim();
  text = text.replace(/^\{[\s\S]*\}$/m, (block) => {
    try {
      const p = JSON.parse(block);
      if (p.agent_message) return p.agent_message;
      if (p.message) return p.message;
    } catch {
      /* keep */
    }
    return block;
  });

  return { display: text || raw.trim(), canvasActions };
}
