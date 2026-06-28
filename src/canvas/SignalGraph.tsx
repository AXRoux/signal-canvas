import { useWorkspaceStore } from "../store/workspaceStore";
import { ViewErrorBoundary } from "../components/ViewErrorBoundary";
import { StratirGraph } from "./stratir/StratirGraph";
import { FlowsintGraph } from "./flowsint/FlowsintGraph";

export function SignalGraph({ compact = false }: { compact?: boolean }) {
  const graphStyle = useWorkspaceStore((s) => s.graphStyle);

  if (graphStyle === "flowsint") {
    return (
      <ViewErrorBoundary label="flowsint-graph">
        <FlowsintGraph compact={compact} />
      </ViewErrorBoundary>
    );
  }

  return (
    <ViewErrorBoundary label="stratir-graph">
      <StratirGraph compact={compact} />
    </ViewErrorBoundary>
  );
}
