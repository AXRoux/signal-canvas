import { NvidiaIcon } from "../components/icons/NvidiaIcon";
import {
  IntegrationLayout,
  IntegrationSection,
  SkillRow,
} from "../components/integration/IntegrationLayout";
import { useI18n } from "../hooks/useI18n";
import { useWorkspaceStore } from "../store/workspaceStore";

export function NvidiaView() {
  const copy = useI18n();
  const hermesOnline = useWorkspaceStore((s) => s.hermesOnline);

  return (
    <IntegrationLayout
      icon={<NvidiaIcon size={20} />}
      title={copy.integrations.nvidia.title}
      subtitle={copy.integrations.nvidia.subtitle}
      badges={[
        {
          label: hermesOnline ? copy.integrations.nvidia.nemotronReady : copy.integrations.nvidia.nemotronOffline,
          tone: hermesOnline ? "success" : "warning",
        },
        { label: "NemoClaw", tone: "neutral" },
      ]}
    >
      <IntegrationSection
        title={copy.integrations.nvidia.models}
        description={copy.integrations.nvidia.modelsDesc}
      >
        <SkillRow
          name="Nemotron (via Hermes)"
          description={copy.integrations.nvidia.nemotronDesc}
          enabled={hermesOnline}
          onLabel={copy.skills.on}
          offLabel={copy.skills.off}
        />
        <SkillRow
          name="Vision · Web extract · Compression"
          description={copy.integrations.nvidia.auxDesc}
          enabled={hermesOnline}
          onLabel={copy.skills.on}
          offLabel={copy.skills.off}
        />
      </IntegrationSection>

      <IntegrationSection title={copy.integrations.nvidia.nemoclaw}>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-3">
          {copy.integrations.nvidia.nemoclawDesc}
        </p>
        <code className="block text-[11px] font-mono p-3 rounded-lg bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
          export NEMOCLAW_AGENT=hermes && curl -fsSL https://www.nvidia.com/nemoclaw.sh | bash
        </code>
      </IntegrationSection>
    </IntegrationLayout>
  );
}
