import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { useActiveSession } from "../hooks/useActiveSession";
import { useI18n } from "../hooks/useI18n";
import { useWorkspaceStore } from "../store/workspaceStore";

export function ChatView() {
  const copy = useI18n();
  const session = useActiveSession();
  const sendChatMessage = useWorkspaceStore((s) => s.sendChatMessage);
  const [input, setInput] = useState("");

  if (!session) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const msg = input;
    setInput("");
    await sendChatMessage(msg);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="px-5 py-3 border-b border-[var(--color-border)] shrink-0">
        <h2 className="text-sm font-medium">{copy.nav.chat}</h2>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
          {copy.chat.subtitle}
        </p>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {session.chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <p className="font-display text-2xl text-[var(--color-accent)] mb-2">
              {copy.chat.emptyTitle}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {copy.chat.emptyBody}
            </p>
          </div>
        ) : (
          session.chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[85%] ${msg.role === "user" ? "ml-auto" : "mr-auto"}`}
            >
              <div
                className={
                  msg.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"
                }
                style={{ borderRadius: 12, padding: "10px 14px" }}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
              <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-[var(--color-border)] shrink-0"
      >
        <div className="surface-input flex items-center gap-2 px-3 py-2 max-w-3xl mx-auto">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={copy.chat.placeholder}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-tertiary)]"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="btn-primary p-2 rounded-lg disabled:opacity-40"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}
