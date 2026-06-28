import { useEffect } from "react";
import type { ThemeId } from "../store/types";

const THEME_CLASSES = [
  "theme-stratir",
  "theme-mykonos",
  "theme-monaco",
  "theme-angola",
  "theme-dark",
] as const;

export function themeClassNames(theme: ThemeId): string[] {
  switch (theme) {
    case "mykonos":
      return ["theme-mykonos"];
    case "monaco":
      return ["theme-monaco", "theme-dark"];
    case "angola":
      return ["theme-angola", "theme-dark"];
    case "stratir":
    default:
      return ["theme-stratir"];
  }
}

/** Sync active theme to <html> so createPortal() modals inherit CSS variables. */
export function useDocumentTheme(theme: ThemeId) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(...THEME_CLASSES);
    root.classList.add(...themeClassNames(theme));
    return () => {
      root.classList.remove(...THEME_CLASSES);
    };
  }, [theme]);
}
