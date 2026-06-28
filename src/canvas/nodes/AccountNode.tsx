import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import clsx from "clsx";
import { useI18n } from "../../hooks/useI18n";
import { GraphNodeShell } from "./GraphNodeShell";

export type AccountNodeType = Node<AccountNodeData, "account">;

export interface AccountNodeData extends Record<string, unknown> {
  label: string;
  platform: string;
  risk: "low" | "medium" | "high";
  signals: number;
  isPrimary?: boolean;
  isNew?: boolean;
}

const riskColors = {
  low: "border-emerald-300 text-emerald-700",
  medium: "border-[var(--color-accent)] text-[var(--color-accent)]",
  high: "border-red-300 text-red-700",
};

function AccountNodeComponent({ id, data, selected }: NodeProps<AccountNodeType>) {
  const copy = useI18n();

  return (
    <GraphNodeShell
      nodeId={id}
      className={clsx(
        "graph-node surface-card min-w-[160px] px-3 py-2.5 transition-all duration-200 border",
        riskColors[data.risk],
        selected && "outline outline-2 outline-[var(--color-accent)] outline-offset-2",
        data.isNew && "node-pulse",
        data.isPrimary && "border-[var(--color-accent)]",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[var(--color-accent)] !w-2 !h-2 !border-0 !rounded-none"
      />
      <div className="graph-node-label mb-1">
        {data.platform}
        {data.isPrimary && ` · ${copy.nodes.primary}`}
      </div>
      <div className="graph-node-id">{data.label}</div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] text-[var(--color-text-secondary)]">
        <span>
          {data.signals} {copy.nodes.signals}
        </span>
        <span className="capitalize">{copy.confidence[data.risk]}</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[var(--color-accent)] !w-2 !h-2 !border-0 !rounded-none"
      />
    </GraphNodeShell>
  );
}

export const AccountNode = memo(AccountNodeComponent);
