import { useEffect } from "react";
import { useWorkspaceStore } from "../store/workspaceStore";

/** Global ⌘K / Ctrl+K — toggles the command palette when a session is active */
export function useCommandPaletteShortcut() {
  const activeSessionId = useWorkspaceStore((s) => s.activeSessionId);
  const toggleCommandPalette = useWorkspaceStore((s) => s.toggleCommandPalette);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "k") return;
      if (!activeSessionId) return;
      e.preventDefault();
      toggleCommandPalette();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeSessionId, toggleCommandPalette]);
}
