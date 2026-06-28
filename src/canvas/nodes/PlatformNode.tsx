import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import clsx from "clsx";
import { useI18n } from "../../hooks/useI18n";
import { GraphNodeShell } from "./GraphNodeShell";

export type PlatformNodeType = Node<PlatformNodeData, "platform">;

export interface PlatformNodeData extends Record<string, unknown> {
  label: string;
  link: string;
  migration?: boolean;
}

function PlatformNodeComponent({ id, data, selected }: NodeProps<PlatformNodeType>) {
  const copy = useI18n();

  return (
    <GraphNodeShell
      nodeId={id}
      className={clsx(
        "graph-node surface-card min-w-[150px] px-3 py-2.5 border",
        data.migration ? "border-red-300" : "border-[var(--color-border)]",
        selected && "outline outline-2 outline-[var(--color-accent)] outline-offset-2",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[var(--color-accent)] !w-2 !h-2 !border-0"
      />
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">
        {copy.nodes.platform}
        {data.migration && (
          <span className="ml-1 text-red-600">· {copy.nodes.migration}</span>
        )}
      </div>
      <div className="text-sm text-[var(--color-text-primary)]">{data.label}</div>
      <div className="font-mono text-[10px] text-[var(--color-text-secondary)] mt-1 truncate">
        {data.link}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[var(--color-accent)] !w-2 !h-2 !border-0"
      />
    </GraphNodeShell>
  );
}

export const PlatformNode = memo(PlatformNodeComponent);
