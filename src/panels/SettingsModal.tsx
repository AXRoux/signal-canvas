import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Palette, Languages, Info, User, BookOpen, LayoutGrid } from "lucide-react";
import clsx from "clsx";
import { useI18n } from "../hooks/useI18n";
import { themes as themeDefs } from "../lib/themes";
import type { SettingsTab, ThemeId } from "../store/types";
import type { LanguageId } from "../i18n/types";
import { HermesIcon } from "../components/icons/HermesIcon";
import { NvidiaIcon } from "../components/icons/NvidiaIcon";
import { TelegramIcon } from "../components/icons/TelegramIcon";
import {
  SettingsHermesPanel,
  SettingsNvidiaPanel,
} from "../components/settings/IntegrationPanels";
import { SettingsTelegramPanel } from "../components/settings/SettingsTelegramPanel";
import { SettingsGraphPanel } from "../components/settings/SettingsGraphPanel";
import { AccountSettingsPanel } from "../components/settings/AccountSettingsPanel";
import { SetupGuidePanel } from "../components/settings/SetupGuidePanel";
import { AboutSettingsPanel } from "../components/settings/AboutSettingsPanel";

interface SettingsModalProps {
  open: boolean;
  tab: SettingsTab;
  theme: ThemeId;
  language: LanguageId;
  onTabChange: (tab: SettingsTab) => void;
  onThemeChange: (theme: ThemeId) => void;
  onLanguageChange: (language: LanguageId) => void;
  onClose: () => void;
}

const navItems: {
  id: SettingsTab;
  icon: typeof Palette | typeof HermesIcon;
  labelKey: "appearance" | "language" | "account" | "graph" | "hermes" | "nvidia" | "telegram" | "setup" | "about";
  brand?: boolean;
}[] = [
  { id: "appearance", icon: Palette, labelKey: "appearance" },
  { id: "language", icon: Languages, labelKey: "language" },
  { id: "account", icon: User, labelKey: "account" },
  { id: "graph", icon: LayoutGrid, labelKey: "graph" },
  { id: "hermes", icon: HermesIcon, labelKey: "hermes", brand: true },
  { id: "nvidia", icon: NvidiaIcon, labelKey: "nvidia", brand: true },
  { id: "telegram", icon: TelegramIcon, labelKey: "telegram", brand: true },
  { id: "setup", icon: BookOpen, labelKey: "setup" },
  { id: "about", icon: Info, labelKey: "about" },
];

export function SettingsModal({
  open,
  tab,
  theme,
  language,
  onTabChange,
  onThemeChange,
  onLanguageChange,
  onClose,
}: SettingsModalProps) {
  const copy = useI18n();

  const themeCopy = {
    stratir: copy.themes.stratir,
    mykonos: copy.themes.mykonos,
    monaco: copy.themes.monaco,
    angola: copy.themes.angola,
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="session-modal-backdrop"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl z-[10001] px-4"
          >
            <div className="surface-card overflow-hidden shadow-2xl flex h-[min(80vh,640px)]">
              <aside className="w-[200px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface-sidebar)] p-2 flex flex-col">
                <div className="px-2 py-3 mb-1">
                  <h2 className="text-sm font-medium">{copy.settings.title}</h2>
                </div>
                <nav className="space-y-0.5 flex-1">
                  {navItems.map(({ id, icon: Icon, labelKey, brand }) => (
                    <button
                      key={id}
                      onClick={() => onTabChange(id)}
                      className={clsx("nav-item w-full", tab === id && "nav-item-active")}
                    >
                      {brand ? (
                        <Icon size={15} className="shrink-0" />
                      ) : (
                        <Icon size={15} strokeWidth={1.75} />
                      )}
                      {copy.settings.tabs[labelKey]}
                    </button>
                  ))}
                </nav>
              </aside>

              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center justify-end px-4 py-3 border-b border-[var(--color-border)] shrink-0">
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]"
                    aria-label={copy.settings.close}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  {tab === "appearance" && (
                    <section>
                      <h3 className="text-sm font-medium mb-1">{copy.settings.appearance}</h3>
                      <p className="text-xs text-[var(--color-text-secondary)] mb-4">{copy.settings.appearanceDesc}</p>
                      <div className="grid gap-2">
                        {themeDefs.map((def) => {
                          const meta = themeCopy[def.id];
                          const active = theme === def.id;
                          return (
                            <button
                              key={def.id}
                              onClick={() => onThemeChange(def.id)}
                              className={clsx(
                                "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                active ? "theme-card-active" : "border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]",
                              )}
                            >
                              <div className="flex -space-x-1 shrink-0">
                                {def.colors.map((color) => (
                                  <span key={color} className="w-5 h-5 rounded-full border border-[var(--color-border)]" style={{ backgroundColor: color }} />
                                ))}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium">{meta.name}</p>
                                <p className="text-[10px] text-[var(--color-text-secondary)] truncate">{meta.desc}</p>
                              </div>
                              {active && <Check size={14} className="text-[var(--color-accent)] shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {tab === "language" && (
                    <section>
                      <h3 className="text-sm font-medium mb-1">{copy.settings.language}</h3>
                      <p className="text-xs text-[var(--color-text-secondary)] mb-4">{copy.settings.languageDesc}</p>
                      <div className="flex gap-2 max-w-sm">
                        {(
                          [
                            { id: "en" as LanguageId, label: "English" },
                            { id: "pt" as LanguageId, label: "Português (BR)" },
                          ] as const
                        ).map((lang) => (
                          <button
                            key={lang.id}
                            onClick={() => onLanguageChange(lang.id)}
                            className={clsx(
                              "flex-1 px-3 py-2.5 rounded-xl border text-xs",
                              language === lang.id ? "theme-card-active" : "border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]",
                            )}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {tab === "account" && <AccountSettingsPanel />}
                  {tab === "graph" && <SettingsGraphPanel />}
                  {tab === "hermes" && <SettingsHermesPanel />}
                  {tab === "nvidia" && <SettingsNvidiaPanel />}
                  {tab === "telegram" && <SettingsTelegramPanel />}
                  {tab === "setup" && <SetupGuidePanel />}

                  {tab === "about" && <AboutSettingsPanel />}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
