import { createPortal } from "react-dom";
import clsx from "clsx";
import { X, Clock, Loader2 } from "lucide-react";
import type { Node } from "@xyflow/react";
import { useI18n } from "../../hooks/useI18n";
import { HermesIcon } from "../icons/HermesIcon";
import { TelegramIcon } from "../icons/TelegramIcon";
import { buildNodeDetail, getNodeKind } from "../../lib/nodeDetail";
import { tasksForNodeType, type NodeHermesTaskId } from "../../lib/nodeHermesTasks";
import { useWorkspaceStore, useSessionSelector } from "../../store/workspaceStore";

interface GraphNodeDetailPanelProps {
  node: Node | null;
  onClose: () => void;
}

function NodeTypeMark({ node }: { node: Node }) {
  const kind = getNodeKind(node);
  if (kind === "telegram") return <TelegramIcon size={18} />;
  return <HermesIcon size={16} />;
}

export function GraphNodeDetailPanel({ node, onClose }: GraphNodeDetailPanelProps) {
  const copy = useI18n();
  const assignNodeHermesTask = useWorkspaceStore((s) => s.assignNodeHermesTask);
  const agentRunning = useWorkspaceStore((s) => s.agentRunning);
  const presences = useSessionSelector((s) => s.agentPresences, []);

  if (!node) return null;

  const detail = buildNodeDetail(node);
  const tasks = tasksForNodeType(node);
  const nodePresences = presences.filter(
    (p) => p.relatedNodeIds?.includes(node.id) && p.status !== "complete",
  );
  const taskLabels = copy.nodeDetail.tasks;

  async function handleAssign(taskId: NodeHermesTaskId) {
    await assignNodeHermesTask(node!.id, taskId);
  }

  return createPortal(
    <div className="agent-stage-backdrop" onClick={onClose}>
      <div
        className="agent-stage-card stratir-frame node-detail-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="agent-stage-header">
          <div className="flex items-start gap-3 min-w-0">
            <span className="agent-stage-icon-wrap shrink-0">
              <NodeTypeMark node={node} />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
                {copy.nodeDetail.types[detail.kind]}
              </p>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{detail.title}</h3>
              {detail.subtitle && (
                <p className="text-[11px] text-[var(--color-text-secondary)] truncate mt-0.5">{detail.subtitle}</p>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-[var(--color-surface-muted)] shrink-0">
            <X size={14} />
          </button>
        </div>

        {detail.meta.length > 0 && (
          <dl className="node-detail-meta mt-4">
            {detail.meta.map((row) => (
              <div key={row.label} className="node-detail-meta-row">
                <dt>{row.label}</dt>
                <dd className="truncate">{row.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {detail.observedAt && (
          <p className="text-[10px] text-[var(--color-text-tertiary)] font-mono mt-3 inline-flex items-center gap-1">
            <Clock size={11} />
            {new Date(detail.observedAt).toLocaleString()}
          </p>
        )}

        {detail.body && (
          <div className="mt-4">
            <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2">
              {copy.nodeDetail.messageBody}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto border border-[var(--color-border)] p-3 bg-[var(--color-surface-muted)]">
              {detail.body}
            </p>
          </div>
        )}

        {detail.signalTags.length > 0 && (
          <div className="mt-4">
            <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2">
              {copy.nodeDetail.signals}
            </p>
            <div className="flex flex-wrap gap-1">
              {detail.signalTags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] border border-[var(--color-border)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {detail.risk && (
          <p className="text-[10px] mt-3 capitalize">
            <span className="text-[var(--color-text-tertiary)]">{copy.nodeDetail.risk}: </span>
            <span
              className={clsx(
                detail.risk === "high" && "text-[var(--stratir-impact)]",
                detail.risk === "medium" && "text-[var(--color-accent)]",
                detail.risk === "low" && "text-emerald-600",
              )}
            >
              {copy.confidence[detail.risk]}
            </span>
          </p>
        )}

        {nodePresences.length > 0 && (
          <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
            <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2">
              {copy.nodeDetail.activeWork}
            </p>
            <ul className="space-y-2">
              {nodePresences.map((p) => (
                <li key={p.id} className="text-xs border border-[var(--color-border)] px-2.5 py-2 bg-[var(--color-surface-muted)]">
                  <span className="font-medium text-[var(--color-text-primary)]">{p.stage}</span>
                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">{p.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-2 mb-3">
            <HermesIcon size={14} />
            <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
              {copy.nodeDetail.hermesTasks}
            </p>
          </div>
          <p className="text-[11px] text-[var(--color-text-secondary)] mb-3 leading-relaxed">
            {copy.nodeDetail.hermesTasksDesc}
          </p>
          <div className="grid gap-2">
            {tasks.map((taskId) => {
              const task = taskLabels[taskId];
              return (
                <button
                  key={taskId}
                  type="button"
                  disabled={agentRunning}
                  className="node-detail-task-btn"
                  onClick={() => void handleAssign(taskId)}
                >
                  <span className="block text-xs font-medium text-[var(--color-text-primary)] text-left">
                    {task.title}
                  </span>
                  <span className="block text-[10px] text-[var(--color-text-secondary)] text-left mt-0.5 leading-relaxed">
                    {task.desc}
                  </span>
                </button>
              );
            })}
          </div>
          {agentRunning && (
            <p className="text-[10px] text-[var(--color-text-tertiary)] mt-3 inline-flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin" />
              {copy.nodeDetail.taskRunning}
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
