import clsx from "clsx";
import {
  MousePointer2,
  Radar,
  Eye,
  Link2,
  FileText,
  Download,
} from "lucide-react";
import type { ToolId } from "../../store/types";
import { useI18n } from "../../hooks/useI18n";

const toolIcons: Record<ToolId, typeof Radar> = {
  select: MousePointer2,
  scan: Radar,
  watch: Eye,
  correlate: Link2,
  brief: FileText,
  export: Download,
};

const fullTools: ToolId[] = ["scan", "watch", "correlate", "brief", "export"];

interface InvestigationToolbarProps {
  activeTool: ToolId;
  scanLoaded: boolean;
  onToolSelect: (tool: ToolId) => void;
}

export function InvestigationToolbar({
  activeTool,
  scanLoaded,
  onToolSelect,
}: InvestigationToolbarProps) {
  const copy = useI18n();
  const toolIds = fullTools;

  return (
    <div className="flex items-center gap-1 shrink-0">
      {toolIds.map((id) => {
        const Icon = toolIcons[id];
        const disabled = (id === "correlate" || id === "brief" || id === "export") && !scanLoaded;
        return (
          <button
            key={id}
            onClick={() => onToolSelect(id)}
            disabled={disabled}
            title={copy.tools[id]}
            className={clsx(
              "h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs transition-all border",
              activeTool === id
                ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-[var(--color-accent)] border-opacity-30"
                : "border-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]",
              disabled && "opacity-40 cursor-not-allowed",
            )}
          >
            <Icon size={14} strokeWidth={1.75} />
            <span className="hidden lg:inline">{copy.tools[id]}</span>
          </button>
        );
      })}
    </div>
  );
}
