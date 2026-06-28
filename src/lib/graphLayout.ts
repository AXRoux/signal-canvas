import type { Edge, Node } from "@xyflow/react";

/** STRATIR is the only style that uses xyflow node positions from the store. */
export function layoutGraphNodes(nodes: Node[]): Node[] {
  return nodes;
}

export function layoutGraphEdges(edges: Edge[]): Edge[] {
  return edges.map((e) => ({
    ...e,
    type: "signal",
    animated: e.data?.relationType === "correlated" || e.animated,
  }));
}
