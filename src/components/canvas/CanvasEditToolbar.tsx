import { useWorkspaceStore } from "../../store/workspaceStore";
import { useActiveSession } from "../../hooks/useActiveSession";
import { useI18n } from "../../hooks/useI18n";

export function CanvasEditToolbar() {
  const copy = useI18n();
  const session = useActiveSession();
  const removeGraphNode = useWorkspaceStore((s) => s.removeGraphNode);
  const attachAgentToNode = useWorkspaceStore((s) => s.attachAgentToNode);
  const acceptAllPendingOps = useWorkspaceStore((s) => s.acceptAllPendingOps);

  if (!session) return null;
  const selectedNode = session.selectedNodeId;
  const pending = session.pendingOps.filter((o) => o.status === "pending").length;

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
      <span className="stratir-label">{copy.canvas.editTools}</span>
      <button
        type="button"
        disabled={!selectedNode}
        className="btn-secondary px-2 py-1 text-[10px] disabled:opacity-40"
        onClick={() => selectedNode && removeGraphNode(selectedNode)}
      >
        {copy.canvas.deleteNode}
      </button>
      <button
        type="button"
        disabled={!selectedNode}
        className="btn-secondary px-2 py-1 text-[10px] disabled:opacity-40"
        onClick={() => selectedNode && attachAgentToNode(selectedNode)}
      >
        {copy.canvas.attachAgent}
      </button>
      {pending > 0 && (
        <button type="button" className="btn-impact px-2 py-1 text-[10px]" onClick={() => acceptAllPendingOps()}>
          {copy.canvas.acceptPending.replace("{count}", String(pending))}
        </button>
      )}
    </div>
  );
}
