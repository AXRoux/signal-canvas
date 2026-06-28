import clsx from "clsx";
import { useI18n } from "../../hooks/useI18n";
import { useNodeAgentPresence } from "../../hooks/useNodeAgentPresence";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { HermesIcon } from "../icons/HermesIcon";
import { NvidiaIcon } from "../icons/NvidiaIcon";
import type { AgentPresence } from "../../store/types";

function AgentMark({ agent }: { agent: AgentPresence["agent"] }) {
  if (agent === "nemotron") return <NvidiaIcon size={13} />;
  return <HermesIcon size={13} />;
}

interface NodeAgentBadgeProps {
  nodeId: string;
}

export function NodeAgentBadge({ nodeId }: NodeAgentBadgeProps) {
  const copy = useI18n();
  const { presence, isActive } = useNodeAgentPresence(nodeId);
  const setActivePresenceId = useWorkspaceStore((s) => s.setActivePresenceId);

  if (!presence) return null;

  const isLive = presence.status !== "complete";

  return (
    <button
      type="button"
      className={clsx(
        "node-agent-badge nodrag nopan",
        presence.agent === "nemotron" && "node-agent-badge-nemotron",
        presence.status === "thinking" && "node-agent-badge-thinking",
        presence.status === "acting" && "node-agent-badge-acting",
        presence.status === "waiting_review" && "node-agent-badge-review",
        presence.status === "complete" && "node-agent-badge-complete",
        isActive && "node-agent-badge-active",
      )}
      aria-label={`${copy.agent.stage}: ${presence.stage}`}
      aria-pressed={isActive}
      onClick={(e) => {
        e.stopPropagation();
        setActivePresenceId(isActive ? null : presence.id);
      }}
    >
      <span className="node-agent-badge-icon">
        <AgentMark agent={presence.agent} />
      </span>
      {isLive && <span className="node-agent-badge-pulse" aria-hidden />}
    </button>
  );
}
