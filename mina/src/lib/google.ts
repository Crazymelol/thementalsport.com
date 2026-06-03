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

// ---- Drive ----------------------------------------------------------------

/** Build a Drive `q` filter. Exported for testing. */
export function driveQuery(search?: string): string {
  let q = "trashed = false";
  if (search && search.trim()) {
    const safe = search.trim().replace(/'/g, "\\'");
    q += ` and name contains '${safe}'`;
  }
  return q;
}

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
};

/** List up to 20 recent Drive files, optionally filtered by name. */
export async function listDriveFiles(
  search?: string,
): Promise<{ search: string; files: DriveFile[] }> {
  const drive = google.drive({ version: "v3", auth: getAuthClient() });
  try {
    const res = await drive.files.list({
      q: driveQuery(search),
      orderBy: "modifiedTime desc",
      pageSize: 20,
      fields: "files(id,name,mimeType,modifiedTime,webViewLink)",
    });
    const files: DriveFile[] = (res.data.files ?? []).map((f) => ({
      id: f.id ?? "",
      name: f.name ?? "(unnamed)",
      mimeType: f.mimeType ?? "",
      modifiedTime: f.modifiedTime ?? undefined,
      webViewLink: f.webViewLink ?? undefined,
    }));
    return { search: search ?? "", files };
  } catch (e) {
    if (isAuthError(e)) throw new GoogleAuthError();
    throw e;
  }
}

/** Read a Drive file's text. Exports Google-native docs; declines binaries. */
export async function readDriveFile(
  fileId: string,
): Promise<{ id: string; name: string; mimeType: string; text: string }> {
  const drive = google.drive({ version: "v3", auth: getAuthClient() });
  try {
    const meta = await drive.files.get({
      fileId,
      fields: "id,name,mimeType",
    });
    const mimeType = meta.data.mimeType ?? "";
    const name = meta.data.name ?? "(unnamed)";

    const exportMap: Record<string, string> = {
      "application/vnd.google-apps.document": "text/plain",
      "application/vnd.google-apps.spreadsheet": "text/csv",
      "application/vnd.google-apps.presentation": "text/plain",
    };

    let text: string;
    if (exportMap[mimeType]) {
      const res = await drive.files.export(
        { fileId, mimeType: exportMap[mimeType] },
        { responseType: "text" },
      );
      text = String(res.data ?? "");
    } else if (mimeType.startsWith("text/") || mimeType === "application/json") {
      const res = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "text" },
      );
      text = String(res.data ?? "");
    } else {
      text = `(This file type — ${mimeType} — can't be read as text.)`;
    }
    if (text.length > 8000) text = text.slice(0, 8000) + "\n…(truncated)";
    return { id: fileId, name, mimeType, text };
  } catch (e) {
    if (isAuthError(e)) throw new GoogleAuthError();
    throw e;
  }
}

// ---- Docs -----------------------------------------------------------------

/** Read a Google Doc's plain text by document ID. */
export async function readDoc(
  documentId: string,
): Promise<{ id: string; title: string; text: string }> {
  const docs = google.docs({ version: "v1", auth: getAuthClient() });
  try {
    const res = await docs.documents.get({ documentId });
    const title = res.data.title ?? "(untitled)";
    const parts: string[] = [];
    for (const el of res.data.body?.content ?? []) {
      for (const pe of el.paragraph?.elements ?? []) {
        if (pe.textRun?.content) parts.push(pe.textRun.content);
      }
    }
    let text = parts.join("");
    if (text.length > 8000) text = text.slice(0, 8000) + "\n…(truncated)";
    return { id: documentId, title, text };
  } catch (e) {
    if (isAuthError(e)) throw new GoogleAuthError();
    throw e;
  }
}

/** Create a new Google Doc with a title and body text. */
export async function createDoc(args: {
  title: string;
  body: string;
}): Promise<{ created: true; id: string; title: string; webViewLink: string }> {
  const docs = google.docs({ version: "v1", auth: getAuthClient() });
  try {
    const created = await docs.documents.create({
      requestBody: { title: args.title },
    });
    const id = created.data.documentId!;
    if (args.body && args.body.trim()) {
      await docs.documents.batchUpdate({
        documentId: id,
        requestBody: {
          requests: [
            { insertText: { location: { index: 1 }, text: args.body } },
          ],
        },
      });
    }
    return {
      created: true,
      id,
      title: args.title,
      webViewLink: `https://docs.google.com/document/d/${id}/edit`,
    };
  } catch (e) {
    if (isAuthError(e)) throw new GoogleAuthError();
    throw e;
  }
}

// ---- Sheets ---------------------------------------------------------------

/** Read a range of cells from a spreadsheet (default A1:Z50 of first sheet). */
export async function readSheet(args: {
  spreadsheetId: string;
  range?: string;
}): Promise<{ id: string; range: string; rows: string[][] }> {
  const sheets = google.sheets({ version: "v4", auth: getAuthClient() });
  const range = args.range && args.range.trim() ? args.range : "A1:Z50";
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: args.spreadsheetId,
      range,
    });
    const rows = (res.data.values ?? []).map((r) => r.map((c) => String(c ?? "")));
    return { id: args.spreadsheetId, range, rows };
  } catch (e) {
    if (isAuthError(e)) throw new GoogleAuthError();
    throw e;
  }
}

/** Append one row of values to a spreadsheet. */
export async function appendSheetRow(args: {
  spreadsheetId: string;
  values: string[];
  range?: string;
}): Promise<{ appended: true; id: string; values: string[] }> {
  const sheets = google.sheets({ version: "v4", auth: getAuthClient() });
  const range = args.range && args.range.trim() ? args.range : "A1";
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: args.spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [args.values] },
    });
    return { appended: true, id: args.spreadsheetId, values: args.values };
  } catch (e) {
    if (isAuthError(e)) throw new GoogleAuthError();
    throw e;
  }
}

// ---- Contacts -------------------------------------------------------------

export type Contact = { name: string; email?: string; phone?: string };

/** Search the user's Google Contacts by name/email. */
export async function searchContacts(
  query: string,
): Promise<{ query: string; contacts: Contact[] }> {
  const people = google.people({ version: "v1", auth: getAuthClient() });
  try {
    const res = await people.people.searchContacts({
      query,
      readMask: "names,emailAddresses,phoneNumbers",
      pageSize: 10,
    });
    const contacts: Contact[] = (res.data.results ?? []).map((r) => {
      const p = r.person ?? {};
      return {
        name: p.names?.[0]?.displayName ?? "(no name)",
        email: p.emailAddresses?.[0]?.value ?? undefined,
        phone: p.phoneNumbers?.[0]?.value ?? undefined,
      };
    });
    return { query, contacts };
  } catch (e) {
    if (isAuthError(e)) throw new GoogleAuthError();
    throw e;
  }
}
