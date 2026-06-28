import type { Edge, Node } from "@xyflow/react";
import type { NodeHermesTaskId } from "../lib/nodeHermesTasks";

export type ThemeId = "stratir" | "mykonos" | "monaco" | "angola";

export type AppTab = "canvas" | "artifacts" | "telegram";

export type MonitorPlatform = "telegram" | "discord" | "openweb";

export type SettingsTab =
  | "appearance"
  | "language"
  | "account"
  | "graph"
  | "hermes"
  | "nvidia"
  | "telegram"
  | "setup"
  | "about";

export type AgentPresenceStatus = "idle" | "thinking" | "acting" | "waiting_review" | "complete";

export type CanvasOpType = "place_node" | "connect" | "branch" | "annotate" | "recommend";

export interface AgentPresence {
  id: string;
  agent: "hermes" | "prometheus" | "nemotron";
  status: AgentPresenceStatus;
  stage: string;
  detail: string;
  position: { x: number; y: number };
  relatedNodeIds?: string[];
  startedAt: string;
  recommendations?: string[];
}

export interface CanvasOp {
  id: string;
  type: CanvasOpType;
  label: string;
  reason: string;
  agentId: string;
  node?: Node;
  edge?: Edge;
  status: "pending" | "accepted" | "rejected";
}

export type ToolId =
  | "select"
  | "scan"
  | "watch"
  | "correlate"
  | "brief"
  | "export";

export interface MonitoredChat {
  id: string;
  title: string;
  username?: string | null;
  platform: MonitorPlatform;
}

export interface StreamEvent {
  id: string;
  platform: MonitorPlatform;
  chatId: string;
  chatTitle: string;
  senderId: string | null;
  senderName: string | null;
  text: string;
  observedAt: string;
  signals: string[];
  graphNodeId: string | null;
}

export interface TelegramSessionState {
  authorized: boolean;
  username: string | null;
  monitoringActive: boolean;
  monitoredChats: MonitoredChat[];
}

export interface MonitorStreams {
  telegram: StreamEvent[];
  discord: StreamEvent[];
  openweb: StreamEvent[];
}

export interface IntelHit {
  id: string;
  source: string;
  platform: string;
  snippet: string;
  timestamp: string;
  confidence: "low" | "medium" | "high";
}

export interface TimelineEvent {
  time: string;
  label: string;
  detail: string;
}

export interface RiskReview {
  score: number;
  confidence: "low" | "medium" | "high";
  groomingIndicators: string[];
  escalationTimeline: TimelineEvent[];
  offPlatformNotes: string[];
  languagesDetected: string[];
  summary: string;
}

export interface BriefSection {
  title: string;
  items: string[];
}

export interface BriefData {
  title: string;
  caseId: string;
  generatedAt: string;
  reviewerNotes: string;
  sections: BriefSection[];
  linkedAccounts: string[];
  keywords: string[];
}

export interface AuditEntry {
  id: string;
  at: string;
  action: string;
  summary: string;
  actor: string;
  meta?: Record<string, string>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface InvestigationSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  archived: boolean;
  caseName: string;
  workspaceName: string;
  activeTool: ToolId;
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  intelHits: IntelHit[];
  riskReview: RiskReview | null;
  briefData: BriefData | null;
  scanLoaded: boolean;
  correlated: boolean;
  intelStripOpen: boolean;
  commandLog: string[];
  auditLog: AuditEntry[];
  watchlist: string[];
  chatMessages: ChatMessage[];
  agentSource: "hermes" | null;
  scanTarget: string;
  scanContext: string;
  agentPresences: AgentPresence[];
  pendingOps: CanvasOp[];
  activePresenceId: string | null;
  hermesSessionId: string | null;
  telegram: TelegramSessionState;
  monitorStreams: MonitorStreams;
  activeMonitorPlatform: MonitorPlatform;
}

export interface AgentScanResult {
  caseName: string;
  workspaceName: string;
  handle: string;
  nodes: Node[];
  edges: Edge[];
  intel: IntelHit[];
  riskReview: RiskReview;
  brief: BriefData;
  correlateNodes: Node[];
  correlateEdges: Edge[];
}

export interface CommandResult {
  message: string;
  success: boolean;
}

import type { IntegrationConfig, IntegrationStatus } from "./integrationConfig";

import type { GraphStyleId } from "../lib/graphStyles";

export interface WorkspaceState {
  theme: ThemeId;
  language: import("../i18n/types").LanguageId;
  graphStyle: GraphStyleId;
  sidebarCollapsed: boolean;
  settingsOpen: boolean;
  settingsTab: SettingsTab;
  agentRunning: boolean;
  hermesOnline: boolean;
  nvidiaReady: boolean;
  integrationConfig: IntegrationConfig;
  integrationStatus: IntegrationStatus | null;
  activeSessionId: string | null;
  activeTab: AppTab;
  sessionSearch: string;
  sessions: Record<string, InvestigationSession>;
  briefModalOpen: boolean;
  commandPaletteOpen: boolean;

  setTheme: (theme: ThemeId) => void;
  setGraphStyle: (style: GraphStyleId) => void;
  toggleSidebar: () => void;
  setLanguage: (language: import("../i18n/types").LanguageId) => void;
  setActiveTab: (tab: AppTab) => void;
  setActiveMonitorPlatform: (platform: MonitorPlatform) => void;
  setSessionSearch: (query: string) => void;
  openSettings: (tab?: SettingsTab) => void;
  closeSettings: () => void;
  setSettingsTab: (tab: SettingsTab) => void;
  refreshAgentHealth: () => Promise<void>;
  refreshIntegrationStatus: () => Promise<void>;
  hydrateIntegrationConfig: () => Promise<void>;
  hydrateSessions: () => Promise<void>;
  flushSessions: () => Promise<void>;
  clearSessions: () => void;
  setIntegrationConfig: (patch: Partial<IntegrationConfig>) => void;
  saveIntegrationConfig: () => Promise<void>;
  createSession: (title?: string) => string;
  selectSession: (id: string) => void;
  deleteSession: (id: string) => void;
  togglePinSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  archiveSession: (id: string) => void;
  exportSession: (id: string) => void;
  copySessionId: (id: string) => Promise<void>;
  setActiveTool: (tool: ToolId) => void;
  setSelectedNodeId: (id: string | null) => void;
  setIntelStripOpen: (open: boolean) => void;
  onNodesChange: (changes: import("@xyflow/react").NodeChange[]) => void;
  ensureFlowsintLayout: () => void;
  onEdgesChange: (changes: import("@xyflow/react").EdgeChange[]) => void;
  onConnect: (connection: import("@xyflow/react").Connection) => void;
  setScanTarget: (target: string, context?: string) => void;
  setActivePresenceId: (id: string | null) => void;
  dismissAgentPresence: (id: string) => void;
  acceptCanvasOp: (opId: string) => void;
  rejectCanvasOp: (opId: string) => void;
  runScan: () => Promise<CommandResult>;
  runCorrelate: () => Promise<CommandResult>;
  runWatch: (keyword: string) => CommandResult;
  sendChatMessage: (content: string) => Promise<void>;
  openBrief: () => void;
  closeBrief: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
  executeCommand: (input: string) => Promise<CommandResult>;
  handleToolAction: (tool: ToolId) => Promise<CommandResult>;
  ingestStreamEvent: (event: StreamEvent) => void;
  addMonitoredChat: (chat: MonitoredChat) => void;
  removeMonitoredChat: (chatId: string, platform: MonitorPlatform) => void;
  startTelegramMonitor: () => Promise<CommandResult>;
  stopTelegramMonitor: () => Promise<void>;
  loadTelegramHistory: (chatId: string) => Promise<CommandResult>;
  joinTelegramChat: (target: string) => Promise<CommandResult>;
  addStreamEventToGraph: (eventId: string, platform: MonitorPlatform) => void;
  removeGraphNode: (nodeId: string) => void;
  removeGraphEdge: (edgeId: string) => void;
  disconnectNodes: (sourceId: string, targetId: string) => void;
  attachAgentToNode: (nodeId: string, detail?: string) => void;
  assignNodeHermesTask: (nodeId: string, taskId: NodeHermesTaskId) => Promise<void>;
  applyAgentCanvasActions: (payload: import("../lib/canvasActions").CanvasActionPayload, autoApply?: boolean) => void;
  acceptAllPendingOps: () => void;
}
