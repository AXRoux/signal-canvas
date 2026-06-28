/** True when the user clearly wants a desk command, not casual chat. */
export function isExplicitCommand(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;

  const lower = trimmed.toLowerCase();

  if (trimmed.startsWith("/")) return true;
  if (/^(run|execute)\s+/i.test(trimmed)) return true;

  if (/^scan(\s+@|\s*$)/i.test(trimmed)) return true;
  if (/^escane/i.test(trimmed)) return true;

  if (/^correlate\b/i.test(trimmed) || /^correlacion/i.test(trimmed)) return true;
  if (/^watch\s+/i.test(trimmed)) return true;
  if (/^(brief|export)\b/i.test(trimmed)) return true;
  if (lower.includes("generate brief") || lower.includes("gerar brief")) return true;
  if (lower.includes("settings") || lower.includes("configura")) return true;
  if (/\b(mykonos|monaco|angola|athens|stratir|impact)\b/.test(lower) && trimmed.length < 48) return true;

  return false;
}
