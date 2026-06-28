import type { AuditEntry, InvestigationSession } from "../store/types";

export type AuditAction =
  | "case.created"
  | "telegram.joined"
  | "telegram.monitor.start"
  | "telegram.monitor.stop"
  | "telegram.history"
  | "stream.ingested"
  | "graph.node.added"
  | "graph.edge.added"
  | "graph.node.removed"
  | "graph.scan"
  | "graph.correlate"
  | "brief.generated"
  | "brief.exported"
  | "hermes.chat"
  | "settings.saved";

export function appendAudit(
  session: InvestigationSession,
  entry: {
    action: AuditAction;
    summary: string;
    actor?: string;
    meta?: Record<string, string>;
  },
): InvestigationSession {
  const row: AuditEntry = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    action: entry.action,
    summary: entry.summary,
    actor: entry.actor ?? "analyst",
    meta: entry.meta,
  };
  const prior = session.auditLog ?? [];
  return { ...session, auditLog: [row, ...prior].slice(0, 500) };
}
