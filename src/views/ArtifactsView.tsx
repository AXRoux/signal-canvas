import { Download, FileText, Shield, Clock } from "lucide-react";
import { useActiveSession } from "../hooks/useActiveSession";
import { useI18n } from "../hooks/useI18n";
import { useWorkspaceStore } from "../store/workspaceStore";

export function ArtifactsView() {
  const copy = useI18n();
  const session = useActiveSession();
  const openBrief = useWorkspaceStore((s) => s.openBrief);

  if (!session) return null;

  const hasBrief = !!session.briefData;
  const audit = session.auditLog ?? [];
  const canBrief =
    session.nodes.length > 0 ||
    session.monitorStreams.telegram.length > 0 ||
    session.scanLoaded;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      <header className="sc-chrome-bar bg-[var(--color-surface)]">
        <div className="min-w-0">
          <h2 className="text-sm font-medium leading-tight">
            {copy.nav.artifacts}
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] leading-tight truncate">
            {copy.artifacts.subtitle}
          </p>
        </div>
      </header>

      <div className="p-5 max-w-2xl space-y-5">
        <section className="surface-card p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-3">
              <Shield size={18} className="text-[var(--color-accent)] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium">{copy.artifacts.auditTitle}</p>
                <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                  {session.title} · {audit.length} event(s)
                </p>
              </div>
            </div>
          </div>
          {audit.length === 0 ? (
            <p className="text-[11px] text-[var(--color-text-tertiary)] leading-relaxed">
              {copy.artifacts.auditEmpty}
            </p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {audit.slice(0, 40).map((row) => (
                <li
                  key={row.id}
                  className="flex gap-3 text-[11px] border-l-2 border-[var(--color-border)] pl-3 py-1"
                >
                  <Clock size={12} className="text-[var(--color-text-tertiary)] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[var(--color-text-primary)]">{row.summary}</p>
                    <p className="font-mono text-[9px] text-[var(--color-text-tertiary)] mt-0.5">
                      {new Date(row.at).toLocaleString()} · {row.action}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {!hasBrief ? (
          <div className="surface-inset p-8 text-center">
            <FileText size={32} className="mx-auto mb-3 text-[var(--color-text-tertiary)]" />
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">{copy.artifacts.empty}</p>
            <button
              type="button"
              disabled={!canBrief}
              onClick={openBrief}
              className="btn-impact inline-flex items-center gap-2 px-4 py-2 text-xs disabled:opacity-40"
            >
              {copy.artifacts.generateBrief}
            </button>
          </div>
        ) : (
          <div className="surface-card p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  Review brief
                </p>
                <h3 className="text-sm font-medium mt-1">{session.briefData!.title}</h3>
                <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                  {session.briefData!.reference}
                </p>
              </div>
              <button
                onClick={openBrief}
                className="btn-primary inline-flex items-center gap-2 px-3 py-2 text-xs shrink-0"
              >
                <Download size={13} />
                {copy.brief.exportPdf}
              </button>
            </div>
            <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
              {session.briefData!.sections.slice(0, 3).map((section) => (
                <div key={section.title}>
                  <p className="text-xs font-medium text-[var(--color-accent)] mb-1">{section.title}</p>
                  <ul className="space-y-1">
                    {section.items.slice(0, 3).map((item) => (
                      <li
                        key={item}
                        className="text-[11px] text-[var(--color-text-secondary)] pl-3 border-l-2 border-[var(--color-border)]"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
