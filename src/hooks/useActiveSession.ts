import { useWorkspaceStore } from "../store/workspaceStore";
import type { InvestigationSession } from "../store/types";

export function useActiveSession(): InvestigationSession | null {
  const activeSessionId = useWorkspaceStore((s) => s.activeSessionId);
  const sessions = useWorkspaceStore((s) => s.sessions);
  if (!activeSessionId) return null;
  return sessions[activeSessionId] ?? null;
}

export function useHasActiveSession(): boolean {
  return useWorkspaceStore((s) => s.activeSessionId) !== null;
}
