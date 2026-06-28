import { ShieldAlert, Clock, Globe, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import clsx from "clsx";
import type { RiskReview } from "../store/types";
import { useI18n } from "../hooks/useI18n";

interface RiskReviewPanelProps {
  review: RiskReview | null;
  embedded?: boolean;
}

function ScoreRing({ score, compact }: { score: number; compact?: boolean }) {
  const copy = useI18n();
  const r = compact ? 28 : 36;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const size = compact ? "w-16 h-16" : "w-24 h-24";

  return (
    <div className={clsx("relative mx-auto", size, compact ? "mb-2" : "mb-4")}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r === 28 ? 28 : 36} fill="none" stroke="var(--color-border)" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={r === 28 ? 28 : 36}
          fill="none"
          className="score-ring"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={clsx("font-semibold text-[var(--color-text-primary)] tabular-nums", compact ? "text-lg" : "text-2xl")}>
          {score}
        </span>
        {!compact && (
          <span className="text-[10px] text-[var(--color-text-secondary)]">{copy.riskReview.riskScore}</span>
        )}
      </div>
    </div>
  );
}

export function RiskReviewPanel({ review, embedded = false }: RiskReviewPanelProps) {
  const copy = useI18n();
  const wrapperClass = embedded
    ? "flex flex-col h-full overflow-hidden"
    : "surface-card w-[320px] shrink-0 flex flex-col overflow-hidden m-2 ml-0 border-l-0 rounded-l-none";

  if (!review) {
    return (
      <div className={wrapperClass}>
        {!embedded && (
          <div className="px-4 py-3 border-b border-[var(--color-border)]">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-secondary)] font-medium">
              {copy.riskReview.title}
            </p>
            <p className="text-sm text-[var(--color-text-primary)]">{copy.riskReview.waiting}</p>
          </div>
        )}
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-xs text-[var(--color-text-secondary)] text-center leading-relaxed">
            {copy.riskReview.waitingBody}
          </p>
        </div>
        <div className="px-3 py-2 border-t border-[var(--color-border)] shrink-0">
          <HumanReviewBadge label={copy.riskReview.humanReview} compact={embedded} />
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        <div className="flex items-center gap-3">
          <ScoreRing score={review.score} compact={embedded} />
          <div className="flex-1 min-w-0">
            <span
              className={clsx(
                "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium inline-block",
                review.confidence === "high" && "status-high",
                review.confidence === "medium" && "status-medium",
                review.confidence === "low" && "status-low",
              )}
            >
              {copy.confidence[review.confidence]}
            </span>
            <p className="text-[11px] text-[var(--color-text-secondary)] mt-2 leading-relaxed line-clamp-3">
              {review.summary}
            </p>
          </div>
        </div>

        <CompactSection icon={ShieldAlert} title={copy.riskReview.groomingIndicators}>
          <ul className="space-y-1">
            {review.groomingIndicators.slice(0, embedded ? 4 : undefined).map((item) => (
              <li key={item} className="text-[11px] text-[var(--color-text-secondary)] pl-2 border-l-2 border-[var(--color-accent)]">
                {item}
              </li>
            ))}
          </ul>
        </CompactSection>

        <CompactSection icon={Clock} title={copy.riskReview.escalation}>
          <div className="space-y-1.5">
            {review.escalationTimeline.map((event) => (
              <div key={event.time} className="flex gap-2">
                <span className="font-mono text-[10px] text-[var(--color-accent)] w-9 shrink-0">{event.time}</span>
                <p className="text-[11px] text-[var(--color-text-primary)]">{event.label}</p>
              </div>
            ))}
          </div>
        </CompactSection>

        {!embedded && (
          <>
            <CompactSection icon={ArrowUpRight} title={copy.riskReview.offPlatform}>
              <ul className="space-y-1">
                {review.offPlatformNotes.map((note) => (
                  <li key={note} className="text-[11px] text-[var(--color-text-secondary)]">{note}</li>
                ))}
              </ul>
            </CompactSection>
            <CompactSection icon={Globe} title={copy.riskReview.languages}>
              <div className="flex flex-wrap gap-1">
                {review.languagesDetected.map((lang) => (
                  <span key={lang} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
                    {lang}
                  </span>
                ))}
              </div>
            </CompactSection>
          </>
        )}
      </div>

      <div className="px-3 py-2 border-t border-[var(--color-border)] shrink-0">
        <HumanReviewBadge label={copy.riskReview.humanReview} compact={embedded} />
      </div>
    </div>
  );
}

function CompactSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof ShieldAlert;
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon size={11} className="text-[var(--color-accent)]" />
        <h3 className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-primary)]">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function HumanReviewBadge({ label, compact }: { label: string; compact?: boolean }) {
  return (
    <div className={clsx("human-review-badge flex items-center gap-2 rounded-lg", compact ? "px-2 py-1.5" : "px-3 py-2 rounded-xl")}>
      <ShieldAlert size={compact ? 12 : 14} className="shrink-0" />
      <span className={clsx("font-medium", compact ? "text-[10px]" : "text-[11px]")}>{label}</span>
    </div>
  );
}
