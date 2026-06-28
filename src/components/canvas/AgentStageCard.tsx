import { createPortal } from "react-dom";
import { X, Check, MessageSquare } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { HermesIcon } from "../icons/HermesIcon";
import { NvidiaIcon } from "../icons/NvidiaIcon";
import type { AgentPresence } from "../../store/types";

interface AgentStageCardProps {
  presence: AgentPresence | null;
  onClose: () => void;
  onAccept?: () => void;
}

export function AgentStageCard({ presence, onClose, onAccept }: AgentStageCardProps) {
  const copy = useI18n();
  if (!presence) return null;

  const Icon = presence.agent === "nemotron" ? NvidiaIcon : HermesIcon;

  return createPortal(
    <div className="agent-stage-backdrop" onClick={onClose}>
      <div className="agent-stage-card stratir-frame" onClick={(e) => e.stopPropagation()}>
        <div className="agent-stage-header">
          <div className="flex items-center gap-2">
            <span className="agent-stage-icon-wrap">
              <Icon size={16} />
            </span>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
                {presence.agent} · {presence.status.replace("_", " ")}
              </p>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{presence.stage}</h3>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-[var(--color-surface-muted)]">
            <X size={14} />
          </button>
        </div>
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mt-3">{presence.detail}</p>
        {presence.recommendations && presence.recommendations.length > 0 && (
          <div className="mt-4">
            <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2">
              {copy.agent.recommendations}
            </p>
            <ul className="space-y-1.5">
              {presence.recommendations.map((rec) => (
                <li key={rec} className="flex items-start gap-2 text-xs text-[var(--color-text-primary)]">
                  <MessageSquare size={12} className="mt-0.5 shrink-0 text-[var(--stratir-signal)]" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="btn-secondary px-3 py-1.5 text-xs">
            {copy.agent.dismiss}
          </button>
          {presence.status === "waiting_review" && onAccept && (
            <button type="button" onClick={onAccept} className="btn-impact px-3 py-1.5 text-xs flex items-center gap-1">
              <Check size={12} />
              {copy.agent.acceptStage}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
