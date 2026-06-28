import { useMemo } from "react";
import { useSessionSelector } from "../store/workspaceStore";
import type { AgentPresence } from "../store/types";

export function useNodeAgentPresence(nodeId: string): {
  presence: AgentPresence | null;
  isActive: boolean;
} {
  const presences = useSessionSelector((s) => s.agentPresences, []);
  const activeId = useSessionSelector((s) => s.activePresenceId, null);

  const presence = useMemo(() => {
    const linked = presences.filter((p) => p.relatedNodeIds?.includes(nodeId));
    if (linked.length === 0) return null;
    return linked.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  }, [presences, nodeId]);

  return {
    presence,
    isActive: !!presence && presence.id === activeId,
  };
}
