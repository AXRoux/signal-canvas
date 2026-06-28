import { useEffect } from "react";
import clsx from "clsx";
import { Bot, Cpu, Zap } from "lucide-react";
import { useWorkspaceStore } from "../store/workspaceStore";
import { useActiveSession } from "../hooks/useActiveSession";
import { useI18n } from "../hooks/useI18n";

function StatusPill({
  label,
  online,
  icon: Icon,
}: {
  label: string;
  online: boolean;
  icon: typeof Bot;
}) {
  return (
    <div
      className={clsx(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border",
        online
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-[var(--color-surface-muted)] border-[var(--color-border)] text-[var(--color-text-secondary)]",
      )}
    >
      <Icon size={11} />
      <span
        className={clsx(
          "w-1.5 h-1.5 rounded-full",
          online ? "bg-emerald-500 animate-pulse" : "bg-[var(--color-border-strong)]",
        )}
      />
      {label}
    </div>
  );
}

export function AgentDock() {
  const copy = useI18n();
  const session = useActiveSession();
  const hermesOnline = useWorkspaceStore((s) => s.hermesOnline);
  const nvidiaReady = useWorkspaceStore((s) => s.nvidiaReady);
  const refreshAgentHealth = useWorkspaceStore((s) => s.refreshAgentHealth);

  useEffect(() => {
    refreshAgentHealth();
    const interval = setInterval(refreshAgentHealth, 15000);
    return () => clearInterval(interval);
  }, [refreshAgentHealth]);

  return (
    <div className="absolute bottom-4 left-4 right-20 z-20 pointer-events-none">
      <div className="surface-card inline-flex items-center gap-2 px-3 py-2 pointer-events-auto">
        <StatusPill label={copy.agent.hermes} online={hermesOnline} icon={Bot} />
        <StatusPill label={copy.agent.nemotron} online={nvidiaReady && hermesOnline} icon={Cpu} />
        <div className="w-px h-4 bg-[var(--color-border)] mx-0.5" />
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-secondary)]">
          <Zap size={10} className="text-[var(--color-accent)]" />
          <span>
            {hermesOnline ? copy.agent.modeLive : copy.agent.gatewayOffline}
            {session?.agentSource && ` · ${session.agentSource}`}
          </span>
        </div>
      </div>
    </div>
  );
}
