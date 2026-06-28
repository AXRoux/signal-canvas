import type { ReactNode } from "react";
import { HermesIcon } from "../icons/HermesIcon";
import { NvidiaIcon } from "../icons/NvidiaIcon";
import { IntegrationSection, OperationalRow, SkillRow } from "../integration/IntegrationLayout";
import { CredentialField } from "./CredentialField";
import { useI18n } from "../../hooks/useI18n";
import { useWorkspaceStore } from "../../store/workspaceStore";

function StatusLine({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={ok ? "status-badge-success text-[10px] px-2 py-0.5 rounded-full border" : "status-badge-neutral text-[10px] px-2 py-0.5 rounded-full border"}>
      {label}
    </span>
  );
}

function CredentialsCollapsible({
  title,
  description,
  children,
  saveLabel,
  onSave,
}: {
  title: string;
  description: string;
  children: ReactNode;
  saveLabel: string;
  onSave: () => void;
}) {
  return (
    <details className="surface-card overflow-hidden group">
      <summary className="px-4 py-3 border-b border-[var(--color-border)] cursor-pointer list-none flex items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-medium text-[var(--color-text-primary)] uppercase tracking-wider">{title}</h3>
          <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">{description}</p>
        </div>
        <span className="text-[10px] text-[var(--color-text-tertiary)] group-open:rotate-180 transition-transform">▼</span>
      </summary>
      <div className="p-4 space-y-3">
        {children}
        <button onClick={onSave} className="btn-secondary px-4 py-2 text-xs">
          {saveLabel}
        </button>
      </div>
    </details>
  );
}

export function SettingsHermesPanel() {
  const copy = useI18n();
  const config = useWorkspaceStore((s) => s.integrationConfig);
  const status = useWorkspaceStore((s) => s.integrationStatus);
  const hermesOnline = useWorkspaceStore((s) => s.hermesOnline);
  const setIntegrationConfig = useWorkspaceStore((s) => s.setIntegrationConfig);
  const saveIntegrationConfig = useWorkspaceStore((s) => s.saveIntegrationConfig);
  const refreshIntegrationStatus = useWorkspaceStore((s) => s.refreshIntegrationStatus);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl brand-icon-wrap flex items-center justify-center text-[var(--color-text-primary)]">
          <HermesIcon size={20} />
        </div>
        <div>
          <h3 className="text-sm font-medium">{copy.integrations.hermes.title}</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{copy.integrations.hermes.subtitle}</p>
        </div>
      </div>

      <IntegrationSection title={copy.integrations.hermes.operationalTitle} description={copy.integrations.hermes.operationalDesc}>
        <div className="flex flex-wrap gap-2 mb-3">
          <StatusLine ok={hermesOnline} label={hermesOnline ? copy.integrations.hermes.online : copy.integrations.hermes.offline} />
          <StatusLine ok={!!status?.nemotronViaHermes} label={copy.integrations.hermes.modelReady} />
        </div>
        <OperationalRow label={copy.integrations.hermes.gatewayEndpoint} value={`${status?.hermesGatewayUrl ?? config.hermesGatewayUrl}/health`} ok={hermesOnline} />
        <OperationalRow label={copy.integrations.hermes.gatewayStatus} value={status?.hermesMessage ?? "—"} ok={hermesOnline} />
        <OperationalRow label={copy.integrations.hermes.modelLabel} value={status?.hermesModel ?? "nvidia/nemotron-3-ultra-550b-a55b"} ok={!!status?.nemotronViaHermes} />
        <OperationalRow label={copy.integrations.hermes.binaryLabel} value={status?.hermesBinary ?? "—"} />
        <button onClick={() => void refreshIntegrationStatus()} className="btn-secondary px-4 py-2 text-xs mt-3">
          {copy.integrations.refresh}
        </button>
      </IntegrationSection>

      <IntegrationSection title={copy.integrations.hermes.skills} description={copy.integrations.hermes.skillsDesc}>
        <SkillRow name="signal-canvas-scan" description={copy.integrations.hermes.scanDesc} enabled={!!status?.skillsScan} onLabel={copy.skills.on} offLabel={copy.skills.off} />
        <SkillRow name="signal-canvas-correlate" description={copy.integrations.hermes.correlateDesc} enabled={!!status?.skillsCorrelate} onLabel={copy.skills.on} offLabel={copy.skills.off} />
        <SkillRow name="signal-canvas-brief" description={copy.integrations.hermes.briefDesc} enabled={!!status?.skillsBrief} onLabel={copy.skills.on} offLabel={copy.skills.off} />
      </IntegrationSection>

      <CredentialsCollapsible
        title={copy.integrations.credentials}
        description={copy.integrations.hermes.credentialsDesc}
        saveLabel={copy.integrations.save}
        onSave={() => void saveIntegrationConfig()}
      >
        <CredentialField
          label={copy.integrations.hermes.gatewayUrlLabel}
          value={config.hermesGatewayUrl}
          placeholder="http://127.0.0.1:8642"
          hint={copy.integrations.hermes.gatewayUrlHint}
          mono
          onChange={(v) => setIntegrationConfig({ hermesGatewayUrl: v })}
        />
        <CredentialField
          label={copy.integrations.hermes.apiKeyLabel}
          value={config.hermesApiKey}
          placeholder="API_SERVER_KEY"
          hint={copy.integrations.hermes.apiKeyHint}
          onChange={(v) => setIntegrationConfig({ hermesApiKey: v })}
        />
      </CredentialsCollapsible>
    </div>
  );
}

export function SettingsNvidiaPanel() {
  const copy = useI18n();
  const config = useWorkspaceStore((s) => s.integrationConfig);
  const status = useWorkspaceStore((s) => s.integrationStatus);
  const setIntegrationConfig = useWorkspaceStore((s) => s.setIntegrationConfig);
  const saveIntegrationConfig = useWorkspaceStore((s) => s.saveIntegrationConfig);
  const refreshIntegrationStatus = useWorkspaceStore((s) => s.refreshIntegrationStatus);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl brand-icon-wrap brand-icon-wrap-nvidia flex items-center justify-center">
          <NvidiaIcon size={18} />
        </div>
        <div>
          <h3 className="text-sm font-medium">{copy.integrations.nvidia.title}</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{copy.integrations.nvidia.subtitle}</p>
        </div>
      </div>

      <IntegrationSection title={copy.integrations.nvidia.operationalTitle} description={copy.integrations.nvidia.operationalDesc}>
        <div className="flex flex-wrap gap-2 mb-3">
          <StatusLine ok={!!status?.nvidiaOnline} label={status?.nvidiaOnline ? copy.integrations.nvidia.nimOnline : copy.integrations.nvidia.nimOffline} />
          <StatusLine ok={!!status?.nemotronViaHermes} label={status?.nemotronViaHermes ? copy.integrations.nvidia.nemotronReady : copy.integrations.nvidia.nemotronOffline} />
        </div>
        <OperationalRow label={copy.integrations.nvidia.endpointLabel} value={config.nvidiaNimEndpoint || "https://integrate.api.nvidia.com/v1"} ok={!!status?.nvidiaOnline} />
        <OperationalRow label={copy.integrations.nvidia.modelLabel} value={status?.hermesModel ?? "nvidia/nemotron-3-ultra-550b-a55b"} ok={!!status?.nemotronViaHermes} />
        <OperationalRow label={copy.integrations.nvidia.healthLabel} value={status?.nvidiaMessage ?? "—"} ok={!!status?.nvidiaOnline} />
        <OperationalRow label={copy.integrations.nvidia.routingLabel} value={status?.nemotronViaHermes ? copy.integrations.nvidia.routingLive : copy.integrations.nvidia.routingBlocked} ok={!!status?.nemotronViaHermes} />
        <button onClick={() => void refreshIntegrationStatus()} className="btn-secondary px-4 py-2 text-xs mt-3">
          {copy.integrations.refresh}
        </button>
      </IntegrationSection>

      <IntegrationSection title={copy.integrations.nvidia.models} description={copy.integrations.nvidia.modelsDesc}>
        <SkillRow name="Nemotron (via Hermes)" description={copy.integrations.nvidia.nemotronDesc} enabled={!!status?.nemotronViaHermes} onLabel={copy.skills.on} offLabel={copy.skills.off} />
        <SkillRow name="Vision · Web extract · Compression" description={copy.integrations.nvidia.auxDesc} enabled={!!status?.nvidiaKeyConfigured} onLabel={copy.skills.on} offLabel={copy.skills.off} />
      </IntegrationSection>

      <CredentialsCollapsible
        title={copy.integrations.credentials}
        description={copy.integrations.nvidia.keysDesc}
        saveLabel={copy.integrations.save}
        onSave={() => void saveIntegrationConfig()}
      >
        <CredentialField
          label={copy.integrations.nvidia.apiKeyLabel}
          value={config.nvidiaApiKey}
          placeholder="nvapi-..."
          hint={copy.integrations.nvidia.apiKeyHint}
          onChange={(v) => setIntegrationConfig({ nvidiaApiKey: v })}
        />
        <CredentialField
          label={copy.integrations.nvidia.endpointLabel}
          value={config.nvidiaNimEndpoint}
          placeholder="https://integrate.api.nvidia.com/v1"
          mono
          onChange={(v) => setIntegrationConfig({ nvidiaNimEndpoint: v })}
        />
        <CredentialField
          label={copy.integrations.nvidia.openaiKeyLabel}
          value={config.openaiApiKey}
          placeholder="sk-... (optional)"
          hint={copy.integrations.nvidia.openaiKeyHint}
          onChange={(v) => setIntegrationConfig({ openaiApiKey: v })}
        />
      </CredentialsCollapsible>
    </div>
  );
}
