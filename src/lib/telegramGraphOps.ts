import type { Edge, Node } from "@xyflow/react";
import type { InvestigationSession, IntelHit, StreamEvent } from "../store/types";

export type EdgeRelation = "observed" | "correlated" | "migration" | "cross-platform" | "pending";

export function edgeRelationStyle(relation: EdgeRelation): {
  stroke: string;
  strokeDasharray?: string;
  animated?: boolean;
} {
  switch (relation) {
    case "observed":
      return { stroke: "var(--stratir-signal)", strokeDasharray: "6 5", animated: true };
    case "correlated":
      return { stroke: "var(--color-accent)", strokeDasharray: "8 4", animated: true };
    case "migration":
      return { stroke: "var(--stratir-impact)", strokeDasharray: "6 4", animated: true };
    case "cross-platform":
      return { stroke: "var(--color-border-strong)", strokeDasharray: "4 4", animated: true };
    case "pending":
      return { stroke: "var(--color-text-tertiary)", strokeDasharray: "2 6", animated: true };
  }
}

function nodeData(node: Node) {
  return node.data as {
    senderId?: string | null;
    chatId?: string;
    signalTags?: string[];
    fullText?: string;
    label?: string;
  };
}

export function correlateTelegramNodes(
  session: InvestigationSession,
  selectedNodeId: string,
): { edges: Edge[]; intel: IntelHit[] } {
  const selected = session.nodes.find((n) => n.id === selectedNodeId);
  if (!selected) return { edges: [], intel: [] };

  const sel = nodeData(selected);
  const existing = new Set(session.edges.map((e) => `${e.source}|${e.target}|${e.target}|${e.source}`));
  const edges: Edge[] = [];
  const intel: IntelHit[] = [];

  for (const node of session.nodes) {
    if (node.id === selectedNodeId) continue;
    const d = nodeData(node);
    const reasons: string[] = [];

    if (sel.senderId && d.senderId && sel.senderId === d.senderId) reasons.push("same sender");
    if (sel.chatId && d.chatId && sel.chatId === d.chatId) reasons.push("same chat");
    const sharedTags = (sel.signalTags ?? []).filter((t) => (d.signalTags ?? []).includes(t));
    if (sharedTags.length) reasons.push(`signals: ${sharedTags.slice(0, 2).join(", ")}`);

    if (reasons.length === 0) continue;

    const pairKey = `${selectedNodeId}|${node.id}`;
    if (existing.has(pairKey) || existing.has(`${node.id}|${selectedNodeId}`)) continue;

    const relation: EdgeRelation = reasons[0].startsWith("signals") ? "correlated" : "observed";
    const style = edgeRelationStyle(relation);
    edges.push({
      id: `corr-${selectedNodeId}-${node.id}`,
      source: selectedNodeId,
      target: node.id,
      type: "signal",
      label: reasons[0],
      animated: style.animated,
      data: { relationType: relation },
      style: { stroke: style.stroke, strokeDasharray: style.strokeDasharray },
    });

    intel.push({
      id: crypto.randomUUID(),
      source: "Graph correlate",
      platform: "telegram",
      snippet: `${sel.label ?? selectedNodeId} ↔ ${d.label ?? node.id}: ${reasons.join("; ")}`,
      timestamp: new Date().toISOString(),
      confidence: sharedTags.length ? "high" : "medium",
    });
  }

  return { edges, intel };
}

export function isTelegramNode(node: Node): boolean {
  return node.type === "telegram" || String(node.id).startsWith("tg-");
}

export function purgeDemoGraph(session: InvestigationSession): InvestigationSession {
  const nodesIn = session.nodes ?? [];
  const edgesIn = session.edges ?? [];
  const demoIds = new Set([
    "account-main",
    "account-alt",
    "platform-telegram",
    "keyword-cluster",
    "platform-tiktok",
    "account-linked-1",
    "account-linked-2",
  ]);

  const nodes = nodesIn.filter(
    (n) => n.type === "telegram" || (!demoIds.has(n.id) && n.type !== "account" && n.type !== "keyword" && n.type !== "platform"),
  );
  const telegramOnly = nodesIn.some((n) => n.type === "telegram")
    ? nodesIn.filter((n) => n.type === "telegram")
    : nodes.filter((n) => !demoIds.has(n.id));

  const ids = new Set(telegramOnly.map((n) => n.id));
  const edges = edgesIn.filter((e) => ids.has(e.source) && ids.has(e.target));
  const intelHits = (session.intelHits ?? []).filter(
    (h) => h.platform === "telegram" || !h.source?.includes("Instagram"),
  );

  return {
    ...session,
    nodes: telegramOnly,
    edges,
    intelHits,
    scanLoaded: telegramOnly.length > 0,
    agentPresences: (session.agentPresences ?? []).filter(
      (p) => !p.relatedNodeIds?.some((id) => demoIds.has(id)),
    ),
    riskReview: telegramOnly.length ? session.riskReview : null,
  };
}

export function flaggedStreamEvents(events: StreamEvent[]): StreamEvent[] {
  return events.filter((e) => e.signals.length > 0 && !e.graphNodeId);
}

export function telegramNodeFromEvent(event: StreamEvent, layoutIndex: number): Node {
  const nodeId = `tg-${event.id}`;
  const risk =
    event.signals.length >= 2 ? ("high" as const) : event.signals.length ? ("medium" as const) : ("low" as const);
  const label = event.senderName ?? event.chatTitle;
  return {
    id: nodeId,
    type: "telegram",
    position: { x: 180 + layoutIndex * 24, y: 120 + (layoutIndex % 5) * 72 },
    data: {
      label,
      platform: "telegram",
      chatTitle: event.chatTitle,
      chatId: event.chatId,
      senderId: event.senderId,
      senderName: event.senderName,
      snippet: event.text.slice(0, 120),
      fullText: event.text,
      signalTags: event.signals,
      signals: event.signals.length,
      risk,
      observedAt: event.observedAt,
      streamEventId: event.id,
      isNew: true,
    },
  };
}

export function nodeMatchesWatchlist(node: Node, watchlist: string[]): boolean {
  if (watchlist.length === 0) return false;
  const d = nodeData(node);
  const hay = `${d.fullText ?? ""} ${d.label ?? ""} ${(d.signalTags ?? []).join(" ")}`.toLowerCase();
  return watchlist.some((kw) => hay.includes(kw.trim().toLowerCase()));
}
