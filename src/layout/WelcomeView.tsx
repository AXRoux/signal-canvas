import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { useI18n } from "../hooks/useI18n";
import { useWorkspaceStore } from "../store/workspaceStore";
import { SignalCanvasLogo } from "../components/icons/SignalCanvasLogo";

export function WelcomeView() {
  const copy = useI18n();
  const createSession = useWorkspaceStore((s) => s.createSession);
  const sessions = useWorkspaceStore((s) => s.sessions);
  const selectSession = useWorkspaceStore((s) => s.selectSession);
  const [name, setName] = useState("");

  const available = Object.values(sessions).filter((s) => !s.archived);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    createSession(trimmed);
    setName("");
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[var(--color-surface)] px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 text-[var(--color-text-primary)]">
            <SignalCanvasLogo size={56} />
          </div>
          <h1 className="text-xl font-display text-[var(--color-text-primary)] mb-2">
            {copy.sessions.nameSessionTitle}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {copy.sessions.welcomeBody}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="surface-card p-5">
          <label className="block stratir-label mb-2">{copy.sessions.nameLabel}</label>
          <div className="surface-input flex items-center gap-2 px-3 py-2 mb-4">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={copy.sessions.namePlaceholder}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-tertiary)]"
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-40"
          >
            {copy.sessions.createSession}
            <ArrowRight size={15} />
          </button>
          <p className="mt-3 text-[11px] text-center text-[var(--color-text-tertiary)]">
            {copy.sessions.isolationNote}
          </p>
        </form>

        {available.length > 0 && (
          <div className="mt-6">
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2 text-center">
              {copy.sessions.orSelectExisting}
            </p>
            <div className="space-y-2">
              {available.slice(0, 4).map((s) => (
                <button
                  key={s.id}
                  onClick={() => selectSession(s.id)}
                  className="w-full sc-session-card px-3 py-2.5 text-left"
                >
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{s.title}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
