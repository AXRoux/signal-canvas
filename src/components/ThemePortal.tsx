import { createPortal } from "react-dom";
import clsx from "clsx";
import type { ReactNode } from "react";
import type { ThemeId } from "../store/types";
import { themeClassNames } from "../hooks/useDocumentTheme";

interface ThemePortalProps {
  children: ReactNode;
  theme: ThemeId;
}

/** Portal wrapper that re-applies theme class on the detached subtree (belt + suspenders). */
export function ThemePortal({ children, theme }: ThemePortalProps) {
  return createPortal(
    <div className={clsx("theme-portal-root", ...themeClassNames(theme))}>{children}</div>,
    document.body,
  );
}
