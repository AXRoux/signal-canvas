import clsx from "clsx";
import { AppShell } from "./layout/AppShell";
import { LoginView } from "./layout/LoginView";
import { BriefModal } from "./panels/BriefModal";
import { SettingsModal } from "./panels/SettingsModal";
import { useActiveSession } from "./hooks/useActiveSession";
import { useAuthStore } from "./store/authStore";
import { useWorkspaceStore } from "./store/workspaceStore";
import { useEffect } from "react";
import { useDocumentTheme } from "./hooks/useDocumentTheme";

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const theme = useWorkspaceStore((s) => s.theme);
  const language = useWorkspaceStore((s) => s.language);
  const settingsOpen = useWorkspaceStore((s) => s.settingsOpen);
  const settingsTab = useWorkspaceStore((s) => s.settingsTab);
  const briefModalOpen = useWorkspaceStore((s) => s.briefModalOpen);

  const setTheme = useWorkspaceStore((s) => s.setTheme);
  const setLanguage = useWorkspaceStore((s) => s.setLanguage);
  const setSettingsTab = useWorkspaceStore((s) => s.setSettingsTab);
  const closeSettings = useWorkspaceStore((s) => s.closeSettings);
  const closeBrief = useWorkspaceStore((s) => s.closeBrief);
  const hydrateIntegrationConfig = useWorkspaceStore((s) => s.hydrateIntegrationConfig);

  const session = useActiveSession();

  useDocumentTheme(theme);

  useEffect(() => {
    useAuthStore.getState().hydrate();
    void hydrateIntegrationConfig();
  }, [hydrateIntegrationConfig]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void import("./lib/telegramClient").then(({ listenTelegramMessages }) => {
      void listenTelegramMessages((payload) => {
        useWorkspaceStore.getState().ingestStreamEvent({
          id: String(payload.id),
          platform: "telegram",
          chatId: String(payload.chatId),
          chatTitle: payload.chatTitle ?? "Telegram",
          senderId: payload.senderId ?? null,
          senderName: payload.senderName ?? null,
          text: payload.text ?? "",
          observedAt: payload.observedAt ?? new Date().toISOString(),
          signals: [],
          graphNodeId: null,
        });
      }).then((fn) => {
        unlisten = fn;
      });
    });
    return () => {
      unlisten?.();
    };
  }, []);

  if (!isAuthenticated) {
    const authThemeClass = clsx({
      "theme-stratir": theme === "stratir",
      "theme-mykonos": theme === "mykonos",
      "theme-monaco theme-dark": theme === "monaco",
      "theme-angola theme-dark": theme === "angola",
    });
    return (
      <div className={authThemeClass}>
        <LoginView />
      </div>
    );
  }

  return (
    <>
      <AppShell />

      <BriefModal
        open={briefModalOpen}
        data={session?.briefData ?? null}
        onClose={closeBrief}
      />

      <SettingsModal
        open={settingsOpen}
        tab={settingsTab}
        theme={theme}
        language={language}
        onTabChange={setSettingsTab}
        onThemeChange={setTheme}
        onLanguageChange={setLanguage}
        onClose={closeSettings}
      />
    </>
  );
}

export default App;
