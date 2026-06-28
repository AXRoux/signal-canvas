import { invoke } from "@tauri-apps/api/core";
import type { AgentScanResult } from "../store/types";
import type { IntegrationConfig, IntegrationStatus } from "../store/integrationConfig";
import { isWeb } from "./platform";
import { checkHermesHealthWeb, fetchIntegrationsWeb } from "./webApi";

export interface HermesHealth {
  online: boolean;
  url: string;
  version?: string;
  message: string;
}

export interface AgentScanRequest {
  handle: string;
  context?: string;
  language: "en" | "pt";
}

export async function checkHermesHealth(): Promise<HermesHealth> {
  if (isWeb) {
    const res = await checkHermesHealthWeb();
    return {
      online: !!res.online,
      url: "",
      message: res.message ?? (res.online ? "online" : "offline"),
    };
  }
  return invoke<HermesHealth>("hermes_health");
}

export async function agentScan(request: AgentScanRequest): Promise<AgentScanResult> {
  return invoke<AgentScanResult>("hermes_scan", { request });
}

export async function agentCorrelate(
  selectedNodeId: string,
  language: "en" | "pt",
): Promise<Pick<AgentScanResult, "correlateNodes" | "correlateEdges">> {
  return invoke("hermes_correlate", { selectedNodeId, language });
}

export async function fetchIntegrationStatus(
  config: IntegrationConfig,
): Promise<IntegrationStatus> {
  if (isWeb) {
    const health = await checkHermesHealthWeb().catch(() => ({ online: false, message: "offline" }));
    return {
      hermesOnline: !!health.online,
      hermesMessage: ("message" in health && health.message) ? health.message : "",
      hermesGatewayUrl: config.hermesGatewayUrl,
      hermesModel: "",
      nvidiaKeyConfigured: !!config.nvidiaApiKey,
      nvidiaOnline: false,
      nvidiaMessage: "",
      nemotronViaHermes: false,
      skillsScan: false,
      skillsCorrelate: false,
      skillsBrief: false,
      hermesBinary: "",
    };
  }
  return invoke<IntegrationStatus>("integration_status", { config });
}

export async function saveIntegrationConfigToDisk(
  config: IntegrationConfig,
): Promise<void> {
  await invoke("save_integration_config", { config });
}

export async function loadIntegrationConfigFromDisk(): Promise<IntegrationConfig | null> {
  if (isWeb) {
    try {
      return (await fetchIntegrationsWeb()) as IntegrationConfig;
    } catch {
      return null;
    }
  }
  return invoke<IntegrationConfig | null>("load_integration_config");
}

export async function checkNvidiaHealth(
  config: IntegrationConfig,
): Promise<{ online: boolean; message: string }> {
  return invoke("nvidia_health", { config });
}

export async function ensureHermesGateway(
  config: IntegrationConfig,
): Promise<HermesHealth> {
  return invoke<HermesHealth>("ensure_hermes_gateway", { config });
}

export async function setupIntegrations(): Promise<string> {
  return invoke<string>("setup_integrations_status");
}
