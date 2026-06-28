import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import type { IntelHit } from "../store/types";
import { useI18n } from "../hooks/useI18n";

interface IntelStripProps {
  hits: IntelHit[];
  open: boolean;
  onClose: () => void;
}

const confidenceColors = {
  low: "text-emerald-600",
  medium: "text-amber-600",
  high: "text-red-600",
};

export function IntelStrip({ hits, open, onClose }: IntelStripProps) {
  const copy = useI18n();

  return (
    <AnimatePresence>
      {open && hits.length > 0 && (
        <motion.aside
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -320, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="absolute left-[68px] top-4 bottom-24 w-[300px] z-20 flex flex-col"
        >
          <div className="surface-card flex-1 flex flex-col overflow-hidden shadow-md">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-secondary)] font-medium">
                  {copy.intelStrip.title}
                </p>
                <p className="text-sm text-[var(--color-text-primary)] tracking-tight">
                  {copy.intelStrip.subtitle}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs px-2 py-1 rounded-lg hover:bg-[var(--color-surface-muted)] transition-colors"
              >
                {copy.intelStrip.close}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {hits.map((hit) => (
                <div
                  key={hit.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-[var(--color-text-primary)]">
                      {hit.source}
                    </span>
                    <span
                      className={clsx(
                        "text-[10px] capitalize font-medium",
                        confidenceColors[hit.confidence],
                      )}
                    >
                      {copy.confidence[hit.confidence]}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed mb-2">
                    {hit.snippet}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-[var(--color-text-tertiary)]">
                    <span>{hit.platform}</span>
                    <span className="font-mono">{hit.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
