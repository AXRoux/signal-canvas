import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import clsx from "clsx";
import {
  MoreHorizontal,
  Pin,
  Copy,
  Share2,
  Pencil,
  Archive,
  Trash2,
} from "lucide-react";
import type { InvestigationSession } from "../../store/types";
import { useI18n } from "../../hooks/useI18n";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { ThemePortal } from "../ThemePortal";

interface SessionMenuProps {
  session: InvestigationSession;
}

export function SessionMenu({ session }: SessionMenuProps) {
  const copy = useI18n();
  const theme = useWorkspaceStore((s) => s.theme);
  const [open, setOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(session.title);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const togglePinSession = useWorkspaceStore((s) => s.togglePinSession);
  const renameSession = useWorkspaceStore((s) => s.renameSession);
  const archiveSession = useWorkspaceStore((s) => s.archiveSession);
  const exportSession = useWorkspaceStore((s) => s.exportSession);
  const deleteSession = useWorkspaceStore((s) => s.deleteSession);
  const copySessionId = useWorkspaceStore((s) => s.copySessionId);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 196;
    const left = Math.min(Math.max(8, rect.right - menuWidth), window.innerWidth - menuWidth - 8);
    setMenuPos({ top: rect.bottom + 6, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const items = [
    {
      id: "pin",
      icon: Pin,
      label: session.pinned ? copy.sessions.unpin : copy.sessions.pin,
      onClick: () => togglePinSession(session.id),
    },
    {
      id: "copy",
      icon: Copy,
      label: copy.sessions.copyId,
      onClick: () => void copySessionId(session.id),
    },
    {
      id: "export",
      icon: Share2,
      label: copy.sessions.export,
      onClick: () => exportSession(session.id),
    },
    {
      id: "rename",
      icon: Pencil,
      label: copy.sessions.rename,
      onClick: () => {
        setRenameValue(session.title);
        setOpen(false);
        setRenameOpen(true);
      },
    },
    {
      id: "archive",
      icon: Archive,
      label: copy.sessions.archive,
      onClick: () => archiveSession(session.id),
    },
    {
      id: "delete",
      icon: Trash2,
      label: copy.sessions.delete,
      danger: true,
      onClick: () => {
        if (window.confirm(copy.sessions.deleteConfirm)) deleteSession(session.id);
      },
    },
  ];

  const submitRename = (e: FormEvent) => {
    e.preventDefault();
    const next = renameValue.trim();
    if (!next) return;
    renameSession(session.id, next);
    setRenameOpen(false);
    setOpen(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={clsx(
          "session-menu-trigger",
          open && "session-menu-trigger-open",
        )}
        aria-label={copy.sessions.menu}
        aria-expanded={open}
      >
        <MoreHorizontal size={14} />
      </button>

      {open && (
        <ThemePortal theme={theme}>
          <div
            ref={menuRef}
            className="session-dropdown"
            style={{ top: menuPos.top, left: menuPos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            {items.map(({ id, icon: Icon, label, danger, onClick }) => (
              <button
                key={id}
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                  if (id !== "rename") setOpen(false);
                }}
                className={clsx("session-dropdown-item", danger && "session-dropdown-item-danger")}
              >
                <Icon size={13} strokeWidth={1.75} />
                {label}
              </button>
            ))}
          </div>
        </ThemePortal>
      )}

      {renameOpen && (
        <ThemePortal theme={theme}>
          <div className="session-modal-backdrop" onClick={() => setRenameOpen(false)}>
            <form
              className="session-modal surface-card"
              onClick={(e) => e.stopPropagation()}
              onSubmit={submitRename}
            >
              <h3 className="text-sm font-medium mb-1">{copy.sessions.rename}</h3>
              <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                {copy.sessions.renamePrompt}
              </p>
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full surface-input px-3 py-2 text-sm outline-none mb-4"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setRenameOpen(false)} className="btn-secondary px-3 py-1.5 text-xs">
                  {copy.settings.close}
                </button>
                <button type="submit" disabled={!renameValue.trim()} className="btn-primary px-3 py-1.5 text-xs disabled:opacity-40">
                  {copy.sessions.rename}
                </button>
              </div>
            </form>
          </div>
        </ThemePortal>
      )}
    </>
  );
}
