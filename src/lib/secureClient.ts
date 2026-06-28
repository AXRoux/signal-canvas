import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "./platform";
import type { AuthUser } from "../store/authStore";

export interface SecureAuthSession {
  user: AuthUser;
  token: string;
}

export interface WorkspaceVaultPayload {
  sessions: Record<string, unknown>;
  activeSessionId: string | null;
}

function normalizeVaultPayload(raw: unknown): WorkspaceVaultPayload | null {
  if (!raw || typeof raw !== "object") return null;

  if ("sessions" in raw) {
    const vault = raw as WorkspaceVaultPayload;
    return {
      sessions: (vault.sessions ?? {}) as Record<string, unknown>,
      activeSessionId: vault.activeSessionId ?? null,
    };
  }

  return {
    sessions: raw as Record<string, unknown>,
    activeSessionId: null,
  };
}

export async function secureRegister(
  name: string,
  email: string,
  passcode: string,
  role: AuthUser["role"],
): Promise<SecureAuthSession> {
  return invoke<SecureAuthSession>("secure_auth_register", { name, email, passcode, role });
}

export async function secureLogin(email: string, passcode: string): Promise<SecureAuthSession> {
  return invoke<SecureAuthSession>("secure_auth_login", { email, passcode });
}

export async function secureLogout(): Promise<void> {
  await invoke("secure_auth_logout");
}

export async function secureHasAccounts(): Promise<boolean> {
  if (!isTauri) return false;
  return invoke<boolean>("secure_has_accounts");
}

export async function secureIsUnlocked(): Promise<boolean> {
  if (!isTauri) return false;
  return invoke<boolean>("secure_is_unlocked");
}

export async function secureVaultLoad(): Promise<WorkspaceVaultPayload | null> {
  const raw = await invoke<unknown>("secure_vault_load");
  if (!raw) return null;

  if (typeof raw === "string") {
    try {
      return normalizeVaultPayload(JSON.parse(raw));
    } catch {
      console.error("[Signal Canvas] secureVaultLoad: invalid JSON string from backend");
      return null;
    }
  }

  return normalizeVaultPayload(raw);
}

export async function secureVaultSave(vault: WorkspaceVaultPayload): Promise<void> {
  await invoke("secure_vault_save", { payload: JSON.stringify(vault) });
}

export async function secureMigrateLegacy(
  sessionsJson?: string | null,
  accountsJson?: string | null,
): Promise<void> {
  await invoke("secure_migrate_legacy", {
    sessionsJson: sessionsJson ?? null,
    accountsJson: accountsJson ?? null,
  });
}

export function readLegacyLocalStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function clearLegacyLocalSecrets() {
  const keys = [
    "signal-canvas-sessions",
    "signal-canvas-active-session",
    "signal-canvas-accounts",
    "signal-canvas-auth",
    "signal-canvas-integrations",
  ];
  for (const key of keys) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}
