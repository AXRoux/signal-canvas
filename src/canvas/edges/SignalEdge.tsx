import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { edgeRelationStyle, type EdgeRelation } from "../../lib/telegramGraphOps";

export function SignalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  label,
  animated,
  selected,
  data,
}: EdgeProps) {
  const relation = (data?.relationType as EdgeRelation | undefined) ?? "observed";
  const relationStyle = edgeRelationStyle(relation);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: animated || relation === "correlated" ? 0.45 : 0.32,
  });

  const stroke = (style?.stroke as string) ?? relationStyle.stroke;
  const strokeDasharray = (style?.strokeDasharray as string) ?? relationStyle.strokeDasharray;
  const strokeWidth = selected ? 2.5 : 1.75;

  return (
    <>
      <BaseEdge
        id={`${id}-glow`}
        path={edgePath}
        style={{
          stroke,
          strokeWidth: strokeWidth + 4,
          opacity: 0.14,
          filter: "blur(3px)",
        }}
      />
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke,
          strokeWidth,
          strokeDasharray,
          strokeLinecap: "round",
        }}
        className="signal-edge-animated"
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="signal-edge-label"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
