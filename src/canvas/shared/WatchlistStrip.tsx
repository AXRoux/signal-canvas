import { useI18n } from "../../hooks/useI18n";

export function WatchlistStrip({ keywords }: { keywords: string[] }) {
  const copy = useI18n();
  if (keywords.length === 0) return null;

  return (
    <div className="absolute top-3 left-3 z-20 pointer-events-none">
      <div className="surface-card px-2.5 py-1.5 text-[10px] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
        {copy.tools.watch}: {keywords.join(" · ")}
      </div>
    </div>
  );
}
