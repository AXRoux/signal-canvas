import clsx from "clsx";
import { Check, LayoutGrid } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { GRAPH_STYLES } from "../../lib/graphStyles";
import { useWorkspaceStore } from "../../store/workspaceStore";

export function SettingsGraphPanel() {
  const copy = useI18n();
  const graphStyle = useWorkspaceStore((s) => s.graphStyle);
  const setGraphStyle = useWorkspaceStore((s) => s.setGraphStyle);

  const styleCopy = {
    stratir: { name: copy.graph.stratir, desc: copy.graph.stratirDesc },
    flowsint: { name: copy.graph.flowsint, desc: copy.graph.flowsintDesc },
  };

  return (
    <section>
      <h3 className="text-sm font-medium mb-1">{copy.graph.title}</h3>
      <p className="text-xs text-[var(--color-text-secondary)] mb-4 leading-relaxed">{copy.graph.desc}</p>
      <div className="grid gap-2">
        {GRAPH_STYLES.map((def) => {
          const meta = styleCopy[def.nameKey];
          const active = graphStyle === def.id;
          return (
            <button
              key={def.id}
              onClick={() => setGraphStyle(def.id)}
              className={clsx(
                "w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left",
                active ? "theme-card-active" : "border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]",
              )}
            >
              <div
                className={clsx(
                  "shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center",
                  active ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]" : "border-[var(--color-border)]",
                )}
              >
                <LayoutGrid size={16} className="text-[var(--color-accent)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{meta.name}</p>
                <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">{meta.desc}</p>
                <p className="text-[9px] text-[var(--color-text-tertiary)] mt-1 font-mono">{def.inspiration}</p>
              </div>
              {active && <Check size={14} className="text-[var(--color-accent)] shrink-0 mt-0.5" />}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-[var(--color-text-tertiary)] mt-4 leading-relaxed">{copy.graph.layoutNote}</p>
    </section>
  );
}
