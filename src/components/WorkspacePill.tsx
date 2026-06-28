import { Settings, HelpCircle } from "lucide-react";
import { useI18n } from "../hooks/useI18n";

interface WorkspacePillProps {
  workspaceName: string;
  caseName: string;
  onOpenSettings: () => void;
}

export function WorkspacePill({
  workspaceName,
  caseName,
  onOpenSettings,
}: WorkspacePillProps) {
  const copy = useI18n();

  return (
    <header className="flex items-center justify-between gap-4">
      <div className="glass-panel inline-flex items-center gap-3 px-4 py-2 rounded-full">
        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-text-muted font-medium">
            {workspaceName}
          </p>
          <p className="text-sm text-text-primary tracking-tight">{caseName}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSettings}
          className="glass-panel flex items-center gap-2 px-3 py-2 text-xs text-text-muted hover:text-text-primary transition-colors"
          aria-label={copy.settings.title}
        >
          <Settings size={14} />
          <span className="hidden sm:inline">{copy.settings.title}</span>
        </button>
        <button
          className="glass-panel p-2 text-text-muted hover:text-text-primary transition-colors"
          aria-label="Help"
        >
          <HelpCircle size={14} />
        </button>
      </div>
    </header>
  );
}
