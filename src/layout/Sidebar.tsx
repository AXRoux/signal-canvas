import { useState } from "react";
import clsx from "clsx";
import { Plus, Search, LayoutGrid, FileStack, Settings, Pin, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { TelegramIcon } from "../components/icons/TelegramIcon";
import { useI18n } from "../hooks/useI18n";
import { useWorkspaceStore } from "../store/workspaceStore";
import type { AppTab, InvestigationSession } from "../store/types";
import type { Translations } from "../i18n/types";
import { SessionMenu } from "../components/sessions/SessionMenu";
import { CreateSessionModal } from "../components/sessions/CreateSessionModal";
import { useAuthStore } from "../store/authStore";
import { SignalCanvasLogo } from "../components/icons/SignalCanvasLogo";

const primaryTabs: {
  id: AppTab;
  icon: typeof LayoutGrid | typeof TelegramIcon;
  labelKey: keyof Pick<Translations["nav"], "canvas" | "artifacts" | "telegram">;
  brand?: boolean;
}[] = [
  { id: "canvas", icon: LayoutGrid, labelKey: "canvas" },
  { id: "telegram", icon: TelegramIcon, labelKey: "telegram", brand: true },
  { id: "artifacts", icon: FileStack, labelKey: "artifacts" },
];

export function Sidebar() {
  const copy = useI18n();
  const activeTab = useWorkspaceStore((s) => s.activeTab);
  const activeSessionId = useWorkspaceStore((s) => s.activeSessionId);
  const sessions = useWorkspaceStore((s) => s.sessions);
  const sessionSearch = useWorkspaceStore((s) => s.sessionSearch);
  const hermesOnline = useWorkspaceStore((s) => s.hermesOnline);

  const selectSession = useWorkspaceStore((s) => s.selectSession);
  const togglePinSession = useWorkspaceStore((s) => s.togglePinSession);
  const setActiveTab = useWorkspaceStore((s) => s.setActiveTab);
  const setSessionSearch = useWorkspaceStore((s) => s.setSessionSearch);
  const openSettings = useWorkspaceStore((s) => s.openSettings);
  const sidebarCollapsed = useWorkspaceStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useWorkspaceStore((s) => s.toggleSidebar);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [createOpen, setCreateOpen] = useState(false);
  const hasSession = !!activeSessionId;

  const sessionList = Object.values(sessions)
    .filter((s) => !s.archived && s.title.toLowerCase().includes(sessionSearch.toLowerCase()))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });

  const pinned = sessionList.filter((s) => s.pinned);
  const recent = sessionList.filter((s) => !s.pinned);

  return (
    <>
      <aside
        className={clsx(
          "surface-sidebar shrink-0 flex flex-col h-full transition-[width] duration-200 ease-out overflow-hidden",
          sidebarCollapsed ? "w-[56px]" : "w-[268px]",
        )}
      >
        <div className={clsx("sc-chrome-bar gap-3", sidebarCollapsed && "justify-center px-0")}>
          <div className="shrink-0 text-[var(--color-text-primary)]">
            <SignalCanvasLogo size={28} />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-[13px] font-display text-[var(--color-text-primary)] leading-tight truncate">
                Signal Canvas
              </p>
              <p className="stratir-label leading-tight mt-0.5">
                {copy.nav.reviewDesk}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className={clsx(
              "ml-auto p-1.5 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] shrink-0",
              sidebarCollapsed && "ml-0",
            )}
            aria-label={sidebarCollapsed ? copy.nav.expandSidebar : copy.nav.collapseSidebar}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
        </div>

        <nav className={clsx("px-2 py-2 space-y-0.5", sidebarCollapsed && "px-1")}>
          {primaryTabs.map(({ id, icon: Icon, labelKey, brand }) => (
            <button
              key={id}
              disabled={!hasSession}
              onClick={() => setActiveTab(id)}
              title={copy.nav[labelKey]}
              className={clsx(
                "sc-nav-tab",
                sidebarCollapsed && "justify-center px-2",
                activeTab === id && hasSession && "sc-nav-tab-active",
              )}
            >
              {brand ? <Icon size={15} /> : <Icon size={15} strokeWidth={1.75} />}
              {!sidebarCollapsed && copy.nav[labelKey]}
            </button>
          ))}
        </nav>

        {!sidebarCollapsed && (
        <div className="p-3 flex-1 min-h-0 flex flex-col gap-2">
          <button
            onClick={() => setCreateOpen(true)}
            className="sc-create-session"
          >
            <Plus size={15} />
            {copy.nav.newSession}
          </button>

          <div className="surface-input flex items-center gap-2 px-2.5 py-1.5">
            <Search size={13} className="text-[var(--color-text-tertiary)]" />
            <input
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              placeholder={copy.nav.searchSessions}
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-[var(--color-text-tertiary)]"
            />
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-visible space-y-3 min-h-0">
            {pinned.length > 0 && (
              <section>
                <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] px-1 mb-2">
                  {copy.nav.pinned}
                </p>
                <div className="space-y-2">
                  {pinned.map((s) => (
                    <SessionCard
                      key={s.id}
                      session={s}
                      active={s.id === activeSessionId}
                      onSelect={() => selectSession(s.id)}
                      onShiftPin={() => togglePinSession(s.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            <section>
              <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] px-1 mb-2 flex justify-between">
                <span>{copy.nav.sessions}</span>
                <span>{sessionList.length}</span>
              </p>
              {recent.length === 0 && pinned.length === 0 ? (
                <p className="text-[11px] text-[var(--color-text-tertiary)] px-1 py-2 leading-relaxed">
                  {copy.nav.noSessions}
                </p>
              ) : (
                <div className="space-y-2">
                  {recent.map((s) => (
                    <SessionCard
                      key={s.id}
                      session={s}
                      active={s.id === activeSessionId}
                      onSelect={() => selectSession(s.id)}
                      onShiftPin={() => togglePinSession(s.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
        )}

        {sidebarCollapsed && <div className="flex-1" />}

        <div
          className={clsx(
            "px-3 py-2.5 border-t border-[var(--color-border)] flex items-center shrink-0 gap-2",
            sidebarCollapsed ? "justify-center flex-col py-3" : "justify-between",
          )}
        >
          {!sidebarCollapsed && (
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-[var(--color-text-primary)] truncate">{user?.name}</p>
            <span
              className={clsx(
                "text-[10px]",
                hermesOnline
                  ? "text-emerald-500 font-medium"
                  : "text-[var(--color-text-tertiary)]",
              )}
            >
              {hermesOnline ? copy.agent.gatewayReady : copy.agent.gatewayOffline}
            </span>
          </div>
          )}
          <div className={clsx("flex items-center gap-1 shrink-0", sidebarCollapsed && "flex-col")}>
            {!sidebarCollapsed && (
            <button
              onClick={() => openSettings("account")}
              className="text-[11px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-2 py-1 rounded-md hover:bg-[var(--color-surface-muted)]"
            >
              {copy.settings.tabs.account}
            </button>
            )}
            <button
              onClick={() => openSettings()}
              className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]"
              aria-label={copy.settings.title}
            >
              <Settings size={13} />
            </button>
            {!sidebarCollapsed && (
            <button
              onClick={logout}
              className="text-[10px] text-[var(--color-text-tertiary)] hover:text-[var(--stratir-impact)] px-1.5"
            >
              {copy.auth.signOut}
            </button>
            )}
          </div>
        </div>
      </aside>

      <CreateSessionModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}

function SessionCard({
  session,
  active,
  onSelect,
  onShiftPin,
}: {
  session: InvestigationSession;
  active: boolean;
  onSelect: () => void;
  onShiftPin: () => void;
}) {
  const preview =
    (session.chatMessages?.length ?? 0) > 0
      ? session.chatMessages![session.chatMessages!.length - 1].content
      : session.caseName;

  return (
    <div
      className={clsx("sc-session-card group", active && "sc-session-card-active")}
      onClick={onSelect}
      onClickCapture={(e) => {
        if (e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          onShiftPin();
        }
      }}
    >
      <div className="sc-session-accent" />
      <div className="sc-session-body">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="truncate text-[12px] font-medium text-[var(--color-text-primary)]">
              {session.title}
            </p>
            {session.pinned && <Pin size={10} className="text-[var(--color-accent)] shrink-0" />}
          </div>
          <p className="text-[10px] truncate text-[var(--color-text-tertiary)]">{preview}</p>
        </div>
        <SessionMenu session={session} />
      </div>
    </div>
  );
}
