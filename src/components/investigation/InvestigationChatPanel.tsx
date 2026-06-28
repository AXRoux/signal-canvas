import { useState, type FormEvent, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import clsx from "clsx";
import { useActiveSession } from "../../hooks/useActiveSession";
import { useI18n } from "../../hooks/useI18n";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { KbdHint } from "../ui/KbdHint";

export function InvestigationChatPanel() {
  const copy = useI18n();
  const session = useActiveSession();
  const sendChatMessage = useWorkspaceStore((s) => s.sendChatMessage);
  const executeCommand = useWorkspaceStore((s) => s.executeCommand);
  const agentRunning = useWorkspaceStore((s) => s.agentRunning);
  const openCommandPalette = useWorkspaceStore((s) => s.openCommandPalette);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [session?.chatMessages?.length, session?.commandLog?.[0]]);

  if (!session) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || agentRunning) return;
    const msg = input;
    setInput("");
    await sendChatMessage(msg);
  };

  const lastStatus = session.commandLog?.[0];

  return (
    <div className="flex flex-col h-full min-h-0 bg-[var(--color-surface)]">
      <div className="px-4 py-2.5 border-b border-[var(--color-border)] shrink-0 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            {copy.investigation.agentPanel}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">{copy.investigation.chatHint}</p>
        </div>
        <button
          type="button"
          onClick={openCommandPalette}
          className="command-palette-trigger"
          aria-label={copy.commandPalette.title}
        >
          <KbdHint keys={["⌘", "K"]} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {session.chatMessages?.length === 0 ? (
          <div className="h-full flex flex-col justify-center text-center px-2">
            <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
              {copy.chat.emptyTitle}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {copy.chat.emptyBody}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
              {copy.commandBar.suggestions.slice(0, 2).map((s) => (
                <button
                  key={s}
                  onClick={() => void executeCommand(s)}
                  className="text-[10px] font-mono px-2 py-1 rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                >
                  {s.length > 42 ? `${s.slice(0, 42)}…` : s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          (session.chatMessages ?? []).map((msg) => (
            <div
              key={msg.id}
              className={clsx("max-w-[92%]", msg.role === "user" ? "ml-auto" : "mr-auto")}
            >
              <div
                className={
                  msg.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"
                }
                style={{ borderRadius: 12, padding: "10px 14px" }}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
              <p className="text-[9px] text-[var(--color-text-tertiary)] mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          ))
        )}
        {agentRunning && (
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin" />
            {copy.agent.running}
          </div>
        )}
      </div>

      {lastStatus && (
        <p className="px-4 py-1.5 text-[10px] text-[var(--color-text-tertiary)] border-t border-[var(--color-border)] truncate shrink-0">
          {lastStatus}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-[var(--color-border)] shrink-0"
      >
        <div className="surface-input flex items-center gap-2 px-3 py-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={copy.chat.placeholder}
            disabled={agentRunning}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-tertiary)] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || agentRunning}
            className="btn-primary p-2 rounded-lg disabled:opacity-40"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}
