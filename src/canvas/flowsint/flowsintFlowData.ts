import type { Edge, Node } from "@xyflow/react";
import type { InvestigationSession } from "../../store/types";
import { flaggedStreamEvents, telegramNodeFromEvent } from "../../lib/telegramGraphOps";
import { ensureFlowPosition } from "../../lib/flowsintLayout";
import { asTelegramData, snippetFromTelegramData } from "../../lib/telegramNodeData";
import { nodeTypeColor } from "./flowsintColors";

/** Nodes shown on the Flowsint canvas — keeps store types for coloring and position sync. */
export function flowsintDisplayNodes(session: InvestigationSession): Node[] {
  const telegram = session.nodes.filter((n) => n.type === "telegram");
  if (telegram.length > 0) return telegram;

  const streamNodes: Node[] = [];
  for (const event of flaggedStreamEvents(session.monitorStreams?.telegram ?? [])) {
    streamNodes.push(telegramNodeFromEvent(event, streamNodes.length));
  }
  if (streamNodes.length > 0) return streamNodes;

  return session.nodes;
}

export function flowsintTypeLabel(node: Node): string {
  if (node.type === "telegram") {
    const chat = asTelegramData(node).chatTitle;
    return chat && chat !== "Telegram" ? chat : "Telegram";
  }
  if (node.type === "keyword") return "Keyword cluster";
  if (node.type === "platform") return "Platform";
  if (node.type === "account") return String((node.data as { platform?: string })?.platform ?? "Account");
  return node.type ?? "Signal";
}

export function flowsintTypeKey(node: Node): string {
  return node.type ?? "telegram";
}

export function flowsintNodeSummary(node: Node): string {
  if (node.type === "telegram") return snippetFromTelegramData(asTelegramData(node));
  const d = (node.data ?? {}) as Record<string, unknown>;
  if (node.type === "keyword") {
    const keywords = (d.keywords as string[] | undefined) ?? [];
    return keywords.slice(0, 2).join(" · ") || String(d.label ?? "");
  }
  if (node.type === "platform") return String(d.link ?? d.label ?? "");
  return `${d.platform ?? "Account"} · ${d.signals ?? 0} signals`;
}

export function toFlowsintFlowNodes(
  nodes: Node[],
  options: {
    selectionIds: Set<string>;
  },
): Node[] {
  return nodes.map((node, index) => {
    const typeKey = flowsintTypeKey(node);
    const position = ensureFlowPosition(node, index);

    return {
      ...node,
      type: "flowsintEntity",
      position,
      selected: options.selectionIds.has(node.id),
      data: {
        ...(node.data ?? {}),
        label: String((node.data as { label?: string })?.label ?? node.id),
        flowsintType: typeKey,
        flowsintTypeLabel: flowsintTypeLabel(node),
        flowsintSummary: flowsintNodeSummary(node),
        flowsintColor: nodeTypeColor(typeKey),
      },
    };
  });
}

export function toFlowsintFlowEdges(
  edges: InvestigationSession["edges"],
  nodeIds: Set<string>,
): Edge[] {
  return edges
    .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
    .map((edge) => ({
      ...edge,
      type: "signal",
      animated: edge.data?.relationType === "correlated" || edge.animated,
    }));
}
