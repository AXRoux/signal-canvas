import type { Node } from "@xyflow/react";
import type { InvestigationSession } from "../store/types";
import { telegramNodeFromEvent } from "./telegramGraphOps";

function adaptLegacyNode(node: Node, index: number): Node {
  const d = (node.data ?? {}) as Record<string, unknown>;
  const label = String(d.label ?? node.id);
  const risk = (d.risk as "low" | "medium" | "high" | undefined) ?? "medium";
  const signals = Number(d.signals ?? d.count ?? 0);
  const observedAt =
    typeof d.observedAt === "string"
      ? d.observedAt
      : new Date(Date.now() - index * 3600_000).toISOString();

  if (node.type === "keyword") {
    const keywords = (d.keywords as string[] | undefined) ?? [];
    return {
      ...node,
      type: "telegram",
      data: {
        label,
        platform: "telegram",
        chatTitle: "Keyword cluster",
        snippet: keywords.slice(0, 2).join(" · ") || label,
        fullText: keywords.join(", ") || label,
        signalTags: keywords,
        signals: signals || keywords.length,
        risk,
        observedAt,
      },
    };
  }

  if (node.type === "platform") {
    const link = String(d.link ?? d.label ?? "");
    return {
      ...node,
      type: "telegram",
      data: {
        label,
        platform: "telegram",
        chatTitle: String(d.migration ? "Off-platform migration" : "Platform"),
        snippet: link,
        fullText: link,
        signalTags: d.migration ? ["migration"] : [],
        signals: signals || 1,
        risk: d.migration ? "high" : risk,
        observedAt,
      },
    };
  }

  // account + unknown
  return {
    ...node,
    type: "telegram",
    data: {
      label,
      platform: "telegram",
      chatTitle: String(d.platform ?? "Signal"),
      snippet: `${d.platform ?? "Account"} · ${signals} signals`,
      fullText: label,
      signalTags: [],
      signals,
      risk,
      observedAt,
    },
  };
}

/** Nodes rendered on Chronology / Entity Board — includes Telegram, stream, and adapted legacy nodes. */
export function graphDisplayNodes(session: InvestigationSession): Node[] {
  const telegram = session.nodes.filter((n) => n.type === "telegram");
  if (telegram.length > 0) return telegram;

  const streamNodes: Node[] = [];
  const events = session.monitorStreams?.telegram ?? [];
  for (const event of events) {
    if (event.graphNodeId) continue;
    streamNodes.push(telegramNodeFromEvent(event, streamNodes.length));
  }
  if (streamNodes.length > 0) return streamNodes;

  if (session.nodes.length > 0) {
    return session.nodes.map((node, index) => adaptLegacyNode(node, index));
  }

  return [];
}

export function edgesForDisplayNodes(
  edges: InvestigationSession["edges"],
  nodeIds: Set<string>,
): InvestigationSession["edges"] {
  return edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
}
