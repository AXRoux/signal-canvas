import type { Edge, Node } from "@xyflow/react";
import type { AgentPresence, CanvasOp, IntelHit } from "../store/types";

export interface CanvasActionPayload {
  type?: string;
  actions?: CanvasAction[];
  agent_message?: string;
}

export type CanvasAction =
  | { op: "place_node"; id?: string; nodeType: string; label: string; platform?: string; risk?: string; link?: string; x?: number; y?: number }
  | { op: "connect"; from: string; to: string; edgeType?: string; label?: string }
  | { op: "disconnect"; edgeId?: string; from?: string; to?: string }
  | { op: "remove_node"; nodeId: string }
  | { op: "remove_edge"; edgeId: string }
  | { op: "annotate"; nodeId: string; text: string }
  | { op: "intel_hit"; source: string; snippet: string; platform?: string; confidence?: "low" | "medium" | "high" }
  | { op: "agent_attach"; nodeId: string; stage?: string; detail?: string; agent?: "hermes" | "nemotron" };

export function canvasActionsToOps(actions: CanvasAction[], agentId: string): CanvasOp[] {
  const ops: CanvasOp[] = [];
  for (const action of actions) {
    if (action.op === "place_node") {
      const id = action.id ?? `node-${crypto.randomUUID().slice(0, 8)}`;
      const node: Node = {
        id,
        type: action.nodeType,
        position: { x: action.x ?? 120 + Math.random() * 200, y: action.y ?? 80 + Math.random() * 180 },
        data: {
          label: action.label,
          platform: action.platform ?? action.nodeType,
          risk: action.risk ?? "medium",
          link: action.link,
          signals: 0,
        },
      };
      ops.push({
        id: crypto.randomUUID(),
        type: "place_node",
        label: `Place ${action.label}`,
        reason: action.label,
        agentId,
        node,
        status: "pending",
      });
    } else if (action.op === "connect") {
      const edge: Edge = {
        id: `edge-${crypto.randomUUID().slice(0, 8)}`,
        source: action.from,
        target: action.to,
        type: "signal",
        label: action.label,
        data: { edgeKind: action.edgeType ?? "correlated" },
      };
      ops.push({
        id: crypto.randomUUID(),
        type: "connect",
        label: `Connect ${action.from} → ${action.to}`,
        reason: action.label ?? "Agent proposed link",
        agentId,
        edge,
        status: "pending",
      });
    }
  }
  return ops;
}

export function applyCanvasActionImmediate(
  action: CanvasAction,
  nodes: Node[],
  edges: Edge[],
  intelHits: IntelHit[],
  agentPresences: AgentPresence[],
): { nodes: Node[]; edges: Edge[]; intelHits: IntelHit[]; agentPresences: AgentPresence[] } {
  let nextNodes = nodes;
  let nextEdges = edges;
  let nextIntel = intelHits;
  let nextPresences = agentPresences;

  switch (action.op) {
    case "place_node": {
      const id = action.id ?? `node-${crypto.randomUUID().slice(0, 8)}`;
      nextNodes = [
        ...nodes,
        {
          id,
          type: action.nodeType,
          position: { x: action.x ?? 140, y: action.y ?? 120 },
          data: {
            label: action.label,
            platform: action.platform ?? "telegram",
            risk: action.risk ?? "medium",
            link: action.link,
            signals: 0,
          },
        },
      ];
      break;
    }
    case "connect":
      nextEdges = [
        ...edges,
        {
          id: `edge-${crypto.randomUUID().slice(0, 8)}`,
          source: action.from,
          target: action.to,
          type: "signal",
          label: action.label,
        },
      ];
      break;
    case "disconnect":
      nextEdges = edges.filter((e) => {
        if (action.edgeId && e.id === action.edgeId) return false;
        if (action.from && action.to && e.source === action.from && e.target === action.to) return false;
        return true;
      });
      break;
    case "remove_node":
      nextNodes = nodes.filter((n) => n.id !== action.nodeId);
      nextEdges = edges.filter((e) => e.source !== action.nodeId && e.target !== action.nodeId);
      break;
    case "remove_edge":
      nextEdges = edges.filter((e) => e.id !== action.edgeId);
      break;
    case "intel_hit":
      nextIntel = [
        ...intelHits,
        {
          id: crypto.randomUUID(),
          source: action.source,
          platform: action.platform ?? "telegram",
          snippet: action.snippet,
          timestamp: new Date().toISOString(),
          confidence: action.confidence ?? "medium",
        },
      ];
      break;
    case "agent_attach":
      nextPresences = [
        ...agentPresences,
        {
          id: crypto.randomUUID(),
          agent: action.agent ?? "hermes",
          status: "complete",
          stage: action.stage ?? "Monitoring",
          detail: action.detail ?? "Agent attached to node",
          position: { x: 0, y: 0 },
          relatedNodeIds: [action.nodeId],
          startedAt: new Date().toISOString(),
        },
      ];
      break;
    default:
      break;
  }

  return { nodes: nextNodes, edges: nextEdges, intelHits: nextIntel, agentPresences: nextPresences };
}
