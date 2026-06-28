import { useEffect, useState } from "react";
import clsx from "clsx";
import { Loader2, Play, Settings2, Square, UserPlus, X, Network } from "lucide-react";
import { TelegramIcon } from "../icons/TelegramIcon";
import { useActiveSession } from "../../hooks/useActiveSession";
import { useI18n } from "../../hooks/useI18n";
import { fetchTelegramStatus, telegramListDialogs } from "../../lib/telegramClient";
import { useWorkspaceStore } from "../../store/workspaceStore";

export function TelegramMonitorPanel() {
  const copy = useI18n();
  const session = useActiveSession();
  const config = useWorkspaceStore((s) => s.integrationConfig);
  const openSettings = useWorkspaceStore((s) => s.openSettings);
  const joinTelegramChat = useWorkspaceStore((s) => s.joinTelegramChat);
  const startTelegramMonitor = useWorkspaceStore((s) => s.startTelegramMonitor);
  const stopTelegramMonitor = useWorkspaceStore((s) => s.stopTelegramMonitor);
  const loadTelegramHistory = useWorkspaceStore((s) => s.loadTelegramHistory);
  const addMonitoredChat = useWorkspaceStore((s) => s.addMonitoredChat);
  const removeMonitoredChat = useWorkspaceStore((s) => s.removeMonitoredChat);
  const addStreamEventToGraph = useWorkspaceStore((s) => s.addStreamEventToGraph);

  const [joinTarget, setJoinTarget] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [dialogs, setDialogs] = useState<{ id: string; title: string; username?: string; kind: string }[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

  const credsConfigured = !!config.telegramApiId && !!config.telegramApiHash;

  useEffect(() => {
    if (!credsConfigured) {
      setAuthorized(false);
      setUsername(null);
      return;
    }
    void fetchTelegramStatus(config).then((s) => {
      setAuthorized(s.authorized);
      setUsername(s.username ?? null);
    });
  }, [config, credsConfigured]);

  useEffect(() => {
    if (!authorized || !credsConfigured) return;
    void telegramListDialogs(config).then((list) => {
      setDialogs(list.dialogs ?? []);
    });
  }, [authorized, credsConfigured, config]);

  if (!session) return null;

  const events = session.monitorStreams.telegram;
  const ready = credsConfigured && authorized;

  async function handleJoin() {
    setBusy("join");
    try {
      const res = await joinTelegramChat(joinTarget);
      setStatusMsg(res.message);
      setJoinTarget("");
      if (authorized) {
        const list = await telegramListDialogs(useWorkspaceStore.getState().integrationConfig);
        setDialogs(list.dialogs ?? []);
      }
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[320px] px-8 text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#229ED9]/10 flex items-center justify-center">
          <TelegramIcon size={40} />
        </div>
        <div className="max-w-md space-y-2">
          <h3 className="text-sm font-medium">{copy.telegram.connectTitle}</h3>
          <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed">
            {copy.telegram.connectDesc}
          </p>
        </div>
        <button
          type="button"
          className="btn-impact px-4 py-2 text-xs inline-flex items-center gap-2"
          onClick={() => openSettings("telegram")}
        >
          <Settings2 size={14} />
          {copy.telegram.openSettings}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0">
      <aside className="w-[min(100%,320px)] shrink-0 border-r border-[var(--color-border)] flex flex-col min-h-0 bg-[var(--color-surface-muted)]/40">
        <div className="p-4 border-b border-[var(--color-border)] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-mono text-[#229ED9] uppercase tracking-wider">
                {copy.telegram.connectedAs} @{username ?? "user"}
              </p>
            </div>
            <button
              type="button"
              className="p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]"
              onClick={() => openSettings("telegram")}
              aria-label={copy.telegram.openSettings}
            >
              <Settings2 size={14} />
            </button>
          </div>

          <div className="flex gap-2">
            <input
              value={joinTarget}
              onChange={(e) => setJoinTarget(e.target.value)}
              placeholder={copy.telegram.joinPlaceholder}
              className="surface-input flex-1 px-2.5 py-2 text-xs font-mono"
            />
            <button
              type="button"
              className="btn-secondary px-3 py-2 text-[11px] inline-flex items-center gap-1 shrink-0"
              disabled={!!busy || !joinTarget.trim()}
              onClick={() => void handleJoin()}
            >
              <UserPlus size={12} />
              {copy.telegram.join}
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4">
          <section>
            <p className="stratir-label mb-2">{copy.telegram.dialogs}</p>
            {dialogs.length === 0 ? (
              <p className="text-[11px] text-[var(--color-text-tertiary)]">{copy.telegram.dialogsEmpty}</p>
            ) : (
              <div className="space-y-1">
                {dialogs.slice(0, 20).map((d) => {
                  const watched = session.telegram.monitoredChats.some((c) => c.id === d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      className={clsx(
                        "w-full text-left px-2.5 py-2 text-[11px] border transition-colors",
                        watched
                          ? "border-[#229ED9] bg-[#229ED9]/5"
                          : "border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]",
                      )}
                      onClick={() => {
                        addMonitoredChat({
                          id: d.id,
                          title: d.title,
                          username: d.username ?? null,
                          platform: "telegram",
                        });
                        void loadTelegramHistory(d.id);
                      }}
                    >
                      <span className="font-medium block truncate">{d.title}</span>
                      <span className="text-[var(--color-text-tertiary)]">{d.kind}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {session.telegram.monitoredChats.length > 0 && (
            <section>
              <p className="stratir-label mb-2">{copy.telegram.watched}</p>
              <div className="flex flex-wrap gap-1.5">
                {session.telegram.monitoredChats.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1 text-[10px] px-2 py-1 border border-[#229ED9] text-[#229ED9] font-mono bg-[#229ED9]/5"
                  >
                    {c.title}
                    <button
                      type="button"
                      className="hover:text-[var(--stratir-impact)]"
                      onClick={() => removeMonitoredChat(c.id, "telegram")}
                      aria-label={copy.telegram.removeChat}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="p-3 border-t border-[var(--color-border)] space-y-2 shrink-0">
          <div className="flex gap-2 items-center">
            {!session.telegram.monitoringActive ? (
              <button
                type="button"
                className="btn-impact flex-1 px-3 py-2 text-[11px] inline-flex items-center justify-center gap-1.5"
                onClick={() => void startTelegramMonitor()}
              >
                <Play size={12} />
                {copy.telegram.startMonitor}
              </button>
            ) : (
              <button
                type="button"
                className="btn-secondary flex-1 px-3 py-2 text-[11px] inline-flex items-center justify-center gap-1.5"
                onClick={() => void stopTelegramMonitor()}
              >
                <Square size={12} />
                {copy.telegram.stopMonitor}
              </button>
            )}
            {session.telegram.monitoringActive && (
              <span className="text-[10px] text-emerald-600 inline-flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {copy.telegram.live}
              </span>
            )}
          </div>
          {statusMsg && <p className="text-[10px] text-[var(--color-text-secondary)] font-mono">{statusMsg}</p>}
        </div>
      </aside>

      <main className="flex-1 min-h-0 flex flex-col min-w-0">
        <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between gap-3 shrink-0">
          <div>
            <p className="stratir-label">{copy.telegram.streamTitle}</p>
            <p className="text-[11px] text-[var(--color-text-tertiary)] font-mono">{events.length} messages</p>
          </div>
          {session.telegram.monitoringActive && (
            <span className="text-[10px] text-emerald-600 inline-flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" />
              {copy.telegram.ingesting}
            </span>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
          {events.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6 gap-2">
              <p className="text-[12px] text-[var(--color-text-secondary)]">{copy.telegram.streamEmpty}</p>
              <p className="text-[11px] text-[var(--color-text-tertiary)] max-w-sm">{copy.telegram.streamHint}</p>
            </div>
          ) : (
            events.map((ev) => (
              <article
                key={`${ev.chatId}-${ev.id}`}
                className="surface-card p-3 space-y-2 border-l-2 border-l-[#229ED9]/60"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium truncate">{ev.chatTitle}</p>
                    <p className="text-[10px] text-[var(--color-text-tertiary)] font-mono">
                      {ev.senderName ?? ev.senderId ?? "unknown"} · {new Date(ev.observedAt).toLocaleTimeString()}
                    </p>
                  </div>
                  {!ev.graphNodeId ? (
                    <button
                      type="button"
                      className="btn-secondary px-2.5 py-1 text-[10px] shrink-0 inline-flex items-center gap-1"
                      onClick={() => addStreamEventToGraph(ev.id, "telegram")}
                    >
                      <Network size={11} />
                      {copy.telegram.addToGraph}
                    </button>
                  ) : (
                    <span className="text-[9px] px-2 py-0.5 border border-emerald-500/40 text-emerald-600 font-mono shrink-0">
                      {copy.telegram.onGraph}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {ev.text}
                </p>
                {ev.signals.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {ev.signals.map((sig) => (
                      <span
                        key={sig}
                        className="text-[9px] px-1.5 py-0.5 bg-[var(--color-accent-soft)] border border-[var(--color-border)]"
                      >
                        {sig}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
