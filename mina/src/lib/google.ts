// Mike's Google connection. Server-side only. Built from three env vars:
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
// The googleapis library auto-refreshes access tokens from the refresh token.
// If the env vars are absent, callers fall back to stub data so the app runs.

import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/contacts",
];

/** Thrown when Google rejects our refresh token and we must reconnect. */
export class GoogleAuthError extends Error {
  constructor(message = "Google connection lost — please reconnect.") {
    super(message);
    this.name = "GoogleAuthError";
  }
}

export function googleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN,
  );
}

/** A bare OAuth2 client (no credentials) — used by the connect flow. */
export function oauthClient(redirectUri?: string): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );
}

/** An OAuth2 client primed with the stored refresh token. */
export function getAuthClient(): OAuth2Client {
  const client = oauthClient();
  client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return client;
}

export function isAuthError(e: unknown): boolean {
  if (e instanceof GoogleAuthError) return true;
  const msg = e instanceof Error ? e.message : String(e);
  return /invalid_grant|invalid_request|No refresh token|unauthorized|401/i.test(msg);
}
