import type { ThemeId } from "../store/types";

export interface ThemeDefinition {
  id: ThemeId;
  colors: [string, string, string];
  font: string;
}

export const themes: ThemeDefinition[] = [
  {
    id: "stratir",
    colors: ["#F2F2EF", "#FF3D00", "#0F1112"],
    font: "Space Grotesk",
  },
  {
    id: "mykonos",
    colors: ["#F2F2EF", "#2563EB", "#0F1112"],
    font: "Space Grotesk",
  },
  {
    id: "monaco",
    colors: ["#F2F2EF", "#E11D48", "#0F1112"],
    font: "Space Grotesk",
  },
  {
    id: "angola",
    colors: ["#F2F2EF", "#EF4444", "#0F1112"],
    font: "Space Grotesk",
  },
];

export function getThemeDefinition(id: ThemeId): ThemeDefinition {
  return themes.find((t) => t.id === id) ?? themes[0];
}

export function isDarkTheme(theme: ThemeId): boolean {
  return theme === "monaco" || theme === "angola";
}

export function reactFlowColorMode(theme: ThemeId): "light" | "dark" {
  return isDarkTheme(theme) ? "dark" : "light";
}
