/** Type colors inspired by Flowsint node display palette. */
export const FLOWSINT_TYPE_COLORS: Record<string, string> = {
  telegram: "#0891b2",
  account: "#d97706",
  keyword: "#9333ea",
  platform: "#059669",
  default: "#64748b",
};

export function nodeTypeColor(nodeType: string | undefined): string {
  if (!nodeType) return FLOWSINT_TYPE_COLORS.default;
  return FLOWSINT_TYPE_COLORS[nodeType] ?? FLOWSINT_TYPE_COLORS.default;
}

export function dimColor(hex: string, alpha = 0.35): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
