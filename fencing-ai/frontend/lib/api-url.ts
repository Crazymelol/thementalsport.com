const STORAGE_KEY = "fencing_backend_url";
export const DEFAULT_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** Returns the active backend URL: localStorage override → env var → localhost fallback. */
export function getApiUrl(): string {
  if (typeof window === "undefined") return DEFAULT_API_URL;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_API_URL;
}

export function setApiUrl(url: string): void {
  const trimmed = url.trim().replace(/\/$/, "");
  if (trimmed && trimmed !== DEFAULT_API_URL) {
    localStorage.setItem(STORAGE_KEY, trimmed);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function clearApiUrlOverride(): void {
  localStorage.removeItem(STORAGE_KEY);
}
