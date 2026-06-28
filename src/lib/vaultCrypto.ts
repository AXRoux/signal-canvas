import type { InvestigationSession } from "../store/types";

export interface WorkspaceVault {
  sessions: Record<string, InvestigationSession>;
  activeSessionId: string | null;
}

const PBKDF2_ITERATIONS = 600_000;
const VAULT_LOCAL_KEY = "signal-canvas-vault";

let activeVaultKey: CryptoKey | null = null;

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const bin = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of bin) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function deriveVaultKey(password: string, saltB64: string): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: fromB64url(saltB64),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function unlockWebVault(password: string, saltB64: string): Promise<void> {
  activeVaultKey = await deriveVaultKey(password, saltB64);
}

export function lockWebVault() {
  activeVaultKey = null;
}

export function isWebVaultUnlocked(): boolean {
  return activeVaultKey !== null;
}

async function encryptWithKey(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  return `${b64url(iv)}.${b64url(cipher)}`;
}

async function decryptWithKey(key: CryptoKey, payload: string): Promise<string> {
  const [ivB, cipherB] = payload.split(".");
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromB64url(ivB) },
    key,
    fromB64url(cipherB),
  );
  return new TextDecoder().decode(plain);
}

export async function encryptSessionsForStorage(
  vault: WorkspaceVault | Record<string, InvestigationSession>,
): Promise<string> {
  if (!activeVaultKey) throw new Error("Vault locked");
  const payload =
    "sessions" in vault
      ? vault
      : { sessions: vault, activeSessionId: null as string | null };
  return encryptWithKey(activeVaultKey, JSON.stringify(payload));
}

export async function decryptSessionsFromStorage(payload: string): Promise<WorkspaceVault> {
  if (!activeVaultKey) throw new Error("Vault locked");
  const plain = await decryptWithKey(activeVaultKey, payload);
  const parsed = JSON.parse(plain) as unknown;
  if (parsed && typeof parsed === "object" && "sessions" in parsed) {
    return parsed as WorkspaceVault;
  }
  return {
    sessions: parsed as Record<string, InvestigationSession>,
    activeSessionId: null,
  };
}

export function loadEncryptedVaultLocal(): string | null {
  try {
    return localStorage.getItem(VAULT_LOCAL_KEY);
  } catch {
    return null;
  }
}

export function saveEncryptedVaultLocal(cipher: string) {
  localStorage.setItem(VAULT_LOCAL_KEY, cipher);
}

export function clearEncryptedVaultLocal() {
  localStorage.removeItem(VAULT_LOCAL_KEY);
}

export async function migratePlaintextSessions(
  password: string,
  saltB64: string,
  plaintextJson: string,
): Promise<Record<string, InvestigationSession>> {
  await unlockWebVault(password, saltB64);
  const sessions = JSON.parse(plaintextJson) as Record<string, InvestigationSession>;
  const vault: WorkspaceVault = {
    sessions,
    activeSessionId: localStorage.getItem("signal-canvas-active-session"),
  };
  const cipher = await encryptSessionsForStorage(vault);
  saveEncryptedVaultLocal(cipher);
  localStorage.removeItem("signal-canvas-sessions");
  localStorage.removeItem("signal-canvas-active-session");
  return sessions;
}
