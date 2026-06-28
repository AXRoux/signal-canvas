import type { AgentPresence, CanvasOp } from "../store/types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function runAgentScanStages(
  onUpdate: (patch: {
    presences?: AgentPresence[];
    activePresenceId?: string | null;
    pendingOps?: CanvasOp[];
  }) => void,
  handle: string,
): Promise<void> {
  const baseId = crypto.randomUUID();
  const stages: Omit<AgentPresence, "id">[] = [
    {
      agent: "hermes",
      status: "thinking",
      stage: "Routing scan request",
      detail: `Hermes is parsing target ${handle} and selecting signal-canvas-scan skill.`,
      position: { x: 492, y: 180 },
      relatedNodeIds: ["account-main"],
      startedAt: new Date().toISOString(),
    },
    {
      agent: "nemotron",
      status: "acting",
      stage: "Extracting signals",
      detail: "Nemotron is classifying language patterns and grooming indicators from public surface data.",
      position: { x: 492, y: 180 },
      relatedNodeIds: ["account-main"],
      startedAt: new Date().toISOString(),
      recommendations: ["Expand watchlist to off-platform migration phrases", "Correlate linked accounts next"],
    },
    {
      agent: "hermes",
      status: "waiting_review",
      stage: "Placing graph nodes",
      detail: "Scan complete. Review proposed node placements before accepting branch expansion.",
      position: { x: 492, y: 180 },
      relatedNodeIds: ["account-main"],
      startedAt: new Date().toISOString(),
      recommendations: ["Accept all nodes", "Pin primary account", "Run correlate on selected node"],
    },
  ];

  for (let i = 0; i < stages.length; i++) {
    const presence: AgentPresence = { ...stages[i], id: `${baseId}-${i}` };
    onUpdate({ presences: [presence], activePresenceId: presence.id });
    await sleep(i === 0 ? 600 : 900);
  }

  onUpdate({
    activePresenceId: `${baseId}-2`,
  });
}

export async function runAgentCorrelateStages(
  onUpdate: (patch: { presences?: AgentPresence[]; activePresenceId?: string | null }) => void,
  nodeLabel: string,
  nodeId: string,
): Promise<void> {
  const id = crypto.randomUUID();
  const presence: AgentPresence = {
    id,
    agent: "hermes",
    status: "acting",
    stage: "Correlating linked accounts",
    detail: `Tracing off-platform links from ${nodeLabel}. Branch nodes will appear on accept.`,
    position: { x: 492, y: 180 },
    relatedNodeIds: [nodeId],
    startedAt: new Date().toISOString(),
    recommendations: ["Accept branch", "Add manual edge", "Dismiss if low confidence"],
  };
  onUpdate({ presences: [presence], activePresenceId: id });
  await sleep(800);
  onUpdate({
    presences: [{ ...presence, status: "waiting_review" }],
    activePresenceId: id,
  });
}
