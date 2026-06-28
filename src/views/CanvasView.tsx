import { useCallback, useMemo } from "react";
import { useActiveSession } from "../hooks/useActiveSession";
import { useI18n } from "../hooks/useI18n";
import { useWorkspaceStore } from "../store/workspaceStore";
import { SignalGraph } from "../canvas/SignalGraph";
import { AgentStageCard } from "../components/canvas/AgentStageCard";
import { GraphNodeDetailPanel } from "../components/canvas/GraphNodeDetailPanel";
import { InvestigationChatPanel } from "../components/investigation/InvestigationChatPanel";
import { InvestigationToolbar } from "../components/investigation/InvestigationToolbar";
import { RiskSummaryStrip } from "../components/investigation/RiskSummaryStrip";
import { CanvasEditToolbar } from "../components/canvas/CanvasEditToolbar";

export function CanvasView() {
  const copy = useI18n();
  const session = useActiveSession();
  const handleToolAction = useWorkspaceStore((s) => s.handleToolAction);
  const setScanTarget = useWorkspaceStore((s) => s.setScanTarget);
  const setSelectedNodeId = useWorkspaceStore((s) => s.setSelectedNodeId);
  const setActivePresenceId = useWorkspaceStore((s) => s.setActivePresenceId);
  const dismissAgentPresence = useWorkspaceStore((s) => s.dismissAgentPresence);

  const activePresence =
    session?.agentPresences.find((p) => p.id === session.activePresenceId) ?? null;

  const selectedNode = useMemo(
    () => session?.nodes.find((n) => n.id === session.selectedNodeId) ?? null,
    [session?.nodes, session?.selectedNodeId],
  );

  const handleAcceptStage = useCallback(() => {
    if (session?.activePresenceId) dismissAgentPresence(session.activePresenceId);
    setActivePresenceId(null);
  }, [session?.activePresenceId, dismissAgentPresence, setActivePresenceId]);

  if (!session) return null;

  const scanReady =
    session.scanLoaded ||
    session.nodes.length > 0 ||
    session.monitorStreams.telegram.length > 0;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="sc-chrome-bar gap-4 bg-[var(--color-surface)] flex-wrap">
        <div className="min-w-0 flex-1">
          <p className="stratir-label truncate leading-tight">
            {session.workspaceName}
          </p>
          <h2 className="text-sm font-display text-[var(--color-text-primary)] truncate leading-tight">
            {session.caseName}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="surface-input flex items-center gap-2 px-2 py-1.5 min-w-[140px]">
            <span className="font-mono text-[9px] uppercase text-[var(--color-text-tertiary)] shrink-0">
              {copy.canvas.scanTarget}
            </span>
            <input
              value={session.scanTarget}
              onChange={(e) => setScanTarget(e.target.value)}
              className="w-28 bg-transparent text-xs font-mono outline-none"
              placeholder="@handle"
            />
          </div>
          <InvestigationToolbar
            activeTool={session.activeTool}
            scanLoaded={scanReady}
            onToolSelect={(tool) => void handleToolAction(tool)}
          />
        </div>
      </header>

      <CanvasEditToolbar />

      <div className="flex-1 flex min-h-0">
        <section className="flex-1 min-w-0 relative bg-[var(--color-surface-muted)]">
          <SignalGraph compact />
        </section>

        <aside className="w-[min(320px,28vw)] shrink-0 border-l border-[var(--color-border)] flex flex-col min-h-0 bg-[var(--color-surface)]">
          {session.riskReview && <RiskSummaryStrip review={session.riskReview} />}
          <div className="flex-1 min-h-0">
            <InvestigationChatPanel />
          </div>
        </aside>
      </div>

      <GraphNodeDetailPanel node={selectedNode} onClose={() => setSelectedNodeId(null)} />

      <AgentStageCard
        presence={activePresence}
        onClose={() => setActivePresenceId(null)}
        onAccept={handleAcceptStage}
      />
    </div>
  );
}
