import { apiFetch, isWeb } from "./platform";
import type { HermesChatContext, HermesChatResponse } from "./hermesChatClient";
import type { IntegrationConfig } from "../store/integrationConfig";

function unmask(value: string): string {
  return value.startsWith("•") ? "" : value;
}

export async function hermesSessionChatWeb(
  message: string,
  language: "en" | "pt",
  hermesSessionId: string | null,
  context: HermesChatContext,
): Promise<HermesChatResponse> {
  return apiFetch("/api/hermes/chat", {
    method: "POST",
    body: JSON.stringify({ message, language, hermesSessionId, context }),
  }) as Promise<HermesChatResponse>;
}

export async function fetchIntegrationsWeb(): Promise<Partial<IntegrationConfig>> {
  const res = (await apiFetch("/api/settings/integrations")) as {
    config: IntegrationConfig;
  };
  const c = res.config;
  return {
    hermesGatewayUrl: c.hermesGatewayUrl,
    hermesApiKey: unmask(c.hermesApiKey),
    nvidiaApiKey: unmask(c.nvidiaApiKey),
    nvidiaNimEndpoint: c.nvidiaNimEndpoint,
    openaiApiKey: unmask(c.openaiApiKey),
    telegramApiId: unmask(c.telegramApiId),
    telegramApiHash: unmask(c.telegramApiHash),
  };
}

export async function saveIntegrationsWeb(config: IntegrationConfig) {
  if (!isWeb) return;
  await apiFetch("/api/settings/integrations", {
    method: "PUT",
    body: JSON.stringify(config),
  });
}

async function telegramBridge<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = (await apiFetch(`/api/telegram${path}`, init)) as { ok?: boolean; data?: T; error?: string };
  if (res.ok === false) throw new Error(res.error ?? "Telegram bridge error");
  return (res.data ?? res) as T;
}

export async function registerWeb(name: string, email: string, password: string) {
  return apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  }) as Promise<{ token: string; user: { id: string; email: string; name: string }; salt: string }>;
}

export async function loginWeb(email: string, password: string) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }) as Promise<{ token: string; user: { id: string; email: string; name: string }; salt: string }>;
}

export async function fetchVaultWeb(): Promise<{ vaultCipher: string | null; updatedAt: string | null }> {
  return apiFetch("/api/vault/workspace") as Promise<{
    vaultCipher: string | null;
    updatedAt: string | null;
  }>;
}

export async function saveVaultWeb(vaultCipher: string): Promise<{ ok: boolean; updatedAt: string }> {
  return apiFetch("/api/vault/workspace", {
    method: "PUT",
    body: JSON.stringify({ vaultCipher }),
  }) as Promise<{ ok: boolean; updatedAt: string }>;
}

export async function checkHermesHealthWeb() {
  return apiFetch("/api/hermes/health") as Promise<{ online: boolean; message?: string }>;
}

export { telegramBridge };
