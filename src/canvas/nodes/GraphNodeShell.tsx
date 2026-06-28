import clsx from "clsx";
import type { CSSProperties, ReactNode } from "react";
import { NodeAgentBadge } from "../../components/canvas/NodeAgentBadge";

interface GraphNodeShellProps {
  nodeId: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function GraphNodeShell({ nodeId, className, style, children }: GraphNodeShellProps) {
  return (
    <div className={clsx("graph-node-shell", className)} style={style}>
      <NodeAgentBadge nodeId={nodeId} />
      {children}
    </div>
  );
}
