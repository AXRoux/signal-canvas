import type { Node, Edge } from "@xyflow/react";
import type { AgentPresence } from "../store/types";
import { buildNodeDetail, extractLinks, getNodeKind } from "./nodeDetail";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type NodeHermesTaskId =
  | "watch-sender"
  | "correlate-links"
  | "cluster-language"
  | "track-migration"
  | "build-timeline"
  | "brief-evidence"
  | "sustained-monitor";

export const NODE_HERMES_TASKS: NodeHermesTaskId[] = [
  "watch-sender",
  "correlate-links",
  "cluster-language",
  "track-migration",
  "build-timeline",
  "brief-evidence",
  "sustained-monitor",
];

export function tasksForNodeType(node: Node): NodeHermesTaskId[] {
  const kind = getNodeKind(node);
  if (kind === "telegram") return NODE_HERMES_TASKS;
  if (kind === "account") return ["correlate-links", "brief-evidence", "sustained-monitor"];
  if (kind === "keyword") return ["cluster-language", "brief-evidence"];
  if (kind === "platform") return ["track-migration", "correlate-links", "brief-evidence"];
  return ["brief-evidence"];
}

export interface NodeTaskStageCopy {
  stage: string;
  detail: string;
}

export interface NodeTaskRunResult {
  presences: AgentPresence[];
  activePresenceId: string | null;
  watchlist?: string[];
  nodes?: Node[];
  edges?: Edge[];
  commandLog?: string;
}

function presence(
  partial: Omit<AgentPresence, "id" | "startedAt"> & { id?: string },
): AgentPresence {
  return {
    ...partial,
    id: partial.id ?? crypto.randomUUID(),
    startedAt: new Date().toISOString(),
  };
}

export async function runNodeHermesTask(
  taskId: NodeHermesTaskId,
  node: Node,
  stageCopy: NodeTaskStageCopy[],
  onStage: (presence: AgentPresence) => void,
): Promise<NodeTaskRunResult> {
  const detail = buildNodeDetail(node);
  const baseId = crypto.randomUUID();
  const presences: AgentPresence[] = [];
  let watchlist: string[] | undefined;
  let nodes: Node[] | undefined;
  let edges: Edge[] | undefined;
  let commandLog: string | undefined;

  for (let i = 0; i < stageCopy.length; i++) {
    const stage = stageCopy[i];
    const p = presence({
      id: `${baseId}-${i}`,
      agent: i === 1 && taskId === "cluster-language" ? "nemotron" : "hermes",
      status: i === stageCopy.length - 1 ? "waiting_review" : i === 0 ? "thinking" : "acting",
      stage: stage.stage,
      detail: stage.detail,
      position: { x: 0, y: 0 },
      relatedNodeIds: [node.id],
      recommendations:
        i === stageCopy.length - 1
          ? ["Accept findings on graph", "Assign follow-up monitor", "Dismiss if low confidence"]
          : undefined,
    });
    presences.push(p);
    onStage(p);
    await sleep(i === 0 ? 700 : 900);
  }

  if (taskId === "watch-sender") {
    const target = detail.title.replace(/^@/, "").trim();
    if (target) {
      watchlist = [target.toLowerCase()];
      commandLog = `Hermes watch: ${target}`;
    }
  }

  if (taskId === "correlate-links") {
    const links = extractLinks(detail.body ?? detail.subtitle ?? "");
    if (links.length > 0) {
      const link = links[0];
      const childId = `corr-${node.id}-${Date.now()}`;
      nodes = [
        {
          id: childId,
          type: "platform",
          position: {
            x: node.position.x + 220,
            y: node.position.y + (Math.random() * 80 - 40),
          },
          data: {
            label: "Linked destination",
            link,
            migration: /t\.me|telegram/i.test(link),
          },
        },
      ];
      edges = [
        {
          id: `edge-${node.id}-${childId}`,
          source: node.id,
          target: childId,
          type: "signal",
          label: "correlated",
        },
      ];
      commandLog = `Hermes correlated link from ${detail.title}`;
    }
  }

  if (taskId === "cluster-language" && detail.signalTags.length > 0) {
    commandLog = `Hermes clustered ${detail.signalTags.length} language signals`;
  }

  if (taskId === "track-migration") {
    const migrationPhrase = "off-platform migration";
    watchlist = [migrationPhrase];
    commandLog = "Hermes tracking migration phrases across monitors";
  }

  if (taskId === "build-timeline") {
    commandLog = `Hermes building escalation timeline from ${detail.title}`;
  }

  if (taskId === "brief-evidence") {
    commandLog = `Queued ${detail.title} for NGO brief evidence pack`;
  }

  if (taskId === "sustained-monitor") {
    commandLog = `Hermes sustained monitor attached to ${detail.title}`;
  }

  return {
    presences,
    activePresenceId: presences[presences.length - 1]?.id ?? null,
    watchlist,
    nodes,
    edges,
    commandLog,
  };
}
