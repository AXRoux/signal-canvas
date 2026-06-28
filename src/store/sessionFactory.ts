import type { InvestigationSession, TelegramSessionState } from "./types";

export function createDefaultTelegramState(): TelegramSessionState {
  return {
    authorized: false,
    username: null,
    monitoringActive: false,
    monitoredChats: [],
  };
}

export function createDefaultMonitorStreams() {
  return { telegram: [], discord: [], openweb: [] };
}

export function createEmptySession(title: string): InvestigationSession {
  const now = new Date().toISOString();
  const name = title.trim();
  return {
    id: crypto.randomUUID(),
    title: name,
    createdAt: now,
    updatedAt: now,
    pinned: false,
    archived: false,
    caseName: name,
    workspaceName: "Stratir Review Desk",
    activeTool: "select",
    nodes: [],
    edges: [],
    selectedNodeId: null,
    intelHits: [],
    riskReview: null,
    briefData: null,
    scanLoaded: false,
    correlated: false,
    intelStripOpen: false,
    commandLog: [],
    watchlist: [],
    chatMessages: [],
    agentSource: null,
    scanTarget: "",
    scanContext: "",
    agentPresences: [],
    pendingOps: [],
    activePresenceId: null,
    hermesSessionId: null,
    telegram: createDefaultTelegramState(),
    monitorStreams: createDefaultMonitorStreams(),
    activeMonitorPlatform: "telegram",
    auditLog: [],
  };
}

export function touchSession(session: InvestigationSession): InvestigationSession {
  return { ...session, updatedAt: new Date().toISOString() };
}

/** Repair sessions loaded from older localStorage shapes so views never crash. */
export function normalizeSession(session: InvestigationSession): InvestigationSession {
  const nodes = (session.nodes ?? []).map((node, index) => ({
    ...node,
    position: node.position ?? { x: 80 + index * 32, y: 80 + index * 24 },
    data: node.data ?? { label: node.id },
  }));

  return {
    ...createEmptySession(session.title || "Case"),
    ...session,
    nodes,
    edges: session.edges ?? [],
    selectedNodeId: session.selectedNodeId ?? null,
    intelHits: session.intelHits ?? [],
    commandLog: session.commandLog ?? [],
    chatMessages: session.chatMessages ?? [],
    watchlist: session.watchlist ?? [],
    auditLog: session.auditLog ?? [],
    agentPresences: session.agentPresences ?? [],
    pendingOps: session.pendingOps ?? [],
    monitorStreams: session.monitorStreams ?? createDefaultMonitorStreams(),
    telegram: session.telegram ?? createDefaultTelegramState(),
    scanTarget: session.scanTarget ?? "",
    scanContext: session.scanContext ?? "",
    activeMonitorPlatform: session.activeMonitorPlatform ?? "telegram",
    activePresenceId: session.activePresenceId ?? null,
    hermesSessionId: session.hermesSessionId ?? null,
    archived: session.archived ?? false,
    pinned: session.pinned ?? false,
    agentSource: session.agentSource === "hermes" ? "hermes" : null,
  };
}
