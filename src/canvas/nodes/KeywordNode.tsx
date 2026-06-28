import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import clsx from "clsx";
import { useI18n } from "../../hooks/useI18n";
import { GraphNodeShell } from "./GraphNodeShell";

export type KeywordNodeType = Node<KeywordNodeData, "keyword">;

export interface KeywordNodeData extends Record<string, unknown> {
  label: string;
  keywords: string[];
  count: number;
}

function KeywordNodeComponent({ id, data, selected }: NodeProps<KeywordNodeType>) {
  const copy = useI18n();

  return (
    <GraphNodeShell
      nodeId={id}
      className={clsx(
        "graph-node surface-card min-w-[180px] px-3 py-2.5 border border-[var(--color-accent)]",
        selected && "outline outline-2 outline-[var(--color-accent)] outline-offset-2",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[var(--color-accent)] !w-2 !h-2 !border-0"
      />
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-accent)] mb-1">
        {copy.nodes.keywordCluster}
      </div>
      <div className="text-xs text-[var(--color-text-primary)] mb-2">{data.label}</div>
      <div className="flex flex-wrap gap-1">
        {data.keywords.map((kw) => (
          <span
            key={kw}
            className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
          >
            {kw}
          </span>
        ))}
      </div>
      <div className="mt-2 text-[10px] text-[var(--color-text-secondary)]">
        {data.count} {copy.nodes.occurrences}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[var(--color-accent)] !w-2 !h-2 !border-0"
      />
    </GraphNodeShell>
  );
}

export const KeywordNode = memo(KeywordNodeComponent);
