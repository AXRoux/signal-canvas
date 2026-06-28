import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import clsx from "clsx";
import { MoreVertical } from "lucide-react";
import { GraphNodeShell } from "../nodes/GraphNodeShell";
import { FlowsintTypeIcon } from "./flowsintNodeIcons";

export interface FlowsintEntityData extends Record<string, unknown> {
  label: string;
  flowsintType: string;
  flowsintTypeLabel: string;
  flowsintSummary?: string;
  flowsintColor: string;
  risk?: "low" | "medium" | "high";
  isNew?: boolean;
}

export type FlowsintEntityNodeType = Node<FlowsintEntityData, "flowsintEntity">;

function FlowsintEntityNodeComponent({ id, data, selected }: NodeProps<FlowsintEntityNodeType>) {
  return (
    <GraphNodeShell
      nodeId={id}
      className={clsx(
        "flowsint-orbit-node",
        selected && "flowsint-orbit-node-selected",
        data.isNew && "node-pulse",
      )}
      style={{ ["--flowsint-type-color" as string]: data.flowsintColor }}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        className="flowsint-orbit-handle flowsint-orbit-handle-top"
      />

      <div className="flowsint-orbit-stack">
        <div className="flowsint-orbit-circle">
          <FlowsintTypeIcon type={data.flowsintType} />
        </div>
        <div className="flowsint-orbit-label-wrap">
          <span className="flowsint-orbit-label">{data.label}</span>
        </div>
      </div>

      {selected && (
        <button
          type="button"
          className="flowsint-orbit-menu nodrag nopan"
          aria-label="Node actions"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical size={14} strokeWidth={2} />
        </button>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        className="flowsint-orbit-handle flowsint-orbit-handle-bottom"
      />
    </GraphNodeShell>
  );
}

export const FlowsintEntityNode = memo(FlowsintEntityNodeComponent);
