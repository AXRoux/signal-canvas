import { useEffect, useState } from "react";
import { TelegramIcon } from "../icons/TelegramIcon";
import { IntegrationSection } from "../integration/IntegrationLayout";
import { CredentialField } from "./CredentialField";
import { useI18n } from "../../hooks/useI18n";
import { useWorkspaceStore } from "../../store/workspaceStore";
import {
  fetchTelegramStatus,
  telegramSendCode,
  telegramSignIn,
} from "../../lib/telegramClient";

function StatusLine({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={
        ok
          ? "status-badge-success text-[10px] px-2 py-0.5 rounded-full border"
          : "status-badge-neutral text-[10px] px-2 py-0.5 rounded-full border"
      }
    >
      {label}
    </span>
  );
}

export function SettingsTelegramPanel() {
  const copy = useI18n();
  const config = useWorkspaceStore((s) => s.integrationConfig);
  const setIntegrationConfig = useWorkspaceStore((s) => s.setIntegrationConfig);
  const saveIntegrationConfig = useWorkspaceStore((s) => s.saveIntegrationConfig);

  const [apiId, setApiId] = useState(config.telegramApiId);
  const [apiHash, setApiHash] = useState(config.telegramApiHash);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [phoneCodeHash, setPhoneCodeHash] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    setApiId(config.telegramApiId);
    setApiHash(config.telegramApiHash);
  }, [config.telegramApiId, config.telegramApiHash]);

  useEffect(() => {
    if (!config.telegramApiId || !config.telegramApiHash) {
      setAuthorized(false);
      setUsername(null);
      return;
    }
    void fetchTelegramStatus(config).then((s) => {
      setAuthorized(s.authorized);
      setUsername(s.username ?? null);
    });
  }, [config.telegramApiId, config.telegramApiHash]);

  async function saveCreds() {
    setIntegrationConfig({ telegramApiId: apiId, telegramApiHash: apiHash });
    await saveIntegrationConfig();
    setStatusMsg(copy.integrations.telegram.credsSaved);
  }

  async function handleSendCode() {
    setBusy("code");
    try {
      setIntegrationConfig({ telegramApiId: apiId, telegramApiHash: apiHash });
      await saveIntegrationConfig();
      const res = await telegramSendCode(useWorkspaceStore.getState().integrationConfig, phone);
      setPhoneCodeHash(res.phoneCodeHash);
      setStatusMsg(copy.integrations.telegram.codeSent);
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function handleSignIn() {
    setBusy("signin");
    try {
      await telegramSignIn(useWorkspaceStore.getState().integrationConfig, phone, code, phoneCodeHash);
      setAuthorized(true);
      setStatusMsg(copy.integrations.telegram.signedIn);
      const status = await fetchTelegramStatus(useWorkspaceStore.getState().integrationConfig);
      setUsername(status.username ?? null);
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  const credsConfigured = !!config.telegramApiId && !!config.telegramApiHash;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl brand-icon-wrap flex items-center justify-center bg-[#229ED9]/10">
          <TelegramIcon size={22} />
        </div>
        <div>
          <h3 className="text-sm font-medium">{copy.integrations.telegram.title}</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{copy.integrations.telegram.subtitle}</p>
        </div>
      </div>

      <IntegrationSection
        title={copy.integrations.telegram.operationalTitle}
        description={copy.integrations.telegram.operationalDesc}
      >
        <div className="flex flex-wrap gap-2 mb-3">
          <StatusLine
            ok={credsConfigured}
            label={credsConfigured ? copy.integrations.telegram.credsReady : copy.integrations.telegram.credsMissing}
          />
          <StatusLine
            ok={authorized}
            label={authorized ? copy.integrations.telegram.sessionReady : copy.integrations.telegram.sessionMissing}
          />
        </div>
        {authorized && (
          <p className="text-[11px] text-emerald-600 font-mono mb-2">
            {copy.integrations.telegram.connectedAs} @{username ?? "user"}
          </p>
        )}
        <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
          {copy.integrations.telegram.monitorHint}
        </p>
      </IntegrationSection>

      <details className="surface-card overflow-hidden group" open={!authorized}>
        <summary className="px-4 py-3 border-b border-[var(--color-border)] cursor-pointer list-none flex items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-medium text-[var(--color-text-primary)] uppercase tracking-wider">
              {copy.integrations.credentials}
            </h3>
            <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
              {copy.integrations.telegram.credentialsDesc}
            </p>
          </div>
          <span className="text-[10px] text-[var(--color-text-tertiary)] group-open:rotate-180 transition-transform">
            ▼
          </span>
        </summary>
        <div className="p-4 space-y-3">
          <CredentialField
            label={copy.integrations.telegram.apiIdLabel}
            hint={copy.integrations.telegram.apiIdHint}
            value={apiId}
            onChange={setApiId}
            mono
          />
          <CredentialField
            label={copy.integrations.telegram.apiHashLabel}
            hint={copy.integrations.telegram.apiHashHint}
            value={apiHash}
            onChange={setApiHash}
            mono
          />
          <a
            href="https://my.telegram.org/apps"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-[#229ED9] hover:underline inline-block"
          >
            {copy.integrations.telegram.getApiLink}
          </a>
          <button type="button" onClick={() => void saveCreds()} className="btn-secondary px-4 py-2 text-xs">
            {copy.integrations.save}
          </button>

          {!authorized && credsConfigured && (
            <div className="pt-3 border-t border-[var(--color-border)] space-y-2">
              <p className="text-[11px] text-[var(--color-text-secondary)]">{copy.integrations.telegram.signInDesc}</p>
              <CredentialField
                label={copy.integrations.telegram.phoneLabel}
                hint={copy.integrations.telegram.phoneHint}
                value={phone}
                onChange={setPhone}
                mono
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-secondary px-3 py-1.5 text-[11px]"
                  disabled={!!busy}
                  onClick={() => void handleSendCode()}
                >
                  {copy.integrations.telegram.sendCode}
                </button>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={copy.integrations.telegram.codePlaceholder}
                  className="surface-input flex-1 min-w-[120px] px-2 py-1.5 text-xs font-mono"
                />
                <button
                  type="button"
                  className="btn-impact px-3 py-1.5 text-[11px]"
                  disabled={!!busy}
                  onClick={() => void handleSignIn()}
                >
                  {copy.integrations.telegram.signIn}
                </button>
              </div>
            </div>
          )}

          {statusMsg && (
            <p className="text-[10px] text-[var(--color-text-secondary)] font-mono">{statusMsg}</p>
          )}
        </div>
      </details>
    </div>
  );
}
