import { motion, AnimatePresence } from "framer-motion";
import { X, Download, FileText } from "lucide-react";
import { useState } from "react";
import type { BriefData } from "../store/types";
import { exportBriefPdf } from "../lib/pdfExport";
import { useI18n } from "../hooks/useI18n";

interface BriefModalProps {
  open: boolean;
  data: BriefData | null;
  onClose: () => void;
}

export function BriefModal({ open, data, onClose }: BriefModalProps) {
  const copy = useI18n();
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const handleExport = async () => {
    if (!data) return;
    setExporting(true);
    setExportStatus(null);
    try {
      const saved = await exportBriefPdf(data);
      setExportStatus(saved ? copy.brief.saved : copy.brief.cancelled);
    } catch {
      setExportStatus(copy.brief.error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && data && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="session-modal-backdrop"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-[8%] bottom-[8%] max-w-2xl mx-auto z-[10001] flex flex-col pointer-events-none"
          >
            <div className="surface-card flex-1 flex flex-col overflow-hidden shadow-2xl pointer-events-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-[var(--color-accent)]" />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-secondary)] font-medium">
                      {copy.brief.preview}
                    </p>
                    <p className="text-sm text-[var(--color-text-primary)] tracking-tight">
                      {data.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div className="flex gap-4 text-[11px] text-[var(--color-text-secondary)] font-mono">
                  <span>{data.caseId}</span>
                  <span>{data.generatedAt}</span>
                </div>

                {data.sections.map((section) => (
                  <section key={section.title}>
                    <h3 className="text-xs font-medium text-[var(--color-accent)] mb-2 tracking-tight">
                      {section.title}
                    </h3>
                    <ul className="space-y-1.5">
                      {section.items.map((item) => (
                        <li
                          key={item}
                          className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed pl-3 border-l-2 border-[var(--color-border)]"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}

                <div className="human-review-badge rounded-xl p-4">
                  <p className="text-[11px] leading-relaxed">{data.reviewerNotes}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {data.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              <div className="px-5 py-4 border-t border-[var(--color-border)] flex items-center justify-between gap-4">
                <p className="text-[11px] text-[var(--color-text-secondary)]">
                  {exportStatus ?? copy.brief.exportHint}
                </p>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
                >
                  <Download size={14} />
                  {exporting ? copy.brief.exporting : copy.brief.exportPdf}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
