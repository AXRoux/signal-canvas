import { Settings2 } from "lucide-react";
import { TelegramIcon } from "../components/icons/TelegramIcon";
import { TelegramMonitorPanel } from "../components/monitors/TelegramMonitorPanel";
import { useActiveSession } from "../hooks/useActiveSession";
import { useI18n } from "../hooks/useI18n";
import { useWorkspaceStore } from "../store/workspaceStore";

export function TelegramView() {
  const copy = useI18n();
  const session = useActiveSession();
  const openSettings = useWorkspaceStore((s) => s.openSettings);

  if (!session) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--color-surface)]">
      <header className="sc-chrome-bar gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#229ED9]/10 flex items-center justify-center shrink-0">
          <TelegramIcon size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="stratir-label">{copy.telegram.eyebrow}</p>
          <h2 className="text-sm font-display text-[var(--color-text-primary)] truncate">{session.caseName}</h2>
        </div>
        {session.telegram.monitoringActive && (
          <span className="text-[10px] px-2 py-1 rounded-full border border-emerald-500/40 text-emerald-600 font-mono shrink-0">
            {copy.telegram.live}
          </span>
        )}
        <button
          type="button"
          className="btn-secondary px-3 py-1.5 text-[11px] inline-flex items-center gap-1.5 shrink-0"
          onClick={() => openSettings("telegram")}
        >
          <Settings2 size={12} />
          {copy.telegram.connectionSettings}
        </button>
      </header>

      <div className="flex-1 min-h-0">
        <TelegramMonitorPanel />
      </div>
    </div>
  );
}
