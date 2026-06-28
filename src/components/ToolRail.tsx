import clsx from "clsx";
import {
  MousePointer2,
  Radar,
  Eye,
  Link2,
  FileText,
  Download,
} from "lucide-react";
import type { ToolId } from "../store/types";
import { useI18n } from "../hooks/useI18n";

const toolIcons: Record<ToolId, typeof Radar> = {
  select: MousePointer2,
  scan: Radar,
  watch: Eye,
  correlate: Link2,
  brief: FileText,
  export: Download,
};

const toolIds: ToolId[] = [
  "select",
  "scan",
  "watch",
  "correlate",
  "brief",
  "export",
];

interface ToolRailProps {
  activeTool: ToolId;
  onToolSelect: (tool: ToolId) => void;
}

export function ToolRail({ activeTool, onToolSelect }: ToolRailProps) {
  const copy = useI18n();

  return (
    <nav className="surface-card flex flex-col items-center gap-1 p-2 w-[52px] m-2 shrink-0 self-start">
      {toolIds.map((id) => {
        const Icon = toolIcons[id];
        const label = copy.tools[id];
        return (
          <button
            key={id}
            onClick={() => onToolSelect(id)}
            title={label}
            className={clsx(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150",
              activeTool === id
                ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]",
            )}
          >
            <Icon size={16} strokeWidth={1.75} />
          </button>
        );
      })}
    </nav>
  );
}
