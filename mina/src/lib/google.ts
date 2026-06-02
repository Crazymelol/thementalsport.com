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

export type CalEvent = { time: string; title: string; durationMin?: number };

/** List events between two ISO datetimes on the primary calendar. */
export async function listCalendarEvents(
  timeMin: string,
  timeMax: string,
): Promise<{ date: string; events: CalEvent[] }> {
  const calendar = google.calendar({ version: "v3", auth: getAuthClient() });
  try {
    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 25,
    });
    const events: CalEvent[] = (res.data.items ?? []).map((ev) => {
      const startISO = ev.start?.dateTime ?? ev.start?.date ?? "";
      const endISO = ev.end?.dateTime ?? ev.end?.date ?? "";
      const start = startISO ? new Date(startISO) : null;
      const end = endISO ? new Date(endISO) : null;
      const time = ev.start?.dateTime && start
        ? start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
        : "all-day";
      const durationMin =
        start && end ? Math.round((end.getTime() - start.getTime()) / 60000) : undefined;
      return { time, title: ev.summary ?? "(no title)", durationMin };
    });
    return { date: timeMin.slice(0, 10), events };
  } catch (e) {
    if (isAuthError(e)) throw new GoogleAuthError();
    throw e;
  }
}

/** Create an event from an ISO start datetime + duration. Returns a summary. */
export async function createCalendarEvent(args: {
  title: string;
  startDateTime: string; // ISO 8601 with offset, e.g. 2026-06-05T15:00:00+01:00
  durationMin: number;
}): Promise<{ created: true; title: string; startDateTime: string; htmlLink: string | null }> {
  const calendar = google.calendar({ version: "v3", auth: getAuthClient() });
  const start = new Date(args.startDateTime);
  const end = new Date(start.getTime() + args.durationMin * 60000);
  try {
    const res = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: args.title,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
      },
    });
    return {
      created: true,
      title: args.title,
      startDateTime: args.startDateTime,
      htmlLink: res.data.htmlLink ?? null,
    };
  } catch (e) {
    if (isAuthError(e)) throw new GoogleAuthError();
    throw e;
  }
}
