import type { Node } from "@xyflow/react";

export interface TelegramNodeData extends Record<string, unknown> {
  label: string;
  platform: "telegram";
  chatTitle: string;
  chatId?: string;
  senderId?: string | null;
  senderName?: string | null;
  snippet: string;
  fullText: string;
  signalTags: string[];
  signals: number;
  risk: "low" | "medium" | "high";
  observedAt: string;
  streamEventId?: string;
  isNew?: boolean;
}

export function asTelegramData(node: Node): TelegramNodeData {
  const raw = (node.data ?? {}) as Partial<TelegramNodeData>;
  return {
    label: raw.label ?? node.id,
    platform: "telegram",
    chatTitle: raw.chatTitle ?? "Telegram",
    chatId: raw.chatId,
    senderId: raw.senderId ?? null,
    senderName: raw.senderName ?? null,
    snippet: raw.snippet ?? "",
    fullText: raw.fullText ?? raw.snippet ?? "",
    signalTags: raw.signalTags ?? [],
    signals: raw.signals ?? 0,
    risk: raw.risk ?? "medium",
    observedAt: raw.observedAt ?? new Date().toISOString(),
    streamEventId: raw.streamEventId,
    isNew: raw.isNew,
  };
}

export function observedAtMs(node: Node): number {
  const raw = asTelegramData(node).observedAt;
  if (!raw) return 0;
  const t = Date.parse(raw);
  return Number.isNaN(t) ? 0 : t;
}

export function formatEventDate(iso: string): { date: string; time: string; full: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { date: "Unknown", time: "—", full: "Unknown date" };
  }
  return {
    date: d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
    full: d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export function chatKey(node: Node): string {
  const d = asTelegramData(node);
  return d.chatId ?? d.chatTitle ?? "unknown";
}

export function snippetFromTelegramData(data: {
  snippet?: string;
  fullText?: string;
  label?: string;
}): string {
  if (data.snippet?.trim()) return data.snippet;
  if (data.fullText?.trim()) return data.fullText.slice(0, 120);
  return data.label?.trim() || "—";
}

export function telegramNodesOnly<T extends { type?: string }>(nodes: T[]): T[] {
  return nodes.filter((n) => n.type === "telegram");
}
