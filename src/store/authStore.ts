import { create } from "zustand";
import { isTauri, isWeb, setAuthToken } from "../lib/platform";
import {
  readLegacyLocalStorage,
  secureLogin,
  secureLogout,
  secureMigrateLegacy,
  secureRegister,
} from "../lib/secureClient";
import { lockWebVault, unlockWebVault } from "../lib/vaultCrypto";
import { loginWeb, registerWeb } from "../lib/webApi";
import { useWorkspaceStore } from "./workspaceStore";

const AUTH_KEY = "signal-canvas-auth";
const LAST_EMAIL_KEY = "signal-canvas-last-email";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "analyst" | "reviewer" | "admin";
  createdAt: string;
}

interface StoredAuth {
  user: AuthUser;
  token: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  lastEmail: string;
  login: (email: string, passcode: string) => Promise<{ ok: boolean; error?: string }>;
  loginRemote: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    passcode: string,
    role: AuthUser["role"],
  ) => Promise<{ ok: boolean; error?: string }>;
  registerRemote: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  hydrate: () => void;
}

function loadLastEmail(): string {
  try {
    return localStorage.getItem(LAST_EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

function persistLastEmail(email: string) {
  try {
    localStorage.setItem(LAST_EMAIL_KEY, email.trim().toLowerCase());
  } catch {
    /* ignore */
  }
}

function persistAuth(data: StoredAuth | null) {
  if (!data) {
    localStorage.removeItem(AUTH_KEY);
    return;
  }
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

function mapSecureUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: (user.role as AuthUser["role"]) || "analyst",
    createdAt: user.createdAt,
  };
}

async function migrateDesktopLegacy() {
  const sessions = readLegacyLocalStorage("signal-canvas-sessions");
  const accounts = readLegacyLocalStorage("signal-canvas-accounts");
  const activeSessionId = readLegacyLocalStorage("signal-canvas-active-session");
  if (!sessions && !accounts) return;

  let payload: string | null = sessions;
  if (sessions) {
    try {
      payload = JSON.stringify({
        sessions: JSON.parse(sessions),
        activeSessionId: activeSessionId ?? null,
      });
    } catch {
      payload = sessions;
    }
  }

  await secureMigrateLegacy(payload, accounts);

  if (sessions) {
    localStorage.removeItem("signal-canvas-sessions");
    localStorage.removeItem("signal-canvas-active-session");
  }
  if (accounts) {
    localStorage.removeItem("signal-canvas-accounts");
  }
}

async function finishAuth(user: AuthUser, token: string) {
  if (isWeb) setAuthToken(token);
  persistAuth({ user, token });
  persistLastEmail(user.email);
  await useWorkspaceStore.getState().hydrateSessions();
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  lastEmail: loadLastEmail(),

  hydrate: () => {
    if (isWeb) {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) {
        try {
          const auth = JSON.parse(raw) as StoredAuth;
          if (auth.token) setAuthToken(auth.token);
        } catch {
          /* ignore */
        }
      }
    }
    set({ lastEmail: loadLastEmail(), isAuthenticated: false, user: null, token: null });
  },

  login: async (email, passcode) => {
    if (isWeb) return { ok: false, error: "validation" };
    try {
      const session = await secureLogin(email, passcode);
      await migrateDesktopLegacy();
      const user = mapSecureUser(session.user);
      await finishAuth(user, session.token);
      set({ user, token: session.token, isAuthenticated: true });
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === "invalid") return { ok: false, error: "invalid" };
      return { ok: false, error: "invalid" };
    }
  },

  loginRemote: async (email, passcode) => {
    try {
      const res = await loginWeb(email.trim().toLowerCase(), passcode);
      setAuthToken(res.token);
      await unlockWebVault(passcode, res.salt);
      const user: AuthUser = {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: "analyst",
        createdAt: new Date().toISOString(),
      };
      await finishAuth(user, res.token);
      set({ user, token: res.token, isAuthenticated: true });
      return { ok: true };
    } catch {
      return { ok: false, error: "invalid" };
    }
  },

  register: async (name, email, passcode, role) => {
    if (isWeb) return { ok: false, error: "validation" };
    const normalized = email.trim().toLowerCase();
    const trimmedName = name.trim();
    if (!trimmedName || !normalized || passcode.length < 8) {
      return { ok: false, error: "validation" };
    }
    try {
      const session = await secureRegister(trimmedName, normalized, passcode, role);
      await migrateDesktopLegacy();
      const user = mapSecureUser(session.user);
      await finishAuth(user, session.token);
      set({ user, token: session.token, isAuthenticated: true });
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === "exists") return { ok: false, error: "exists" };
      if (msg === "data_key_unlock") return { ok: false, error: "exists" };
      if (msg === "validation") return { ok: false, error: "validation" };
      return { ok: false, error: "validation" };
    }
  },

  registerRemote: async (name, email, passcode) => {
    try {
      const res = await registerWeb(name.trim(), email.trim().toLowerCase(), passcode);
      setAuthToken(res.token);
      await unlockWebVault(passcode, res.salt);
      const user: AuthUser = {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: "analyst",
        createdAt: new Date().toISOString(),
      };
      await finishAuth(user, res.token);
      set({ user, token: res.token, isAuthenticated: true });
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("already")) return { ok: false, error: "exists" };
      return { ok: false, error: "validation" };
    }
  },

  logout: async () => {
    try {
      await useWorkspaceStore.getState().flushSessions();
    } catch (err) {
      console.error("[Signal Canvas] Failed to flush sessions before logout:", err);
    }
    if (isTauri) {
      try {
        await secureLogout();
      } catch {
        /* ignore */
      }
    }
    if (isWeb) lockWebVault();
    setAuthToken(null);
    persistAuth(null);
    useWorkspaceStore.getState().clearSessions();
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
