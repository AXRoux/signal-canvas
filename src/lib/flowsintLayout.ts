import type { Node } from "@xyflow/react";

export function ensureFlowPosition(node: Node, index: number): { x: number; y: number } {
  const px = node.position?.x ?? 0;
  const py = node.position?.y ?? 0;
  if (px !== 0 || py !== 0) return { x: px, y: py };
  const col = index % 4;
  const row = Math.floor(index / 4);
  return { x: 100 + col * 180, y: 90 + row * 130 };
}

export function nodesNeedFlowsintLayout(nodes: Node[]): boolean {
  if (nodes.length <= 1) return false;
  return nodes.every((n) => (n.position?.x ?? 0) === 0 && (n.position?.y ?? 0) === 0);
}

export function layoutFlowsintNodes(nodes: Node[]): Node[] {
  return nodes.map((node, index) => ({
    ...node,
    position: ensureFlowPosition(node, index),
  }));
}
