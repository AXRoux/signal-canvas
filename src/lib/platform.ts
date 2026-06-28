export const isWeb =
  import.meta.env.VITE_PLATFORM === "web" || import.meta.env.MODE === "web";

export const isTauri =
  !isWeb &&
  typeof window !== "undefined" &&
  ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);

export function apiBase(): string {
  const base = import.meta.env.VITE_API_BASE as string | undefined;
  if (base) return base.replace(/\/$/, "");
  if (isWeb && typeof window !== "undefined") return window.location.origin;
  return "";
}

export function authToken(): string | null {
  return localStorage.getItem("signal-canvas-api-token");
}

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem("signal-canvas-api-token", token);
  else localStorage.removeItem("signal-canvas-api-token");
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const token = authToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const resp = await fetch(`${apiBase()}${path}`, { ...init, headers });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error((data as { error?: string }).error ?? resp.statusText);
  }
  return data;
}
