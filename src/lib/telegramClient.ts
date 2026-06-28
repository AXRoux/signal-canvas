import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { apiFetch, isWeb } from "./platform";
import { telegramBridge } from "./webApi";
import type { IntegrationConfig } from "../store/integrationConfig";
import type { StreamEvent } from "../store/types";

export interface TelegramStatus {
  authorized: boolean;
  username?: string | null;
  firstName?: string | null;
  phone?: string | null;
}

function mapStatus(data: {
  authorized?: boolean;
  me?: { username?: string; firstName?: string; phone?: string };
}): TelegramStatus {
  return {
    authorized: !!data.authorized,
    username: data.me?.username ?? null,
    firstName: data.me?.firstName ?? null,
    phone: data.me?.phone ?? null,
  };
}

function creds(config: IntegrationConfig) {
  return { apiId: config.telegramApiId, apiHash: config.telegramApiHash };
}

export async function fetchTelegramStatus(config: IntegrationConfig): Promise<TelegramStatus> {
  const { apiId, apiHash } = creds(config);
  if (!apiId || !apiHash) {
    return { authorized: false, username: null, firstName: null, phone: null };
  }
  if (isWeb) {
    const data = await telegramBridge<{
      authorized?: boolean;
      me?: { username?: string; firstName?: string; phone?: string };
    }>("/status");
    return mapStatus(data);
  }
  return invoke<TelegramStatus>("telegram_status", { apiId, apiHash });
}

export async function telegramSendCode(config: IntegrationConfig, phone: string) {
  if (isWeb) {
    return telegramBridge<{ phoneCodeHash: string }>("/send-code", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  }
  return invoke<{ phoneCodeHash: string }>("telegram_send_code", {
    request: { phone, ...creds(config) },
  });
}

export async function telegramSignIn(
  config: IntegrationConfig,
  phone: string,
  code: string,
  phoneCodeHash: string,
) {
  if (isWeb) {
    return telegramBridge("/sign-in", {
      method: "POST",
      body: JSON.stringify({ phone, code, phoneCodeHash }),
    });
  }
  return invoke("telegram_sign_in", {
    request: { phone, code, phoneCodeHash, ...creds(config) },
  });
}

export async function telegramListDialogs(config: IntegrationConfig, limit = 50) {
  const { apiId, apiHash } = creds(config);
  if (isWeb) {
    return telegramBridge<{ dialogs: { id: string; title: string; username?: string; kind: string }[] }>(
      `/list-dialogs?limit=${limit}`,
    );
  }
  return invoke<{ dialogs: { id: string; title: string; username?: string; kind: string }[] }>(
    "telegram_list_dialogs",
    { apiId, apiHash, limit },
  );
}

export async function telegramJoinChat(config: IntegrationConfig, target: string) {
  if (isWeb) {
    return telegramBridge<{ id: string; title: string; username?: string }>("/join", {
      method: "POST",
      body: JSON.stringify({ target }),
    });
  }
  return invoke<{ id: string; title: string; username?: string }>("telegram_join_chat", {
    request: { target, ...creds(config) },
  });
}

export async function telegramFetchHistory(config: IntegrationConfig, chatId: string, limit = 40) {
  if (isWeb) {
    return telegramBridge<{ messages: StreamEvent[] }>(`/history?chatId=${encodeURIComponent(chatId)}&limit=${limit}`);
  }
  return invoke<{ messages: StreamEvent[] }>("telegram_fetch_history", {
    request: { chatId, limit, ...creds(config) },
  });
}

let pollTimer: ReturnType<typeof setInterval> | null = null;
let pollChatIds: string[] = [];
let pollSeen = new Set<string>();
let pollHandler: ((event: StreamEvent) => void) | null = null;

export async function telegramStartMonitor(
  config: IntegrationConfig,
  _sessionId: string,
  chatIds: string[],
) {
  if (!isWeb) {
    return invoke("telegram_start_monitor", {
      request: { sessionId: _sessionId, chatIds, ...creds(config) },
    });
  }

  await telegramStopMonitor();
  pollChatIds = chatIds;
  pollSeen = new Set();
  pollHandler = null;

  pollTimer = setInterval(() => {
    void (async () => {
      for (const chatId of pollChatIds) {
        try {
          const { messages } = await telegramFetchHistory(config, chatId, 25);
          for (const msg of messages ?? []) {
            const key = `${msg.chatId}:${msg.id}`;
            if (pollSeen.has(key)) continue;
            pollSeen.add(key);
            pollHandler?.(msg);
          }
        } catch {
          /* retry next tick */
        }
      }
    })();
  }, 5000);
}

export async function telegramStopMonitor() {
  if (!isWeb) {
    return invoke("telegram_stop_monitor");
  }
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  pollChatIds = [];
  pollSeen.clear();
}

export function listenTelegramMessages(handler: (event: StreamEvent) => void): Promise<UnlistenFn> {
  if (isWeb) {
    pollHandler = handler;
    return Promise.resolve(() => {
      if (pollHandler === handler) pollHandler = null;
    });
  }
  return listen<StreamEvent>("telegram-message", (e) => {
    if (e.payload) handler(e.payload);
  });
}

export async function telegramBridgeHealth(): Promise<boolean> {
  if (!isWeb) return true;
  try {
    await apiFetch("/api/health");
    return true;
  } catch {
    return false;
  }
}
