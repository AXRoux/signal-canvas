import { useCallback, useEffect, useMemo, useRef } from "react";
import clsx from "clsx";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeChange,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useI18n } from "../../hooks/useI18n";
import { edgesForDisplayNodes } from "../../lib/graphDisplayNodes";
import { useWorkspaceStore, useSessionSelector } from "../../store/workspaceStore";
import { GraphCanvasEmpty } from "../shared/GraphCanvasEmpty";
import { WatchlistStrip } from "../shared/WatchlistStrip";
import { GraphStyleContext } from "../../hooks/useGraphStyle";
import { SignalEdge } from "../edges/SignalEdge";
import { FlowsintEntityNode } from "./FlowsintEntityNode";
import {
  flowsintDisplayNodes,
  toFlowsintFlowEdges,
  toFlowsintFlowNodes,
} from "./flowsintFlowData";
import { nodeTypeColor } from "./flowsintColors";
import { nodesNeedFlowsintLayout } from "../../lib/flowsintLayout";
import { reactFlowColorMode } from "../../lib/themes";

const nodeTypes = { flowsintEntity: FlowsintEntityNode };
const edgeTypes = { signal: SignalEdge };

function FlowsintGraphInner({ compact = false }: { compact?: boolean }) {
  const copy = useI18n();
  const { fitView } = useReactFlow();
  const fitKeyRef = useRef("");

  const displayNodes = useSessionSelector((s) => flowsintDisplayNodes(s), []);
  const rawEdges = useSessionSelector((s) => s.edges, []);
  const watchlist = useSessionSelector((s) => s.watchlist, []);
  const selectedNodeId = useSessionSelector((s) => s.selectedNodeId, null);
  const agentRunning = useWorkspaceStore((s) => s.agentRunning);
  const theme = useWorkspaceStore((s) => s.theme);
  const flowColorMode = reactFlowColorMode(theme);

  const storeOnNodesChange = useWorkspaceStore((s) => s.onNodesChange);
  const onEdgesChange = useWorkspaceStore((s) => s.onEdgesChange);
  const onConnect = useWorkspaceStore((s) => s.onConnect);
  const setSelectedNodeId = useWorkspaceStore((s) => s.setSelectedNodeId);
  const ensureFlowsintLayout = useWorkspaceStore((s) => s.ensureFlowsintLayout);

  const needsLayout = useMemo(
    () => nodesNeedFlowsintLayout(displayNodes),
    [displayNodes],
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const storeChanges = changes.filter(
        (change) => change.type === "position" || change.type === "dimensions" || change.type === "remove",
      );
      if (storeChanges.length > 0) storeOnNodesChange(storeChanges);
    },
    [storeOnNodesChange],
  );

  const nodeIds = useMemo(() => new Set(displayNodes.map((n) => n.id)), [displayNodes]);
  const edges = useMemo(() => edgesForDisplayNodes(rawEdges, nodeIds), [rawEdges, nodeIds]);

  const flowNodes = useMemo(
    () => toFlowsintFlowNodes(displayNodes, { selectedNodeId }),
    [displayNodes, selectedNodeId],
  );

  const flowEdges = useMemo(() => toFlowsintFlowEdges(edges, nodeIds), [edges, nodeIds]);

  const showEmpty = displayNodes.length === 0 && !agentRunning;

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => setSelectedNodeId(node.id),
    [setSelectedNodeId],
  );

  const onPaneClick = useCallback(() => setSelectedNodeId(null), [setSelectedNodeId]);

  useEffect(() => {
    if (showEmpty || !needsLayout) return;
    ensureFlowsintLayout();
  }, [ensureFlowsintLayout, needsLayout, showEmpty]);

  useEffect(() => {
    const key = displayNodes.map((n) => n.id).join(",");
    if (showEmpty || fitKeyRef.current === key) return;
    fitKeyRef.current = key;
    requestAnimationFrame(() => {
      void fitView({ padding: 0.28, duration: 320 });
    });
  }, [displayNodes, fitView, showEmpty]);

  return (
    <GraphStyleContext.Provider value="flowsint">
      <div className="graph-style-flowsint flowsint-graph w-full h-full relative">
        <div className="flowsint-graph-chrome">
          <span className="flowsint-graph-badge">{copy.graph.flowsint}</span>
          {!showEmpty && (
            <span className="flowsint-graph-hint">{copy.graph.flowsintHint}</span>
          )}
        </div>

        {showEmpty && <GraphCanvasEmpty />}
        {!showEmpty && <WatchlistStrip keywords={watchlist} />}

        {!showEmpty && (
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            proOptions={{ hideAttribution: true }}
            className="flowsint-flow"
            colorMode={flowColorMode}
            minZoom={0.25}
            maxZoom={2}
            nodesDraggable
            nodesConnectable
            elementsSelectable
            selectNodesOnDrag={false}
            selectionOnDrag={false}
            panOnDrag
            panOnScroll
            zoomOnScroll
            multiSelectionKeyCode="Shift"
            nodeDragThreshold={2}
            connectOnClick
            snapToGrid
            snapGrid={[24, 24]}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1}
              color="var(--flowsint-dot-color)"
              className="flowsint-flow-bg"
            />
            <Controls
              showInteractive={false}
              position="bottom-left"
              className={clsx("flowsint-flow-controls", compact && "!left-3 !bottom-3")}
            />
            <MiniMap
              nodeColor={(node) => {
                const type = (node.data as { flowsintType?: string })?.flowsintType ?? "telegram";
                return nodeTypeColor(type);
              }}
              maskColor="color-mix(in srgb, var(--flowsint-card) 78%, transparent)"
              className={clsx(
                "flowsint-minimap",
                compact ? "!bottom-3 !right-3 !w-[118px] !h-[76px]" : "!bottom-4 !right-4",
              )}
              pannable
              zoomable
            />
          </ReactFlow>
        )}
      </div>
    </GraphStyleContext.Provider>
  );
}

export function FlowsintGraph({ compact = false }: { compact?: boolean }) {
  return (
    <ReactFlowProvider>
      <FlowsintGraphInner compact={compact} />
    </ReactFlowProvider>
  );
}
