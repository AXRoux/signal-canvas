import clsx from "clsx";
import type { ReactNode } from "react";

interface IntegrationLayoutProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  badges: { label: string; tone: "neutral" | "success" | "warning" }[];
  children: ReactNode;
}

export function IntegrationLayout({
  icon,
  title,
  subtitle,
  badges,
  children,
}: IntegrationLayoutProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <header className="px-6 py-4 border-b border-[var(--color-border)] shrink-0 bg-[var(--color-surface)]">
        <div className="flex items-start gap-4 max-w-3xl">
          <div className="w-11 h-11 rounded-xl bg-[var(--color-accent-soft)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)] shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-medium text-[var(--color-text-primary)]">{title}</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{subtitle}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {badges.map((b) => (
                <span
                  key={b.label}
                  className={clsx(
                    "text-[10px] px-2 py-0.5 rounded-full font-medium border",
                    b.tone === "success" && "status-badge-success",
                    b.tone === "warning" && "status-badge-warning",
                    b.tone === "neutral" && "status-badge-neutral",
                  )}
                >
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl space-y-6">{children}</div>
      </div>
    </div>
  );
}

export function IntegrationSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="surface-card overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <h3 className="text-xs font-medium text-[var(--color-text-primary)] uppercase tracking-wider">
          {title}
        </h3>
        {description && (
          <p className="text-[11px] text-[var(--color-text-secondary)] mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function OperationalRow({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-[var(--color-border)] last:border-0">
      <span className="text-[11px] text-[var(--color-text-secondary)] shrink-0">{label}</span>
      <span
        className={clsx(
          "text-[11px] font-mono text-right break-all",
          ok === true && "text-[var(--color-success)]",
          ok === false && "text-[var(--color-text-tertiary)]",
          ok === undefined && "text-[var(--color-text-primary)]",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function SkillRow({
  name,
  description,
  enabled,
  onLabel,
  offLabel,
}: {
  name: string;
  description: string;
  enabled: boolean;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[var(--color-border)] last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{name}</p>
        <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">{description}</p>
      </div>
      <span
        className={clsx(
          "text-[10px] px-2.5 py-1 rounded-full font-medium border shrink-0",
          enabled ? "status-badge-success" : "status-badge-neutral",
        )}
      >
        {enabled ? onLabel : offLabel}
      </span>
    </div>
  );
}
