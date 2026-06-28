import { useCallback, useMemo } from "react";
import clsx from "clsx";
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  MiniMap,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AccountNode } from "../nodes/AccountNode";
import { KeywordNode } from "../nodes/KeywordNode";
import { PlatformNode } from "../nodes/PlatformNode";
import { TelegramNode } from "../nodes/TelegramNode";
import { SignalEdge } from "../edges/SignalEdge";
import { useWorkspaceStore, useSessionSelector } from "../../store/workspaceStore";
import { GraphStyleContext } from "../../hooks/useGraphStyle";
import { GraphCanvasEmpty } from "../shared/GraphCanvasEmpty";
import { WatchlistStrip } from "../shared/WatchlistStrip";

const nodeTypes = {
  account: AccountNode,
  keyword: KeywordNode,
  platform: PlatformNode,
  telegram: TelegramNode,
};

const edgeTypes = {
  signal: SignalEdge,
};

function StratirGraphInner({ compact = false }: { compact?: boolean }) {
  const nodes = useSessionSelector((s) => s.nodes, []);
  const edges = useSessionSelector((s) => s.edges, []);
  const watchlist = useSessionSelector((s) => s.watchlist, []);
  const selectedNodeId = useSessionSelector((s) => s.selectedNodeId, null);
  const agentPresences = useSessionSelector((s) => s.agentPresences, []);
  const agentRunning = useWorkspaceStore((s) => s.agentRunning);

  const onNodesChange = useWorkspaceStore((s) => s.onNodesChange);
  const onEdgesChange = useWorkspaceStore((s) => s.onEdgesChange);
  const onConnect = useWorkspaceStore((s) => s.onConnect);
  const setSelectedNodeId = useWorkspaceStore((s) => s.setSelectedNodeId);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => setSelectedNodeId(node.id),
    [setSelectedNodeId],
  );

  const onPaneClick = useCallback(() => setSelectedNodeId(null), [setSelectedNodeId]);

  const defaultViewport = useMemo(() => ({ x: 0, y: 0, zoom: 0.88 }), []);

  const flowNodes = useMemo(
    () => nodes.map((n) => ({ ...n, selected: n.id === selectedNodeId })),
    [nodes, selectedNodeId],
  );

  const flowEdges = useMemo(
    () => edges.map((e) => ({ ...e, type: "signal" })),
    [edges],
  );

  const showEmpty = nodes.length === 0 && !agentRunning && agentPresences.length === 0;

  return (
    <GraphStyleContext.Provider value="stratir">
      <div className="graph-style-stratir w-full h-full relative">
        {showEmpty && <GraphCanvasEmpty />}
        <WatchlistStrip keywords={watchlist} />

        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultViewport={defaultViewport}
          fitView={nodes.length > 0}
          fitViewOptions={{ padding: 0.25, duration: 400 }}
          proOptions={{ hideAttribution: true }}
          className="bg-transparent signal-flow"
          minZoom={0.35}
          maxZoom={1.8}
          snapToGrid
          snapGrid={[16, 16]}
          connectOnClick
        >
          <Controls
            showInteractive={false}
            position="bottom-left"
            className={compact ? "!left-3 !bottom-3" : undefined}
          />
          <MiniMap
            nodeColor={() => "var(--stratir-signal)"}
            maskColor="color-mix(in srgb, var(--color-surface-muted) 70%, transparent)"
            className={clsx(
              "!overflow-hidden",
              compact ? "!bottom-3 !right-3 !w-[120px] !h-[80px]" : "!bottom-4 !right-4",
            )}
            pannable
            zoomable
          />
        </ReactFlow>
      </div>
    </GraphStyleContext.Provider>
  );
}

export function StratirGraph({ compact = false }: { compact?: boolean }) {
  return (
    <ReactFlowProvider>
      <StratirGraphInner compact={compact} />
    </ReactFlowProvider>
  );
}
