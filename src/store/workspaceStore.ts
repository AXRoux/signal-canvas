import { create } from "zustand";
import {
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
  type Connection,
} from "@xyflow/react";
import { agentCorrelate, agentScan, checkHermesHealth, ensureHermesGateway, fetchIntegrationStatus, loadIntegrationConfigFromDisk, saveIntegrationConfigToDisk } from "../lib/agentClient";
import { applyCanvasActionImmediate, canvasActionsToOps } from "../lib/canvasActions";
import { detectGroomingSignals } from "../lib/groomingLexicon";
import { hermesSessionChat } from "../lib/hermesChatClient";
import {
  telegramFetchHistory,
  telegramJoinChat,
  telegramStartMonitor,
  telegramStopMonitor,
} from "../lib/telegramClient";
import { runAgentCorrelateStages, runAgentScanStages } from "../lib/agentStages";
import { runNodeHermesTask } from "../lib/nodeHermesTasks";
import { isExplicitCommand } from "../lib/chatRouting";
import { isWeb } from "../lib/platform";
import { layoutGraphEdges, layoutGraphNodes } from "../lib/graphLayout";
import { correlateTelegramNodes, flaggedStreamEvents, isTelegramNode, telegramNodeFromEvent } from "../lib/telegramGraphOps";
import { layoutFlowsintNodes, nodesNeedFlowsintLayout } from "../lib/flowsintLayout";
import { normalizeGraphStyleId, type GraphStyleId } from "../lib/graphStyles";
import { appendAudit } from "../lib/auditLog";
import { briefFromSession } from "../lib/caseBrief";
import { saveIntegrationsWeb, fetchVaultWeb, saveVaultWeb } from "../lib/webApi";
import { loadIntegrationConfig, persistIntegrationConfig } from "./integrationConfig";
import { secureVaultLoad, secureVaultSave, type WorkspaceVaultPayload } from "../lib/secureClient";
import {
  decryptSessionsFromStorage,
  encryptSessionsForStorage,
  isWebVaultUnlocked,
  loadEncryptedVaultLocal,
  saveEncryptedVaultLocal,
} from "../lib/vaultCrypto";
import { createDefaultMonitorStreams, createDefaultTelegramState, createEmptySession, normalizeSession, touchSession } from "./sessionFactory";
import { getTranslations, t, type LanguageId } from "../i18n";
import type {
  AgentScanResult,
  InvestigationSession,
  StreamEvent,
  ThemeId,
  WorkspaceState,
  CommandResult,
  ToolId,
} from "./types";

const SETTINGS_KEY = "signal-canvas-settings";
const SESSIONS_KEY = "signal-canvas-sessions";
const ACTIVE_SESSION_KEY = "signal-canvas-active-session";

interface WorkspaceVault {
  sessions: Record<string, InvestigationSession>;
  activeSessionId: string | null;
}

function parseVaultPayload(raw: WorkspaceVaultPayload | Record<string, unknown>): WorkspaceVault {
  if (raw && typeof raw === "object" && "sessions" in raw) {
    const vault = raw as WorkspaceVaultPayload;
    return {
      sessions: normalizeAllSessions(vault.sessions as Record<string, InvestigationSession>),
      activeSessionId: vault.activeSessionId ?? null,
    };
  }
  return {
    sessions: normalizeAllSessions((raw ?? {}) as Record<string, InvestigationSession>),
    activeSessionId: null,
  };
}

function resolveActiveSessionId(
  sessions: Record<string, InvestigationSession>,
  preferred: string | null,
): string | null {
  if (preferred && sessions[preferred]) return preferred;
  const first = Object.values(sessions).find((s) => !s.archived);
  return first?.id ?? null;
}

interface PersistedSettings {
  theme: ThemeId;
  language: LanguageId;
  graphStyle?: GraphStyleId;
  sidebarCollapsed?: boolean;
}

function loadSettings(): PersistedSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedSettings;
      return {
        ...parsed,
        graphStyle: normalizeGraphStyleId(parsed.graphStyle),
      };
    }
  } catch {
    /* defaults */
  }
  return { theme: "stratir", language: "en" };
}

function persistSettings(
  theme: ThemeId,
  language: LanguageId,
  graphStyle?: GraphStyleId,
  sidebarCollapsed?: boolean,
) {
  const current = loadSettings();
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({
      theme,
      language,
      graphStyle: graphStyle ?? normalizeGraphStyleId(current.graphStyle),
      sidebarCollapsed: sidebarCollapsed ?? current.sidebarCollapsed ?? false,
    }),
  );
}

function applyGraphLayout(session: InvestigationSession, graphStyle: GraphStyleId): InvestigationSession {
  if (graphStyle !== "stratir") return session;
  const nodes = layoutGraphNodes(session.nodes);
  const edges = layoutGraphEdges(session.edges);
  return { ...session, nodes, edges };
}

async function runTelegramGraphScan(
  get: () => WorkspaceState,
  set: (partial: Partial<WorkspaceState> | ((state: WorkspaceState) => Partial<WorkspaceState>)) => void,
): Promise<CommandResult> {
  const { language, integrationConfig, graphStyle } = get();
  const session = getActiveSession(get());
  if (!session) return { message: "Create a session first.", success: false };

  const chats = session.telegram.monitoredChats;
  if (chats.length === 0) {
    return { message: t(language, "telegram.noChats"), success: false };
  }

  set({ agentRunning: true });
  try {
    const ingested: StreamEvent[] = [];
    for (const chat of chats) {
      try {
        const result = await telegramFetchHistory(integrationConfig, chat.id, 50);
        for (const msg of result.messages ?? []) {
          ingested.push({
            ...msg,
            platform: "telegram",
            signals: msg.signals?.length ? msg.signals : detectGroomingSignals(msg.text),
            graphNodeId: null,
          });
        }
      } catch {
        /* skip chat on failure */
      }
    }

    let added = 0;
    updateActiveSession(get, set, (s) => {
      const streamById = new Map(s.monitorStreams.telegram.map((e) => [e.id, e]));
      for (const event of ingested) {
        streamById.set(event.id, { ...event, graphNodeId: streamById.get(event.id)?.graphNodeId ?? null });
      }
      const stream = [...streamById.values()].sort(
        (a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt),
      ).slice(0, 400);

      const existingNodeEvents = new Set(
        s.nodes
          .map((n) => (n.data as { streamEventId?: string }).streamEventId)
          .filter(Boolean),
      );
      const flagged = flaggedStreamEvents(stream);
      const newNodes = [...s.nodes];
      const updatedStream = stream.map((e) => ({ ...e }));

      for (const event of flagged) {
        if (existingNodeEvents.has(event.id)) continue;
        const node = telegramNodeFromEvent(event, newNodes.length);
        newNodes.push(node);
        existingNodeEvents.add(event.id);
        const idx = updatedStream.findIndex((e) => e.id === event.id);
        if (idx >= 0) updatedStream[idx] = { ...updatedStream[idx], graphNodeId: node.id };
        added += 1;
      }

      const intelHits = [...s.intelHits];
      for (const event of flagged.slice(0, 8)) {
        if (intelHits.some((h) => h.snippet.startsWith(event.text.slice(0, 40)))) continue;
        intelHits.unshift({
          id: crypto.randomUUID(),
          source: event.chatTitle,
          platform: "telegram",
          snippet: event.text.slice(0, 240),
          timestamp: event.observedAt,
          confidence: event.signals.length >= 2 ? "high" : "medium",
        });
      }

      let next = {
        ...appendAudit(s, {
          action: "graph.scan",
          summary: `Telegram scan: ${added} flagged message(s) mapped to graph`,
          meta: { added: String(added), chats: String(chats.length) },
        }),
        nodes: newNodes,
        monitorStreams: { ...s.monitorStreams, telegram: updatedStream },
        intelHits: intelHits.slice(0, 200),
        scanLoaded: newNodes.length > 0,
        activeTool: "scan" as ToolId,
        commandLog: logCommand(s.commandLog, t(language, "commands.scanCompleteTelegram", { count: String(added) })),
      };
      return applyGraphLayout(next, graphStyle);
    });

    return {
      message: t(language, "commands.scanCompleteTelegram", { count: String(added) }),
      success: true,
    };
  } finally {
    set({ agentRunning: false });
  }
}

function normalizeAllSessions(
  parsed: Record<string, InvestigationSession>,
): Record<string, InvestigationSession> {
  for (const id of Object.keys(parsed)) {
    parsed[id] = normalizeSession(parsed[id]);
    if (parsed[id].archived === undefined) parsed[id].archived = false;
    if (!parsed[id].auditLog) parsed[id].auditLog = [];
    if (!parsed[id].agentPresences) parsed[id].agentPresences = [];
    if (!parsed[id].pendingOps) parsed[id].pendingOps = [];
    if (parsed[id].activePresenceId === undefined) parsed[id].activePresenceId = null;
    if (parsed[id].hermesSessionId === undefined) parsed[id].hermesSessionId = null;
    if (!parsed[id].telegram) parsed[id].telegram = createDefaultTelegramState();
    if (!parsed[id].monitorStreams) parsed[id].monitorStreams = createDefaultMonitorStreams();
    if (!parsed[id].activeMonitorPlatform) parsed[id].activeMonitorPlatform = "telegram";
  }
  return parsed;
}

function loadSessionsFromLocalStorage(): Record<string, InvestigationSession> {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (raw) {
      return normalizeAllSessions(JSON.parse(raw) as Record<string, InvestigationSession>);
    }
  } catch {
    /* empty */
  }
  return {};
}

async function loadSessionsSecure(): Promise<WorkspaceVault> {
  if (isWeb) {
    if (!isWebVaultUnlocked()) {
      return { sessions: {}, activeSessionId: null };
    }

    const legacyRaw = localStorage.getItem(SESSIONS_KEY);
    if (legacyRaw) {
      try {
        const legacy = parseVaultPayload(JSON.parse(legacyRaw));
        return {
          sessions: legacy.sessions,
          activeSessionId: resolveActiveSessionId(
            legacy.sessions,
            localStorage.getItem(ACTIVE_SESSION_KEY),
          ),
        };
      } catch {
        /* fall through */
      }
    }

    const localCipher = loadEncryptedVaultLocal();
    let localVault: WorkspaceVault | null = null;
    if (localCipher) {
      try {
        const decrypted = await decryptSessionsFromStorage(localCipher);
        localVault = {
          sessions: normalizeAllSessions(decrypted.sessions),
          activeSessionId: decrypted.activeSessionId,
        };
      } catch {
        localVault = null;
      }
    }

    try {
      const remote = await fetchVaultWeb();
      if (remote.vaultCipher) {
        const decrypted = await decryptSessionsFromStorage(remote.vaultCipher);
        const remoteVault: WorkspaceVault = {
          sessions: normalizeAllSessions(decrypted.sessions),
          activeSessionId: decrypted.activeSessionId,
        };
        if (!localVault) return remoteVault;
        const remoteTime = remote.updatedAt ? Date.parse(remote.updatedAt) : 0;
        const localTime = localCipher ? Date.parse(localStorage.getItem("signal-canvas-vault-updated") ?? "0") : 0;
        if (remoteTime >= localTime) {
          saveEncryptedVaultLocal(remote.vaultCipher);
          if (remote.updatedAt) localStorage.setItem("signal-canvas-vault-updated", remote.updatedAt);
          return remoteVault;
        }
      }
    } catch {
      /* use local */
    }

    return localVault ?? { sessions: {}, activeSessionId: null };
  }

  try {
    const raw = await secureVaultLoad();
    if (raw) {
      const parsed = parseVaultPayload(raw);
      console.info(
        `[Signal Canvas] Loaded ${Object.keys(parsed.sessions).length} session(s) from secure store`,
      );
      return parsed;
    }
  } catch (err) {
    console.error("[Signal Canvas] secureVaultLoad failed:", err);
  }

  const legacy = loadSessionsFromLocalStorage();
  return {
    sessions: legacy,
    activeSessionId: resolveActiveSessionId(legacy, localStorage.getItem(ACTIVE_SESSION_KEY)),
  };
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let persistChain: Promise<void> = Promise.resolve();

function enqueuePersist(
  sessions: Record<string, InvestigationSession>,
  activeSessionId: string | null,
) {
  persistChain = persistChain
    .then(() => persistSessionsAsync(sessions, activeSessionId))
    .catch((err) => {
      console.error("[Signal Canvas] Failed to persist sessions:", err);
    });
}

function persistSessions(sessions: Record<string, InvestigationSession>, activeSessionId?: string | null) {
  const resolvedActive =
    activeSessionId === undefined
      ? useWorkspaceStore.getState().activeSessionId
      : activeSessionId;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    enqueuePersist(sessions, resolvedActive);
  }, 300);
}

async function persistSessionsNow(
  sessions: Record<string, InvestigationSession>,
  activeSessionId: string | null,
) {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  enqueuePersist(sessions, activeSessionId);
  await persistChain;
}

async function persistSessionsAsync(
  sessions: Record<string, InvestigationSession>,
  activeSessionId: string | null,
) {
  const vault: WorkspaceVault = { sessions, activeSessionId };

  if (isWeb) {
    if (!isWebVaultUnlocked()) {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      if (activeSessionId) localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
      else localStorage.removeItem(ACTIVE_SESSION_KEY);
      return;
    }
    try {
      const cipher = await encryptSessionsForStorage(vault);
      saveEncryptedVaultLocal(cipher);
      const updated = new Date().toISOString();
      localStorage.setItem("signal-canvas-vault-updated", updated);
      localStorage.removeItem(SESSIONS_KEY);
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      void saveVaultWeb(cipher).then((res) => {
        if (res.updatedAt) localStorage.setItem("signal-canvas-vault-updated", res.updatedAt);
      });
    } catch {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      if (activeSessionId) localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
      else localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
    return;
  }

  try {
    await secureVaultSave(vault);
    localStorage.removeItem(SESSIONS_KEY);
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch (err) {
    console.error("[Signal Canvas] secureVaultSave failed, using localStorage fallback:", err);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    if (activeSessionId) localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
    else localStorage.removeItem(ACTIVE_SESSION_KEY);
    throw err;
  }
}

function logCommand(commands: string[], message: string): string[] {
  return [message, ...commands].slice(0, 8);
}

function getActiveSession(state: WorkspaceState): InvestigationSession | null {
  if (!state.activeSessionId) return null;
  return state.sessions[state.activeSessionId] ?? null;
}

function updateActiveSession(
  get: () => WorkspaceState,
  set: (partial: Partial<WorkspaceState>) => void,
  updater: (session: InvestigationSession) => InvestigationSession,
) {
  const id = get().activeSessionId;
  if (!id) return;
  const sessions = { ...get().sessions };
  const current = sessions[id];
  if (!current) return;
  sessions[id] = touchSession(updater(current));
  persistSessions(sessions);
  set({ sessions });
}

function applyScanResultToSession(
  session: InvestigationSession,
  result: AgentScanResult,
): InvestigationSession {
  const primaryNodeId = result.nodes[0]?.id;
  const hasPrimaryPresence = primaryNodeId
    ? session.agentPresences.some((p) => p.relatedNodeIds?.includes(primaryNodeId))
    : false;
  const scanPresence = hasPrimaryPresence || !primaryNodeId
    ? session.agentPresences
    : [
        ...session.agentPresences,
        {
          id: `hermes-scan-${session.id}`,
          agent: "hermes" as const,
          status: "complete" as const,
          stage: "Scan complete",
          detail: "Hermes mapped accounts, platforms, and keyword clusters from the scan target.",
          relatedNodeIds: [primaryNodeId],
          position: { x: 0, y: 0 },
          startedAt: new Date().toISOString(),
          recommendations: ["Select a node and run correlate", "Export brief for institutional review"],
        },
      ];

  return touchSession({
    ...session,
    nodes: result.nodes,
    edges: result.edges.map((e) => ({ ...e, type: "signal" as const, animated: true })),
    intelHits: result.intel,
    riskReview: result.riskReview,
    briefData: result.brief,
    workspaceName: result.workspaceName,
    caseName: result.caseName,
    scanLoaded: true,
    correlated: false,
    intelStripOpen: true,
    activeTool: "scan",
    agentSource: "hermes",
    agentPresences: scanPresence,
  });
}

const initialSettings = loadSettings();
const initialIntegration = loadIntegrationConfig();

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  theme: initialSettings.theme === "mykonos" ? "stratir" : initialSettings.theme,
  language: initialSettings.language,
  graphStyle: normalizeGraphStyleId(initialSettings.graphStyle),
  sidebarCollapsed: initialSettings.sidebarCollapsed ?? false,
  settingsOpen: false,
  settingsTab: "appearance" as const,
  agentRunning: false,
  hermesOnline: false,
  nvidiaReady: false,
  integrationConfig: initialIntegration,
  integrationStatus: null,
  activeSessionId: null,
  activeTab: "canvas",
  sessionSearch: "",
  sessions: {},
  briefModalOpen: false,
  commandPaletteOpen: false,

  setTheme: (theme) => {
    const { language, graphStyle, sidebarCollapsed } = get();
    persistSettings(theme, language, graphStyle, sidebarCollapsed);
    set({ theme });
  },

  setGraphStyle: (graphStyle) => {
    const { theme, language, sidebarCollapsed } = get();
    persistSettings(theme, language, graphStyle, sidebarCollapsed);
    set({ graphStyle });
    updateActiveSession(get, set, (s) => applyGraphLayout(s, graphStyle));
  },

  toggleSidebar: () => {
    const { theme, language, graphStyle, sidebarCollapsed } = get();
    const next = !sidebarCollapsed;
    persistSettings(theme, language, graphStyle, next);
    set({ sidebarCollapsed: next });
  },

  setLanguage: (language) => {
    const { theme, graphStyle, sidebarCollapsed } = get();
    persistSettings(theme, language, graphStyle, sidebarCollapsed);
    set({ language });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveMonitorPlatform: (platform) =>
    updateActiveSession(get, set, (s) => ({ ...s, activeMonitorPlatform: platform })),

  setSessionSearch: (query) => set({ sessionSearch: query }),

  refreshAgentHealth: async () => {
    try {
      const health = await checkHermesHealth();
      set({ hermesOnline: health.online });
    } catch {
      set({ hermesOnline: false });
    }
  },

  refreshIntegrationStatus: async () => {
    try {
      const status = await fetchIntegrationStatus(get().integrationConfig);
      set({
        integrationStatus: status,
        hermesOnline: status.hermesOnline,
        nvidiaReady: status.nemotronViaHermes,
      });
    } catch {
      set({ integrationStatus: null, nvidiaReady: false });
    }
  },

  hydrateIntegrationConfig: async () => {
    try {
      const disk = await loadIntegrationConfigFromDisk();
      if (disk) {
        const integrationConfig = { ...get().integrationConfig, ...disk };
        persistIntegrationConfig(integrationConfig);
        set({ integrationConfig });
        if (!isWeb) {
          try {
            await ensureHermesGateway(integrationConfig);
          } catch {
            /* gateway optional at startup */
          }
        }
      }
    } catch {
      /* browser preview without tauri */
    }
    await get().refreshIntegrationStatus();
    await get().refreshAgentHealth();
  },

  hydrateSessions: async () => {
    try {
      if (isWeb) {
        const legacyRaw = localStorage.getItem(SESSIONS_KEY);
        if (legacyRaw && isWebVaultUnlocked()) {
          try {
            const legacy = parseVaultPayload(JSON.parse(legacyRaw));
            const activeSessionId = resolveActiveSessionId(
              legacy.sessions,
              localStorage.getItem(ACTIVE_SESSION_KEY),
            );
            await persistSessionsNow(legacy.sessions, activeSessionId);
            set({ sessions: legacy.sessions, activeSessionId });
            return;
          } catch {
            /* fall through */
          }
        }
      }

      const loaded = await loadSessionsSecure();
      const activeSessionId = resolveActiveSessionId(loaded.sessions, loaded.activeSessionId);
      set({ sessions: loaded.sessions, activeSessionId });
      console.info(
        `[Signal Canvas] Hydrated ${Object.keys(loaded.sessions).length} session(s), active=${activeSessionId ?? "none"}`,
      );
    } catch (err) {
      console.error("[Signal Canvas] hydrateSessions failed:", err);
      set({ sessions: {}, activeSessionId: null });
    }
  },

  flushSessions: async () => {
    const { sessions, activeSessionId } = get();
    await persistSessionsNow(sessions, activeSessionId);
  },

  clearSessions: () => {
    set({ sessions: {}, activeSessionId: null });
  },

  setIntegrationConfig: (patch) => {
    const integrationConfig = { ...get().integrationConfig, ...patch };
    persistIntegrationConfig(integrationConfig);
    set({ integrationConfig });
  },

  saveIntegrationConfig: async () => {
    const config = get().integrationConfig;
    persistIntegrationConfig(config);
    if (isWeb) {
      await saveIntegrationsWeb({
        hermesGatewayUrl: config.hermesGatewayUrl,
        hermesApiKey: config.hermesApiKey,
        nvidiaApiKey: config.nvidiaApiKey,
        nvidiaNimEndpoint: config.nvidiaNimEndpoint,
        openaiApiKey: config.openaiApiKey,
        telegramApiId: config.telegramApiId,
        telegramApiHash: config.telegramApiHash,
      });
    } else {
      try {
        await saveIntegrationConfigToDisk(config);
        await ensureHermesGateway(config);
      } catch {
        /* browser preview without tauri */
      }
    }
    await get().refreshIntegrationStatus();
    await get().refreshAgentHealth();
  },

  createSession: (title) => {
    const trimmed = title?.trim();
    if (!trimmed) return "";

    const session = appendAudit(createEmptySession(trimmed), {
      action: "case.created",
      summary: `Case opened: ${trimmed}`,
    });
    const sessions = { ...get().sessions, [session.id]: session };
    const activeSessionId = session.id;
    set({
      sessions,
      activeSessionId,
      activeTab: "canvas",
    });
    void persistSessionsNow(sessions, activeSessionId).catch((err) => {
      console.error("[Signal Canvas] Failed to save new session:", err);
    });
    return session.id;
  },

  selectSession: (id) => {
    if (!get().sessions[id]) return;
    const activeSessionId = id;
    set({
      activeSessionId,
      activeTab: "canvas",
    });
    persistSessions(get().sessions, activeSessionId);
  },

  deleteSession: (id) => {
    const sessions = { ...get().sessions };
    delete sessions[id];
    const activeSessionId =
      get().activeSessionId === id ? null : get().activeSessionId;
    set({ sessions, activeSessionId });
    void persistSessionsNow(sessions, activeSessionId);
  },

  togglePinSession: (id) => {
    const sessions = { ...get().sessions };
    if (!sessions[id]) return;
    sessions[id] = touchSession({ ...sessions[id], pinned: !sessions[id].pinned });
    persistSessions(sessions);
    set({ sessions });
  },

  renameSession: (id, title) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const sessions = { ...get().sessions };
    if (!sessions[id]) return;
    sessions[id] = touchSession({ ...sessions[id], title: trimmed, caseName: trimmed });
    persistSessions(sessions);
    set({ sessions });
  },

  archiveSession: (id) => {
    const sessions = { ...get().sessions };
    if (!sessions[id]) return;
    sessions[id] = touchSession({ ...sessions[id], archived: true, pinned: false });
    const activeSessionId = get().activeSessionId === id ? null : get().activeSessionId;
    set({ sessions, activeSessionId });
    persistSessions(sessions, activeSessionId);
  },

  exportSession: (id) => {
    const session = get().sessions[id];
    if (!session) return;
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signal-canvas-${session.title.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  copySessionId: async (id) => {
    try {
      await navigator.clipboard.writeText(id);
    } catch {
      /* clipboard unavailable */
    }
  },

  openSettings: (tab) =>
    set({ settingsOpen: true, settingsTab: tab ?? get().settingsTab ?? "appearance" }),
  closeSettings: () => set({ settingsOpen: false }),
  setSettingsTab: (tab) => set({ settingsTab: tab }),

  setActiveTool: (tool) =>
    updateActiveSession(get, set, (s) => ({ ...s, activeTool: tool })),

  setSelectedNodeId: (id) =>
    updateActiveSession(get, set, (s) => ({ ...s, selectedNodeId: id })),

  setIntelStripOpen: (open) =>
    updateActiveSession(get, set, (s) => ({ ...s, intelStripOpen: open })),

  onNodesChange: (changes) => {
    const session = getActiveSession(get());
    if (!session) return;
    updateActiveSession(get, set, (s) => ({
      ...s,
      nodes: applyNodeChanges(changes, s.nodes),
    }));
  },

  ensureFlowsintLayout: () => {
    const session = getActiveSession(get());
    if (!session || !nodesNeedFlowsintLayout(session.nodes)) return;
    updateActiveSession(get, set, (s) => ({
      ...s,
      nodes: layoutFlowsintNodes(s.nodes),
    }));
  },

  onEdgesChange: (changes) => {
    if (!getActiveSession(get())) return;
    updateActiveSession(get, set, (s) => ({
      ...s,
      edges: applyEdgeChanges(changes, s.edges),
    }));
  },

  onConnect: (connection: Connection) => {
    if (!connection.source || !connection.target) return;
    updateActiveSession(get, set, (s) => ({
      ...s,
      edges: addEdge(
        {
          ...connection,
          id: `manual-${connection.source}-${connection.target}`,
          type: "signal",
          animated: true,
          data: { relationType: "observed" },
        },
        s.edges,
      ),
      activeTool: "select",
    }));
  },

  setScanTarget: (target, context) => {
    updateActiveSession(get, set, (s) => ({
      ...s,
      scanTarget: target.trim() || s.scanTarget,
      scanContext: context?.trim() || s.scanContext,
    }));
  },

  setActivePresenceId: (id) =>
    updateActiveSession(get, set, (s) => ({ ...s, activePresenceId: id })),

  dismissAgentPresence: (id) =>
    updateActiveSession(get, set, (s) => ({
      ...s,
      agentPresences: s.agentPresences.filter((p) => p.id !== id),
      activePresenceId: s.activePresenceId === id ? null : s.activePresenceId,
    })),

  acceptCanvasOp: (opId) => {
    updateActiveSession(get, set, (s) => {
      const op = s.pendingOps.find((o) => o.id === opId);
      if (!op) return s;
      let nodes = s.nodes;
      let edges = s.edges;
      if (op.node) nodes = [...nodes, op.node];
      if (op.edge) edges = [...edges, { ...op.edge, type: "signal" as const }];
      return {
        ...s,
        nodes,
        edges,
        pendingOps: s.pendingOps.map((o) =>
          o.id === opId ? { ...o, status: "accepted" as const } : o,
        ),
      };
    });
  },

  rejectCanvasOp: (opId) =>
    updateActiveSession(get, set, (s) => ({
      ...s,
      pendingOps: s.pendingOps.map((o) =>
        o.id === opId ? { ...o, status: "rejected" as const } : o,
      ),
    })),

  runScan: async () => {
    const { language, graphStyle } = get();
    const session = getActiveSession(get());
    if (!session) {
      return { message: "Create a session first.", success: false };
    }

    const useTelegramScan =
      !session.scanTarget.trim() && session.telegram.monitoredChats.length > 0;

    if (useTelegramScan) {
      return runTelegramGraphScan(get, set);
    }

    const handle = session.scanTarget.trim();
    if (!handle) {
      const message = t(language, "commands.scanTargetRequired");
      updateActiveSession(get, set, (s) => ({
        ...s,
        commandLog: logCommand(s.commandLog, message),
      }));
      return { message, success: false };
    }

    if (!get().hermesOnline) {
      const message = t(language, "integrations.hermes.offline");
      return { message, success: false };
    }

    const message = t(language, "commands.scanComplete");
    set({ agentRunning: true });

    const updatePresences = (patch: Partial<InvestigationSession>) => {
      updateActiveSession(get, set, (s) => ({
        ...s,
        ...patch,
        agentPresences: patch.agentPresences
          ? [...s.agentPresences.filter((p) => p.status === "complete"), ...patch.agentPresences]
          : s.agentPresences,
      }));
    };

    try {
      await runAgentScanStages(
        (patch) => updatePresences(patch as Partial<InvestigationSession>),
        handle,
      );

      const current = getActiveSession(get());
      if (!current) return { message: "Create a session first.", success: false };

      const context = current.scanContext.trim() || undefined;
      const result = await agentScan({ handle, context, language });
      let updated = applyScanResultToSession(current, result);
      updated = applyGraphLayout(updated, graphStyle);
      updated = {
        ...updated,
        commandLog: logCommand(updated.commandLog, message),
        agentPresences: updated.agentPresences.map((p) =>
          p.status === "waiting_review" ? { ...p, status: "complete" as const } : p,
        ),
        activePresenceId: null,
      };

      const sessions = { ...get().sessions, [current.id]: updated };
      persistSessions(sessions);
      set({ sessions });
      return { message, success: true };
    } catch (e) {
      const failMsg = e instanceof Error ? e.message : t(language, "integrations.hermes.offline");
      updateActiveSession(get, set, (s) => ({
        ...s,
        commandLog: logCommand(s.commandLog, failMsg),
      }));
      return { message: failMsg, success: false };
    } finally {
      set({ agentRunning: false });
    }
  },

  runCorrelate: async () => {
    const { language, graphStyle } = get();
    const session = getActiveSession(get());
    if (!session) {
      return { message: "Create a session first.", success: false };
    }

    if (session.nodes.length === 0) {
      const message = t(language, "commands.scanFirst");
      updateActiveSession(get, set, (s) => ({
        ...s,
        commandLog: logCommand(s.commandLog, message),
      }));
      return { message, success: false };
    }

    if (!session.selectedNodeId) {
      const message = t(language, "commands.selectNode");
      updateActiveSession(get, set, (s) => ({
        ...s,
        commandLog: logCommand(s.commandLog, message),
      }));
      return { message, success: false };
    }

    const selectedNode = session.nodes.find((n) => n.id === session.selectedNodeId);
    const telegramCorrelate =
      selectedNode && isTelegramNode(selectedNode);

    if (telegramCorrelate) {
      set({ agentRunning: true });
      try {
        const { edges, intel } = correlateTelegramNodes(session, session.selectedNodeId);
        if (edges.length === 0) {
          const message = t(language, "commands.noCorrelations");
          updateActiveSession(get, set, (s) => ({
            ...s,
            commandLog: logCommand(s.commandLog, message),
          }));
          return { message, success: false };
        }

        const message = t(language, "commands.correlateCompleteTelegram", { count: String(edges.length) });
        updateActiveSession(get, set, (s) => {
          const next = applyGraphLayout(
            {
              ...appendAudit(s, {
                action: "graph.correlate",
                summary: `Correlated ${edges.length} link(s) from selected Telegram node`,
                meta: {
                  nodeId: session.selectedNodeId ?? "",
                  edges: String(edges.length),
                },
              }),
              edges: [...s.edges, ...edges],
              intelHits: [...intel, ...s.intelHits].slice(0, 200),
              correlated: true,
              activeTool: "correlate" as ToolId,
              commandLog: logCommand(s.commandLog, message),
            },
            graphStyle,
          );
          return next;
        });
        return { message, success: true };
      } finally {
        set({ agentRunning: false });
      }
    }

    if (!session.scanLoaded) {
      const message = t(language, "commands.scanFirst");
      updateActiveSession(get, set, (s) => ({
        ...s,
        commandLog: logCommand(s.commandLog, message),
      }));
      return { message, success: false };
    }

    if (session.correlated) {
      const message = t(language, "commands.alreadyCorrelated");
      updateActiveSession(get, set, (s) => ({
        ...s,
        commandLog: logCommand(s.commandLog, message),
      }));
      return { message, success: false };
    }

    if (!get().hermesOnline) {
      return { message: t(language, "integrations.hermes.offline"), success: false };
    }

    set({ agentRunning: true });

    const nodeLabel =
      (selectedNode?.data as { label?: string } | undefined)?.label ?? session.selectedNodeId ?? "node";

    try {
      await runAgentCorrelateStages(
        (patch) =>
          updateActiveSession(get, set, (s) => ({
            ...s,
            agentPresences: patch.presences
              ? [...s.agentPresences, ...(patch.presences ?? [])]
              : s.agentPresences,
            activePresenceId: patch.activePresenceId ?? s.activePresenceId,
          })),
        nodeLabel,
        session.selectedNodeId,
      );

      const result = await agentCorrelate(session.selectedNodeId, language);
      const correlateNodes = result.correlateNodes;
      const correlateEdges = result.correlateEdges.map((e) => ({
        ...e,
        type: "signal" as const,
        animated: true,
      }));

      const message = t(language, "commands.correlateComplete");
      updateActiveSession(get, set, (s) =>
        applyGraphLayout(
          {
            ...s,
            nodes: [...s.nodes, ...correlateNodes],
            edges: [...s.edges, ...correlateEdges],
            correlated: true,
            activeTool: "correlate",
            commandLog: logCommand(s.commandLog, message),
            agentPresences: s.agentPresences.map((p) =>
              p.relatedNodeIds?.includes(session.selectedNodeId!)
                ? { ...p, status: "complete" as const }
                : p,
            ),
            activePresenceId: null,
          },
          graphStyle,
        ),
      );
      return { message, success: true };
    } catch (e) {
      const failMsg = e instanceof Error ? e.message : t(language, "integrations.hermes.offline");
      return { message: failMsg, success: false };
    } finally {
      set({ agentRunning: false });
    }
  },

  runWatch: (keyword) => {
    const trimmed = keyword.trim();
    const { language } = get();
    const session = getActiveSession(get());
    if (!session) return { message: "Create a session first.", success: false };

    if (session.watchlist.includes(trimmed)) {
      const message = t(language, "commands.watchExists", { keyword: trimmed });
      updateActiveSession(get, set, (s) => ({
        ...s,
        commandLog: logCommand(s.commandLog, message),
      }));
      return { message, success: false };
    }

    const message = t(language, "commands.watchAdded", { keyword: trimmed });
    updateActiveSession(get, set, (s) => ({
      ...s,
      watchlist: [...s.watchlist, trimmed],
      activeTool: "watch",
      commandLog: logCommand(s.commandLog, message),
    }));
    return { message, success: true };
  },

  sendChatMessage: async (content) => {
    const session = getActiveSession(get());
    if (!session) return;
    const { language } = get();

    const userMsg = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content,
      timestamp: new Date().toISOString(),
    };

    updateActiveSession(get, set, (s) => ({
      ...s,
      chatMessages: [...s.chatMessages, userMsg],
    }));

    const trimmed = content.trim();
    if (isExplicitCommand(trimmed)) {
      const result = await get().executeCommand(content);
      const assistantMsg = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: result.message,
        timestamp: new Date().toISOString(),
      };
      updateActiveSession(get, set, (s) => ({
        ...s,
        chatMessages: [...s.chatMessages, assistantMsg],
      }));
      return;
    }

    set({ agentRunning: true });
    try {
      const response = await hermesSessionChat(content, language, session.hermesSessionId, {
        investigationSessionId: session.id,
        caseName: session.caseName,
        scanTarget: session.scanTarget,
        selectedNodeId: session.selectedNodeId,
        nodeCount: session.nodes.length,
        edgeCount: session.edges.length,
        watchlist: session.watchlist,
        recentStreamCount: session.monitorStreams.telegram.length,
      });

      updateActiveSession(get, set, (s) => {
        let next = {
          ...s,
          hermesSessionId: response.hermesSessionId,
          chatMessages: [
            ...s.chatMessages,
            {
              id: crypto.randomUUID(),
              role: "assistant" as const,
              content: response.message,
              timestamp: new Date().toISOString(),
            },
          ],
        };
        if (response.canvasActions?.actions?.length) {
          const applied = applyCanvasActionImmediate(
            response.canvasActions.actions[0],
            next.nodes,
            next.edges,
            next.intelHits,
            next.agentPresences,
          );
          for (const action of response.canvasActions.actions.slice(1)) {
            const step = applyCanvasActionImmediate(
              action,
              applied.nodes,
              applied.edges,
              applied.intelHits,
              applied.agentPresences,
            );
            applied.nodes = step.nodes;
            applied.edges = step.edges;
            applied.intelHits = step.intelHits;
            applied.agentPresences = step.agentPresences;
          }
          next = {
            ...next,
            nodes: applied.nodes,
            edges: applied.edges,
            intelHits: applied.intelHits,
            agentPresences: applied.agentPresences,
            scanLoaded: applied.nodes.length > 0 ? true : next.scanLoaded,
            pendingOps: [
              ...next.pendingOps,
              ...canvasActionsToOps(response.canvasActions.actions, response.hermesSessionId),
            ],
          };
        }
        return next;
      });
    } catch (error) {
      const assistantMsg = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      };
      updateActiveSession(get, set, (s) => ({
        ...s,
        chatMessages: [...s.chatMessages, assistantMsg],
      }));
    } finally {
      set({ agentRunning: false });
    }
  },

  openBrief: () => {
    const session = getActiveSession(get());
    if (!session) return;
    const { language } = get();
    const { brief, riskReview } = briefFromSession(session, language);
    updateActiveSession(get, set, (s) =>
      appendAudit(
        { ...s, activeTool: "brief", briefData: brief, riskReview },
        {
          action: "brief.generated",
          summary: `Institutional review brief generated for ${s.title}`,
        },
      ),
    );
    set({ briefModalOpen: true });
  },

  closeBrief: () => set({ briefModalOpen: false }),

  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  toggleCommandPalette: () => set({ commandPaletteOpen: !get().commandPaletteOpen }),

  executeCommand: async (input) => {
    const { language, activeSessionId } = get();
    if (!activeSessionId) {
      return { message: t(language, "sessions.createFirst"), success: false };
    }

    const cmd = input.trim().toLowerCase();
    if (!cmd) return { message: t(language, "commands.empty"), success: false };

    if (cmd.includes("settings") || cmd.includes("configura")) {
      get().openSettings();
      return {
        message: getTranslations(language).commandPalette.commands.openSettings,
        success: true,
      };
    }

    if (cmd.includes("telegram") || cmd.includes("monitor")) {
      set({ activeTab: "telegram" });
      return { message: t(language, "telegram.tabOpened"), success: true };
    }

    if (cmd.includes("scan") || cmd.includes("escane")) {
      return get().runScan();
    }

    if (cmd.includes("correlate") || cmd.includes("correlacion")) {
      return get().runCorrelate();
    }

    const watchMatch = cmd.match(/watch\s+(?:keyword\s+)?["']?([^"']+)["']?/);
    if (watchMatch) return get().runWatch(watchMatch[1]);

    if (cmd.includes("brief") || cmd.includes("generate brief") || cmd.includes("gerar brief")) {
      const session = getActiveSession(get());
      if (session && !session.scanLoaded) await get().runScan();
      get().openBrief();
      return { message: t(language, "commands.briefOpened"), success: true };
    }

    if (cmd.includes("export") || cmd.includes("pdf")) {
      const session = getActiveSession(get());
      if (session && !session.scanLoaded) await get().runScan();
      get().openBrief();
      return { message: t(language, "commands.exportOpened"), success: true };
    }

    if (cmd.includes("stratir") || cmd.includes("impact")) {
      get().setTheme("stratir");
      return { message: t(language, "commands.themeStratir"), success: true };
    }

    if (cmd.includes("mykonos") || cmd.includes("athens")) {
      get().setTheme("mykonos");
      return { message: t(language, "commands.themeMykonos"), success: true };
    }

    if (cmd.includes("monaco")) {
      get().setTheme("monaco");
      return { message: t(language, "commands.themeMonaco"), success: true };
    }

    if (cmd.includes("angola")) {
      get().setTheme("angola");
      return { message: t(language, "commands.themeAngola"), success: true };
    }

    const message = t(language, "commands.unknown", { input });
    updateActiveSession(get, set, (s) => ({
      ...s,
      commandLog: logCommand(s.commandLog, message),
    }));
    return { message, success: false };
  },

  handleToolAction: async (tool) => {
    const { language } = get();
    if (!get().activeSessionId) {
      return { message: t(language, "sessions.createFirst"), success: false };
    }

    updateActiveSession(get, set, (s) => ({ ...s, activeTool: tool }));

    switch (tool) {
      case "scan":
        return get().runScan();
      case "correlate":
        return get().runCorrelate();
      case "brief": {
        get().openBrief();
        return { message: t(language, "commands.briefOpen"), success: true };
      }
      case "export": {
        get().openBrief();
        return { message: t(language, "commands.exportReady"), success: true };
      }
      case "watch": {
        const message = t(language, "commands.watchHint");
        updateActiveSession(get, set, (s) => ({
          ...s,
          commandLog: logCommand(s.commandLog, message),
        }));
        return { message, success: true };
      }
      default:
        return { message: t(language, "commands.selectTool"), success: true };
    }
  },

  ingestStreamEvent: (event) => {
    const activeSessionId = get().activeSessionId;
    const payload = event as StreamEvent & { sessionId?: string };
    if (payload.sessionId && activeSessionId && payload.sessionId !== activeSessionId) return;

    const normalized: StreamEvent = {
      id: event.id ?? crypto.randomUUID(),
      platform: event.platform ?? "telegram",
      chatId: event.chatId,
      chatTitle: event.chatTitle,
      senderId: event.senderId ?? null,
      senderName: event.senderName ?? null,
      text: event.text,
      observedAt: event.observedAt ?? new Date().toISOString(),
      signals: event.signals?.length ? event.signals : detectGroomingSignals(event.text),
      graphNodeId: null,
    };
    updateActiveSession(get, set, (s) => {
      const key = normalized.platform;
      const stream = [normalized, ...s.monitorStreams[key]].slice(0, 400);
      const intelHit =
        normalized.signals.length > 0
          ? {
              id: crypto.randomUUID(),
              source: normalized.chatTitle,
              platform: normalized.platform,
              snippet: normalized.text.slice(0, 240),
              timestamp: normalized.observedAt,
              confidence: "medium" as const,
            }
          : null;
      return {
        ...s,
        monitorStreams: { ...s.monitorStreams, [key]: stream },
        intelHits: intelHit ? [intelHit, ...s.intelHits].slice(0, 200) : s.intelHits,
        scanLoaded: true,
      };
    });
  },

  addMonitoredChat: (chat) =>
    updateActiveSession(get, set, (s) => ({
      ...s,
      telegram: {
        ...s.telegram,
        monitoredChats: [...s.telegram.monitoredChats.filter((c) => c.id !== chat.id), chat],
      },
    })),

  removeMonitoredChat: (chatId, platform) =>
    updateActiveSession(get, set, (s) => ({
      ...s,
      telegram:
        platform === "telegram"
          ? {
              ...s.telegram,
              monitoredChats: s.telegram.monitoredChats.filter((c) => c.id !== chatId),
            }
          : s.telegram,
    })),

  startTelegramMonitor: async () => {
    const { language, integrationConfig } = get();
    const session = getActiveSession(get());
    if (!session) return { message: t(language, "sessions.createFirst"), success: false };
    const chatIds = session.telegram.monitoredChats.map((c) => c.id);
    if (chatIds.length === 0) {
      return { message: t(language, "telegram.noChats"), success: false };
    }
    try {
      await telegramStartMonitor(integrationConfig, session.id, chatIds);
      updateActiveSession(get, set, (s) => ({
        ...appendAudit(s, {
          action: "telegram.monitor.start",
          summary: `Live monitor started (${chatIds.length} chat(s))`,
        }),
        telegram: { ...s.telegram, monitoringActive: true },
      }));
      return { message: t(language, "telegram.monitorStarted"), success: true };
    } catch (error) {
      return {
        message: error instanceof Error ? error.message : String(error),
        success: false,
      };
    }
  },

  stopTelegramMonitor: async () => {
    await telegramStopMonitor();
    updateActiveSession(get, set, (s) => ({
      ...s,
      telegram: { ...s.telegram, monitoringActive: false },
    }));
  },

  loadTelegramHistory: async (chatId) => {
    const { language, integrationConfig } = get();
    try {
      const result = await telegramFetchHistory(integrationConfig, chatId, 50);
      for (const msg of result.messages ?? []) {
        get().ingestStreamEvent({
          ...msg,
          platform: "telegram",
          signals: detectGroomingSignals(msg.text),
          graphNodeId: null,
        } as StreamEvent);
      }
      return { message: t(language, "telegram.historyLoaded"), success: true };
    } catch (error) {
      return { message: error instanceof Error ? error.message : String(error), success: false };
    }
  },

  joinTelegramChat: async (target) => {
    const { language, integrationConfig } = get();
    try {
      const chat = await telegramJoinChat(integrationConfig, target);
      get().addMonitoredChat({
        id: chat.id,
        title: chat.title,
        username: chat.username ?? null,
        platform: "telegram",
      });
      updateActiveSession(get, set, (s) =>
        appendAudit(s, {
          action: "telegram.joined",
          summary: `Joined Telegram: ${chat.title}`,
          meta: { chatId: chat.id },
        }),
      );
      return { message: t(language, "telegram.joinedChat", { title: chat.title }), success: true };
    } catch (error) {
      return { message: error instanceof Error ? error.message : String(error), success: false };
    }
  },

  addStreamEventToGraph: (eventId, platform) => {
    const { graphStyle } = get();
    updateActiveSession(get, set, (s) => {
      const events = s.monitorStreams[platform];
      const event = events.find((e) => e.id === eventId);
      if (!event) return s;
      const nodeId = `tg-${event.id}`;
      if (s.nodes.some((n) => n.id === nodeId)) {
        return { ...s, selectedNodeId: nodeId };
      }
      const node = telegramNodeFromEvent(event, s.nodes.length);
      const stream = events.map((e) => (e.id === eventId ? { ...e, graphNodeId: nodeId } : e));
      let next = {
        ...appendAudit(
          {
            ...s,
            nodes: [...s.nodes, node],
            edges: s.edges,
            scanLoaded: true,
            selectedNodeId: nodeId,
            monitorStreams: { ...s.monitorStreams, [platform]: stream },
          },
          {
            action: "graph.node.added",
            summary: `Telegram message added to graph (${node.data.label})`,
            meta: { nodeId, eventId: event.id },
          },
        ),
      };
      next = applyGraphLayout(next, graphStyle);
      return next;
    });
  },

  removeGraphNode: (nodeId) =>
    updateActiveSession(get, set, (s) => ({
      ...s,
      nodes: s.nodes.filter((n) => n.id !== nodeId),
      edges: s.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: s.selectedNodeId === nodeId ? null : s.selectedNodeId,
    })),

  removeGraphEdge: (edgeId) =>
    updateActiveSession(get, set, (s) => ({
      ...s,
      edges: s.edges.filter((e) => e.id !== edgeId),
    })),

  disconnectNodes: (sourceId, targetId) =>
    updateActiveSession(get, set, (s) => ({
      ...s,
      edges: s.edges.filter((e) => !(e.source === sourceId && e.target === targetId)),
    })),

  attachAgentToNode: (nodeId, detail) =>
    updateActiveSession(get, set, (s) => ({
      ...s,
      agentPresences: [
        ...s.agentPresences,
        {
          id: crypto.randomUUID(),
          agent: "hermes",
          status: "complete",
          stage: "Agent attached",
          detail: detail ?? "Monitoring this node",
          position: { x: 0, y: 0 },
          relatedNodeIds: [nodeId],
          startedAt: new Date().toISOString(),
        },
      ],
      activePresenceId: null,
    })),

  assignNodeHermesTask: async (nodeId, taskId) => {
    const session = getActiveSession(get());
    if (!session) return;
    const node = session.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const { language } = get();
    const taskCopy = getTranslations(language).nodeDetail.tasks[taskId];
    const stageCopy = taskCopy.stages;

    const userMsg = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: `[Graph task · ${nodeId}] ${taskCopy.title}`,
      timestamp: new Date().toISOString(),
    };

    updateActiveSession(get, set, (s) => ({
      ...s,
      chatMessages: [...s.chatMessages, userMsg],
      selectedNodeId: nodeId,
    }));

    set({ agentRunning: true });

    try {
      const result = await runNodeHermesTask(taskId, node, stageCopy, (presence) => {
        updateActiveSession(get, set, (s) => ({
          ...s,
          agentPresences: [
            ...s.agentPresences.filter((p) => p.id !== presence.id),
            presence,
          ],
          activePresenceId: presence.id,
        }));
      });

      updateActiveSession(get, set, (s) => {
        let next = {
          ...s,
          agentPresences: [
            ...s.agentPresences.filter((p) => !result.presences.some((rp) => rp.id === p.id)),
            ...result.presences,
          ],
          activePresenceId: result.activePresenceId,
          scanLoaded: true,
          chatMessages: [
            ...s.chatMessages,
            {
              id: crypto.randomUUID(),
              role: "assistant" as const,
              content: taskCopy.complete,
              timestamp: new Date().toISOString(),
            },
          ],
        };

        if (result.watchlist?.length) {
          const merged = [...new Set([...next.watchlist, ...result.watchlist.map((w) => w.toLowerCase())])];
          next = { ...next, watchlist: merged, activeTool: "watch" };
        }
        if (result.nodes?.length) {
          next = { ...next, nodes: [...next.nodes, ...result.nodes] };
        }
        if (result.edges?.length) {
          next = {
            ...next,
            edges: [...next.edges, ...result.edges.map((e) => ({ ...e, type: "signal" as const }))],
          };
        }
        if (result.commandLog) {
          next = { ...next, commandLog: logCommand(next.commandLog, result.commandLog) };
        }
        return next;
      });

      if (get().hermesOnline) {
        const liveSession = getActiveSession(get());
        if (liveSession) {
          try {
            const response = await hermesSessionChat(
              `Assigned graph task "${taskCopy.title}" on node ${nodeId}. ${taskCopy.desc}`,
              language,
              liveSession.hermesSessionId,
              {
                investigationSessionId: liveSession.id,
                caseName: liveSession.caseName,
                scanTarget: liveSession.scanTarget,
                selectedNodeId: nodeId,
                nodeCount: liveSession.nodes.length,
                edgeCount: liveSession.edges.length,
                watchlist: liveSession.watchlist,
                recentStreamCount: liveSession.monitorStreams.telegram.length,
              },
            );
            updateActiveSession(get, set, (s) => ({
              ...s,
              hermesSessionId: response.hermesSessionId,
              chatMessages: [
                ...s.chatMessages,
                {
                  id: crypto.randomUUID(),
                  role: "assistant" as const,
                  content: response.message,
                  timestamp: new Date().toISOString(),
                },
              ],
            }));
          } catch {
            /* Hermes follow-up optional */
          }
        }
      }
    } finally {
      set({ agentRunning: false });
    }
  },

  applyAgentCanvasActions: (payload, autoApply = false) => {
    updateActiveSession(get, set, (s) => {
      const actions = payload.actions ?? [];
      if (autoApply) {
        let nodes = s.nodes;
        let edges = s.edges;
        let intelHits = s.intelHits;
        let agentPresences = s.agentPresences;
        for (const action of actions) {
          const next = applyCanvasActionImmediate(action, nodes, edges, intelHits, agentPresences);
          nodes = next.nodes;
          edges = next.edges;
          intelHits = next.intelHits;
          agentPresences = next.agentPresences;
        }
        return { ...s, nodes, edges, intelHits, agentPresences, scanLoaded: true };
      }
      return {
        ...s,
        pendingOps: [...s.pendingOps, ...canvasActionsToOps(actions, s.hermesSessionId ?? "hermes")],
      };
    });
  },

  acceptAllPendingOps: () => {
    const session = getActiveSession(get());
    if (!session) return;
    for (const op of session.pendingOps.filter((o) => o.status === "pending")) {
      get().acceptCanvasOp(op.id);
    }
  },
}));

/** Selectors for active session fields */
export function useSessionSelector<T>(
  selector: (session: InvestigationSession) => T,
  fallback: T,
): T {
  const activeSessionId = useWorkspaceStore((s) => s.activeSessionId);
  const sessions = useWorkspaceStore((s) => s.sessions);
  if (!activeSessionId || !sessions[activeSessionId]) return fallback;
  return selector(sessions[activeSessionId]);
}
