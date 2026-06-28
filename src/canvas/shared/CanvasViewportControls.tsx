import { Maximize2, Minus, Plus } from "lucide-react";
import clsx from "clsx";

export function CanvasViewportControls({
  compact,
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  compact?: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}) {
  return (
    <div
      className={clsx(
        "custom-canvas-controls flex flex-col border border-[var(--color-border)] bg-[var(--color-surface)]",
        compact ? "absolute left-3 bottom-3" : "absolute left-4 bottom-4",
      )}
    >
      <button type="button" onClick={onZoomIn} className="custom-canvas-control-btn" aria-label="Zoom in">
        <Plus size={14} />
      </button>
      <button type="button" onClick={onZoomOut} className="custom-canvas-control-btn" aria-label="Zoom out">
        <Minus size={14} />
      </button>
      <button type="button" onClick={onReset} className="custom-canvas-control-btn" aria-label="Reset view">
        <Maximize2 size={13} />
      </button>
    </div>
  );
}
