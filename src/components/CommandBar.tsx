import { useState, type FormEvent, useEffect } from "react";
import { Command, CornerDownLeft } from "lucide-react";
import clsx from "clsx";
import { useI18n } from "../hooks/useI18n";

interface CommandBarProps {
  onSubmit: (input: string) => Promise<void>;
  lastMessage?: string;
  onOpenPalette: () => void;
}

export function CommandBar({
  onSubmit,
  lastMessage,
  onOpenPalette,
}: CommandBarProps) {
  const copy = useI18n();
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenPalette();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpenPalette]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    await onSubmit(input);
    setInput("");
  };

  return (
    <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shrink-0">
      <form onSubmit={handleSubmit} className="surface-input flex items-center gap-3 px-3 py-2">
        <div className="flex items-center gap-2 text-[var(--color-text-secondary)] shrink-0">
          <Command size={14} />
          <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-surface-muted)] border border-[var(--color-border)] font-mono">
            ⌘K
          </kbd>
        </div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={copy.commandBar.placeholder}
          className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] outline-none font-mono tracking-tight"
        />
        <button
          type="submit"
          className={clsx(
            "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors font-medium",
            input.trim()
              ? "btn-primary"
              : "text-[var(--color-text-secondary)]",
          )}
        >
          <CornerDownLeft size={12} />
          {copy.commandBar.run}
        </button>
      </form>
      {!focused && !input && (
        <div className="mt-2 flex flex-wrap gap-2">
          {copy.commandBar.suggestions.map((s) => (
            <button
              key={s}
              onClick={() => onSubmit(s)}
              className="text-[10px] font-mono text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] px-2 py-0.5 rounded-full border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
      {lastMessage && (
        <p className="mt-2 text-[11px] text-[var(--color-text-secondary)] truncate px-1">
          {lastMessage}
        </p>
      )}
    </div>
  );
}
