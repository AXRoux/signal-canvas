import { Sidebar } from "./Sidebar";
import { WelcomeView } from "./WelcomeView";
import { CanvasView } from "../views/CanvasView";
import { ArtifactsView } from "../views/ArtifactsView";
import { TelegramView } from "../views/TelegramView";
import { CommandPalette } from "../components/CommandPalette";
import { useCommandPaletteShortcut } from "../hooks/useCommandPaletteShortcut";
import { useWorkspaceStore } from "../store/workspaceStore";
import clsx from "clsx";
import { ViewErrorBoundary } from "../components/ViewErrorBoundary";

export function AppShell() {
  const theme = useWorkspaceStore((s) => s.theme);
  const activeSessionId = useWorkspaceStore((s) => s.activeSessionId);
  const activeTab = useWorkspaceStore((s) => s.activeTab);
  const commandPaletteOpen = useWorkspaceStore((s) => s.commandPaletteOpen);
  const openCommandPalette = useWorkspaceStore((s) => s.openCommandPalette);
  const closeCommandPalette = useWorkspaceStore((s) => s.closeCommandPalette);
  const executeCommand = useWorkspaceStore((s) => s.executeCommand);

  useCommandPaletteShortcut();

  const themeClass = clsx("app-shell h-full flex", {
    "theme-stratir": theme === "stratir",
    "theme-mykonos": theme === "mykonos",
    "theme-monaco theme-dark": theme === "monaco",
    "theme-angola theme-dark": theme === "angola",
  });

  return (
    <div className={themeClass}>
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-[var(--color-surface)]">
        {!activeSessionId ? (
          <WelcomeView />
        ) : (
          <ViewErrorBoundary label="workspace">
            {activeTab === "canvas" && <CanvasView />}
            {activeTab === "telegram" && <TelegramView />}
            {activeTab === "artifacts" && <ArtifactsView />}
          </ViewErrorBoundary>
        )}
      </main>

      {activeSessionId && (
        <CommandPalette
          open={commandPaletteOpen}
          onOpenChange={(open) => (open ? openCommandPalette() : closeCommandPalette())}
          onSelect={(cmd) => void executeCommand(cmd)}
        />
      )}
    </div>
  );
}
