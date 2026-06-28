export interface ChatContext {
  investigationSessionId?: string;
  caseName?: string;
  scanTarget?: string;
  selectedNodeId?: string | null;
  nodeCount?: number;
  edgeCount?: number;
  watchlist?: string[];
  recentStreamCount?: number;
}

export function buildHermesChatPrompt(
  message: string,
  context: ChatContext,
  language: string,
): string {
  const ctx = [
    context.caseName ? `Case: ${context.caseName}` : null,
    context.scanTarget ? `Scan target: ${context.scanTarget}` : null,
    context.selectedNodeId ? `Selected node: ${context.selectedNodeId}` : null,
    `Graph: ${context.nodeCount ?? 0} nodes, ${context.edgeCount ?? 0} edges`,
    context.watchlist?.length ? `Watchlist: ${context.watchlist.join(", ")}` : null,
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
- Do NOT run scan, correlate, or brief skills unless the analyst explicitly asks.
- If you propose graph changes, append ONE fenced block at the very end:

\`\`\`canvas_actions
{"type":"canvas_actions","agent_message":"short summary","actions":[...]}
\`\`\`
${locale}

Analyst:
${message.trim()}`;
}

export function normalizeChatDisplay(raw: string): {
  display: string;
  canvasActions: Record<string, unknown> | null;
} {
  let text = raw.trim();
  let canvasActions: Record<string, unknown> | null = null;

  const fence = /```canvas_actions\s*([\s\S]*?)```/i;
  const match = text.match(fence);
  if (match) {
    try {
      canvasActions = JSON.parse(match[1].trim()) as Record<string, unknown>;
    } catch {
      /* ignore */
    }
    text = text.replace(fence, "").trim();
  }

  if (!canvasActions) {
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      if (parsed.type === "canvas_actions" || parsed.actions) {
        canvasActions = parsed;
        text = String(parsed.agent_message ?? "").trim();
      }
    } catch {
      /* not json */
    }
  }

  if (canvasActions && typeof canvasActions.agent_message === "string" && !text) {
    text = canvasActions.agent_message;
  }

  return { display: text || raw.trim(), canvasActions };
}

/** Fast conversational fallback via NVIDIA NIM when Hermes gateway is unreachable. */
export async function nimFastChat(
  apiKey: string,
  endpoint: string,
  prompt: string,
): Promise<string> {
  const base = endpoint.replace(/\/$/, "");
  const model = "meta/llama-3.1-8b-instruct";
  const resp = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 512,
      temperature: 0.4,
      stream: false,
    }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`NVIDIA NIM ${resp.status}: ${t.slice(0, 200)}`);
  }
  const data = (await resp.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() ?? "No response from model.";
}
