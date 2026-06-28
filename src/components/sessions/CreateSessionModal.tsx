import { useState, type FormEvent } from "react";
import { useI18n } from "../../hooks/useI18n";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { ThemePortal } from "../ThemePortal";

interface CreateSessionModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateSessionModal({ open, onClose }: CreateSessionModalProps) {
  const copy = useI18n();
  const theme = useWorkspaceStore((s) => s.theme);
  const [name, setName] = useState("");
  const createSession = useWorkspaceStore((s) => s.createSession);

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    createSession(trimmed);
    setName("");
    onClose();
  };

  return (
    <ThemePortal theme={theme}>
      <div className="session-modal-backdrop" onClick={onClose}>
        <form
          className="session-modal surface-card"
          onClick={(e) => e.stopPropagation()}
          onSubmit={handleSubmit}
        >
          <h3 className="text-base font-medium text-[var(--color-text-primary)] mb-1">
            {copy.sessions.nameSessionTitle}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4 leading-relaxed">
            {copy.sessions.nameSessionBody}
          </p>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">
            {copy.sessions.nameLabel}
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={copy.sessions.namePlaceholder}
            className="w-full surface-input px-3 py-2.5 text-sm outline-none mb-5"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-xs">
              {copy.sessions.cancel}
            </button>
            <button type="submit" disabled={!name.trim()} className="btn-primary px-4 py-2 text-xs disabled:opacity-40">
              {copy.sessions.createSession}
            </button>
          </div>
        </form>
      </div>
    </ThemePortal>
  );
}
