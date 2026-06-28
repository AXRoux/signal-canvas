import clsx from "clsx";
import type { IntelHit } from "../../store/types";
import { useI18n } from "../../hooks/useI18n";

interface IntelPanelProps {
  hits: IntelHit[];
}

const confidenceColors = {
  low: "status-low",
  medium: "status-medium",
  high: "status-high",
};

export function IntelPanel({ hits }: IntelPanelProps) {
  const copy = useI18n();

  if (hits.length === 0) {
    return (
      <p className="text-xs text-[var(--color-text-secondary)] text-center py-8 px-4">
        {copy.investigation.noIntel}
      </p>
    );
  }

  return (
    <div className="p-3 space-y-2 overflow-y-auto h-full">
      {hits.map((hit) => (
        <div
          key={hit.id}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-[var(--color-text-primary)]">
              {hit.source}
            </span>
            <span className={clsx("text-[10px] capitalize font-medium", confidenceColors[hit.confidence])}>
              {copy.confidence[hit.confidence]}
            </span>
          </div>
          <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed mb-2">
            {hit.snippet}
          </p>
          <div className="flex justify-between text-[10px] text-[var(--color-text-tertiary)]">
            <span>{hit.platform}</span>
            <span className="font-mono">{hit.timestamp}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
