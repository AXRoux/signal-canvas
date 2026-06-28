import { useI18n } from "../../hooks/useI18n";
import { useWorkspaceStore } from "../../store/workspaceStore";

export function GraphCanvasEmpty() {
  const copy = useI18n();
  const handleToolAction = useWorkspaceStore((s) => s.handleToolAction);

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
      <div className="stratir-frame surface-card px-8 py-5 text-center max-w-md pointer-events-auto">
        <p className="text-sm text-[var(--color-text-secondary)] mb-1 tracking-wide">{copy.canvas.emptyTitle}</p>
        <p className="text-[var(--color-text-primary)] text-sm tracking-tight leading-relaxed">{copy.canvas.emptyBody}</p>
        <p className="text-[11px] text-[var(--color-text-tertiary)] mt-3 leading-relaxed">{copy.canvas.emptyHint}</p>
        <button
          type="button"
          onClick={() => void handleToolAction("scan")}
          className="font-mono text-[11px] text-[var(--stratir-signal)] mt-3 px-3 py-1.5 bg-[var(--color-accent-soft)] border border-[var(--color-border)] inline-block hover:border-[var(--color-accent)] transition-colors"
        >
          {copy.canvas.emptyAction}
        </button>
      </div>
    </div>
  );
}
