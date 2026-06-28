import { useState } from "react";
import clsx from "clsx";
import { ChevronDown, ShieldAlert } from "lucide-react";
import type { RiskReview } from "../../store/types";
import { useI18n } from "../../hooks/useI18n";

export function RiskSummaryStrip({ review }: { review: RiskReview }) {
  const copy = useI18n();
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b border-[var(--color-border)] shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--color-surface-muted)] transition-colors text-left"
      >
        <div className="w-9 h-9 rounded-full border-2 border-[var(--color-accent)] flex items-center justify-center shrink-0">
          <span className="text-sm font-semibold text-[var(--color-accent)] tabular-nums">
            {review.score}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            {copy.riskReview.title}
          </p>
          <p className="text-xs text-[var(--color-text-primary)] truncate">
            {copy.riskReview.confidence}: {copy.confidence[review.confidence]}
          </p>
        </div>
        <ChevronDown
          size={14}
          className={clsx("text-[var(--color-text-tertiary)] transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="px-4 pb-3 space-y-2 max-h-[180px] overflow-y-auto">
          <ul className="space-y-1">
            {review.groomingIndicators?.slice(0, 4).map((item) => (
              <li
                key={item}
                className="text-[11px] text-[var(--color-text-secondary)] pl-2 border-l-2 border-[var(--color-accent)]"
              >
                {item}
              </li>
            ))}
          </ul>
          <div className="human-review-badge flex items-center gap-2 px-2 py-1.5 rounded-lg">
            <ShieldAlert size={12} className="shrink-0" />
            <span className="text-[10px] font-medium">{copy.riskReview.humanReview}</span>
          </div>
        </div>
      )}
    </div>
  );
}
