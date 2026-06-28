import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import clsx from "clsx";
import { useI18n } from "../../hooks/useI18n";
import { useSessionSelector } from "../../store/workspaceStore";
import { nodeMatchesWatchlist } from "../../lib/telegramGraphOps";
import { GraphNodeShell } from "./GraphNodeShell";
import type { TelegramNodeData } from "../../lib/telegramNodeData";

export type TelegramNodeType = import("@xyflow/react").Node<TelegramNodeData, "telegram">;

const riskColors = {
  low: "border-emerald-300 text-emerald-700",
  medium: "border-[var(--color-accent)] text-[var(--color-accent)]",
  high: "border-red-300 text-red-700",
};

function TelegramNodeComponent({ id, data, selected }: NodeProps<TelegramNodeType>) {
  const copy = useI18n();
  const watchlist = useSessionSelector((s) => s.watchlist, []);
  const watched = nodeMatchesWatchlist(
    { id, data, position: { x: 0, y: 0 } } as TelegramNodeType,
    watchlist,
  );

  return (
    <GraphNodeShell
      nodeId={id}
      className={clsx(
        "graph-node surface-card transition-all duration-200 border w-[160px] max-w-[160px] px-3 py-2.5",
        riskColors[data.risk],
        selected && "outline outline-2 outline-[var(--color-accent)] outline-offset-2",
        data.isNew && "node-pulse",
        watched && "graph-node-watched",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[var(--color-accent)] !w-2 !h-2 !border-0 !rounded-none"
      />
      <div className="graph-node-label mb-1">{copy.nodes.telegram}</div>
      <div className="graph-node-id truncate">{data.label}</div>
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

export const TelegramNode = memo(TelegramNodeComponent);
