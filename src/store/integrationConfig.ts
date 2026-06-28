import { isTauri } from "../lib/platform";

export interface IntegrationConfig {
  hermesGatewayUrl: string;
  hermesApiKey: string;
  nvidiaApiKey: string;
  nvidiaNimEndpoint: string;
  openaiApiKey: string;
  telegramApiId: string;
  telegramApiHash: string;
}

export interface IntegrationStatus {
  hermesOnline: boolean;
  hermesMessage: string;
  hermesGatewayUrl: string;
  hermesModel: string;
  nvidiaKeyConfigured: boolean;
  nvidiaOnline: boolean;
  nvidiaMessage: string;
  nemotronViaHermes: boolean;
  skillsScan: boolean;
  skillsCorrelate: boolean;
  skillsBrief: boolean;
  hermesBinary: string;
}

export const defaultIntegrationConfig: IntegrationConfig = {
  hermesGatewayUrl: "https://signal-canvas.tethsiga.workers.dev/hermes",
  hermesApiKey: "",
  nvidiaApiKey: "",
  nvidiaNimEndpoint: "https://integrate.api.nvidia.com/v1",
  openaiApiKey: "",
  telegramApiId: "",
  telegramApiHash: "",
};

export const INTEGRATIONS_KEY = "signal-canvas-integrations";
export const SECRETS_RESET_VERSION = "2026-hosted-hermes";

const NON_SECRET_FIELDS: (keyof IntegrationConfig)[] = [
  "hermesGatewayUrl",
  "nvidiaNimEndpoint",
];

export function loadIntegrationConfig(): IntegrationConfig {
  try {
    if (localStorage.getItem("signal-canvas-secrets-version") !== SECRETS_RESET_VERSION) {
      localStorage.removeItem(INTEGRATIONS_KEY);
      localStorage.setItem("signal-canvas-secrets-version", SECRETS_RESET_VERSION);
    }
    if (isTauri) {
      return { ...defaultIntegrationConfig };
    }
    const raw = localStorage.getItem(INTEGRATIONS_KEY);
    if (raw) return { ...defaultIntegrationConfig, ...JSON.parse(raw) };
  } catch {
    /* defaults */
  }
  return { ...defaultIntegrationConfig };
}

/** Persist non-secret prefs to localStorage; secrets go to secure disk via Tauri. */
export function persistIntegrationConfigLocal(config: IntegrationConfig) {
  const partial: Partial<IntegrationConfig> = {};
  for (const key of NON_SECRET_FIELDS) {
    partial[key] = config[key];
  }
  try {
    const existing = JSON.parse(localStorage.getItem(INTEGRATIONS_KEY) ?? "{}");
    localStorage.setItem(
      INTEGRATIONS_KEY,
      JSON.stringify({ ...existing, ...partial }),
    );
  } catch {
    localStorage.setItem(INTEGRATIONS_KEY, JSON.stringify(partial));
  }
}

export function persistIntegrationConfig(config: IntegrationConfig) {
  persistIntegrationConfigLocal(config);
}
