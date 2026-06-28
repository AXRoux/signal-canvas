import type { Node } from "@xyflow/react";
import type { TelegramNodeData } from "./telegramNodeData";
import type { AccountNodeData } from "../canvas/nodes/AccountNode";
import type { KeywordNodeData } from "../canvas/nodes/KeywordNode";
import type { PlatformNodeData } from "../canvas/nodes/PlatformNode";

export type GraphNodeKind = "account" | "keyword" | "platform" | "telegram" | "unknown";

export interface NodeDetailView {
  kind: GraphNodeKind;
  title: string;
  subtitle?: string;
  body?: string;
  meta: { label: string; value: string }[];
  signalTags: string[];
  risk?: "low" | "medium" | "high";
  observedAt?: string;
}

export function getNodeKind(node: Node): GraphNodeKind {
  const type = node.type ?? "unknown";
  if (type === "account" || type === "keyword" || type === "platform" || type === "telegram") {
    return type;
  }
  return "unknown";
}

export function buildNodeDetail(node: Node): NodeDetailView {
  const kind = getNodeKind(node);

  if (kind === "telegram") {
    const d = node.data as TelegramNodeData;
    return {
      kind,
      title: d.label,
      subtitle: d.chatTitle,
      body: d.fullText || d.snippet,
      signalTags: d.signalTags ?? [],
      risk: d.risk,
      observedAt: d.observedAt,
      meta: [
        { label: "Platform", value: "Telegram" },
        { label: "Chat", value: d.chatTitle },
        ...(d.senderName ? [{ label: "Sender", value: d.senderName }] : []),
        ...(d.senderId ? [{ label: "Sender ID", value: d.senderId }] : []),
      ],
    };
  }

  if (kind === "account") {
    const d = node.data as AccountNodeData;
    return {
      kind,
      title: d.label,
      subtitle: d.platform,
      signalTags: [],
      risk: d.risk,
      meta: [
        { label: "Platform", value: d.platform },
        { label: "Signals", value: String(d.signals) },
        ...(d.isPrimary ? [{ label: "Role", value: "Primary subject" }] : []),
      ],
    };
  }

  if (kind === "keyword") {
    const d = node.data as KeywordNodeData;
    return {
      kind,
      title: d.label,
      signalTags: d.keywords ?? [],
      meta: [{ label: "Occurrences", value: String(d.count) }],
    };
  }

  if (kind === "platform") {
    const d = node.data as PlatformNodeData;
    return {
      kind,
      title: d.label,
      subtitle: d.link,
      signalTags: [],
      meta: [
        { label: "Link", value: d.link },
        ...(d.migration ? [{ label: "Type", value: "Off-platform migration" }] : []),
      ],
    };
  }

  const label = (node.data as { label?: string }).label ?? node.id;
  return {
    kind: "unknown",
    title: label,
    signalTags: [],
    meta: [{ label: "Node ID", value: node.id }],
  };
}

export function extractLinks(text: string): string[] {
  const matches = text.match(/(?:https?:\/\/|t\.me\/)[^\s]+/gi) ?? [];
  return [...new Set(matches.map((m) => m.replace(/[),.;]+$/, "")))];
}
