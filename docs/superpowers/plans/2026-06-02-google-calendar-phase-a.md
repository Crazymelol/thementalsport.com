# Google Suite Phase A (Foundation + Calendar) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Mike real Google access through a single stored OAuth2 refresh token, and wire Google Calendar read + create (create behind the approval gate) end-to-end.

**Architecture:** A new `mina/src/lib/google.ts` holds the OAuth2 client (built from three env vars) and typed Calendar helpers. A one-time browser connect flow (`/api/google/auth` + `/api/google/callback`) captures the refresh token. The two existing Calendar tool stubs in `tools.ts` become real, falling back to stub data when Google isn't configured — exactly like the Gmail integration already does.

**Tech Stack:** Next.js 16 App Router (Node runtime), TypeScript, `googleapis` npm package, Vitest for unit tests.

---

## File Structure

- `mina/src/lib/google.ts` (new) — OAuth2 client, `GOOGLE_SCOPES`, `googleConfigured()`, `GoogleAuthError`, `isAuthError()`, `listCalendarEvents()`, `createCalendarEvent()`.
- `mina/src/lib/google.test.ts` (new) — unit tests for the pure logic (config detection, scopes, auth-error mapping).
- `mina/src/lib/tools.ts` (modify) — replace `get_calendar_events` and `create_calendar_event` `run()` bodies with real-or-stub logic.
- `mina/src/lib/tools.test.ts` (new) — unit tests for Calendar tool stub-fallback when unconfigured.
- `mina/src/app/api/google/auth/route.ts` (new) — redirect to Google consent.
- `mina/src/app/api/google/callback/route.ts` (new) — exchange code, display refresh token.
- `mina/src/app/api/chat/route.ts` (modify) — inject current date/timezone into the system message so the model can produce ISO datetimes.
- `mina/next.config.ts` (modify) — add `googleapis` to `serverExternalPackages`.
- `mina/.env.example` (modify) — document the three `GOOGLE_*` vars.
- `mina/package.json` (modify) — add deps + `test` script.
- `mina/vitest.config.ts` (new) — Vitest config.
- `docs/google-setup.md` (new) — click-by-click setup guide for the user.

---

## Task 1: Add dependencies and test runner

**Files:**
- Modify: `mina/package.json`
- Create: `mina/vitest.config.ts`

- [ ] **Step 1: Install runtime + dev dependencies**

Run:
```bash
cd mina && npm install googleapis && npm install -D vitest
```
Expected: both install; `node_modules/googleapis` and `node_modules/google-auth-library` (transitive) exist.

- [ ] **Step 2: Add the test script**

Modify `mina/package.json` `scripts` to include:
```json
"test": "vitest run"
```

- [ ] **Step 3: Create the Vitest config**

Create `mina/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Verify the runner works (no tests yet is fine)**

Run: `cd mina && npx vitest run`
Expected: exits 0 with "No test files found" or runs zero tests.

- [ ] **Step 5: Commit**

```bash
git add mina/package.json mina/package-lock.json mina/vitest.config.ts
git commit -m "chore(mina): add googleapis + vitest"
```

---

## Task 2: Google connection foundation (config, scopes, auth client, errors)

**Files:**
- Create: `mina/src/lib/google.ts`
- Test: `mina/src/lib/google.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `mina/src/lib/google.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { googleConfigured, GOOGLE_SCOPES, isAuthError, GoogleAuthError } from "./google";

afterEach(() => vi.unstubAllEnvs());

describe("googleConfigured", () => {
  it("is false when env vars are missing", () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "");
    vi.stubEnv("GOOGLE_REFRESH_TOKEN", "");
    expect(googleConfigured()).toBe(false);
  });

  it("is true only when all three are set", () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "id");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "secret");
    vi.stubEnv("GOOGLE_REFRESH_TOKEN", "token");
    expect(googleConfigured()).toBe(true);
  });
});

describe("GOOGLE_SCOPES", () => {
  it("includes calendar, drive, docs, sheets, contacts", () => {
    expect(GOOGLE_SCOPES).toEqual([
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/documents",
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/contacts",
    ]);
  });
});

describe("isAuthError", () => {
  it("detects invalid_grant", () => {
    expect(isAuthError(new Error("invalid_grant: token expired"))).toBe(true);
  });
  it("ignores unrelated errors", () => {
    expect(isAuthError(new Error("event not found"))).toBe(false);
  });
  it("recognizes a GoogleAuthError instance", () => {
    expect(isAuthError(new GoogleAuthError())).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd mina && npx vitest run src/lib/google.test.ts`
Expected: FAIL — `./google` has no such exports / module not found.

- [ ] **Step 3: Write the implementation**

Create `mina/src/lib/google.ts`:
```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd mina && npx vitest run src/lib/google.test.ts`
Expected: PASS (all 6 assertions).

- [ ] **Step 5: Commit**

```bash
git add mina/src/lib/google.ts mina/src/lib/google.test.ts
git commit -m "feat(mina): Google OAuth connection foundation"
```

---

## Task 3: Calendar helpers (list + create)

**Files:**
- Modify: `mina/src/lib/google.ts`

(These call the live Google API, so they are covered by manual e2e on Vercel — see Task 8 — not unit tests, to avoid brittle network mocks.)

- [ ] **Step 1: Add the Calendar types and helpers to `mina/src/lib/google.ts`**

Append:
```ts
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
```

- [ ] **Step 2: Verify it type-checks**

Run: `cd mina && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add mina/src/lib/google.ts
git commit -m "feat(mina): Google Calendar list + create helpers"
```

---

## Task 4: Wire the Calendar tools (real or stub)

**Files:**
- Modify: `mina/src/lib/tools.ts`
- Test: `mina/src/lib/tools.test.ts`

The current `get_calendar_events` and `create_calendar_event` tools return stub
JSON. Change them to call the Google helpers when `googleConfigured()`, else keep
the stub. `create_calendar_event` stays `tier: "write"` (approval gate unchanged).
Its input schema changes to accept an ISO `startDateTime` + `durationMin`.

- [ ] **Step 1: Write the failing test (stub fallback when unconfigured)**

Create `mina/src/lib/tools.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { getTool } from "./tools";

afterEach(() => vi.unstubAllEnvs());

describe("get_calendar_events stub fallback", () => {
  it("returns stub events when Google is not configured", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "");
    vi.stubEnv("GOOGLE_REFRESH_TOKEN", "");
    const tool = getTool("get_calendar_events");
    expect(tool).toBeDefined();
    const out = JSON.parse(await tool!.run({ date: "today" }));
    expect(out.note).toMatch(/stub/i);
    expect(Array.isArray(out.events)).toBe(true);
  });
});

describe("create_calendar_event approval card summary", () => {
  it("summarizes the proposed event for the approval card", () => {
    const tool = getTool("create_calendar_event");
    const s = tool!.summarize!({
      title: "Call with Alex",
      startDateTime: "2026-06-05T15:00:00+01:00",
      durationMin: 30,
    });
    expect(s.title).toBe("Create calendar event");
    expect(s.detail).toMatch(/Call with Alex/);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd mina && npx vitest run src/lib/tools.test.ts`
Expected: FAIL — `create_calendar_event` summary detail format differs / schema mismatch.

- [ ] **Step 3: Update the imports in `mina/src/lib/tools.ts`**

At the top, alongside the existing gmail/web imports, add:
```ts
import { googleConfigured, listCalendarEvents, createCalendarEvent } from "./google";
```

- [ ] **Step 4: Replace the `get_calendar_events` `run` body**

Replace the existing `get_calendar_events` `run:` with:
```ts
    run: async (input) => {
      const date = str(input.date, "today");
      if (!googleConfigured()) {
        return JSON.stringify({
          date,
          events: [
            { time: "09:00", title: "Standup", durationMin: 15 },
            { time: "11:00", title: "Deep work block", durationMin: 90 },
            { time: "15:00", title: "Call with Alex (Acme Corp)", durationMin: 45 },
          ],
          note: "STUB DATA — not a real calendar yet.",
        });
      }
      try {
        // Whole-day window in the server's local time; the model asked about `date`.
        const now = new Date();
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        const data = await listCalendarEvents(start.toISOString(), end.toISOString());
        return JSON.stringify({ ...data, note: "Live Google Calendar." });
      } catch (e) {
        return JSON.stringify({
          date,
          events: [],
          error: e instanceof Error ? e.message : "Couldn't reach Google Calendar.",
        });
      }
    },
```

- [ ] **Step 5: Replace the `create_calendar_event` definition**

Replace the whole `create_calendar_event` object with:
```ts
  {
    name: "create_calendar_event",
    description:
      "Create a calendar event. WRITES to the calendar, so it requires user confirmation. Provide startDateTime as ISO 8601 with timezone offset; use the current date/time given in the system context to resolve phrases like 'tomorrow at 3pm'.",
    tier: "write",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        startDateTime: {
          type: "string",
          description: "ISO 8601 with offset, e.g. 2026-06-05T15:00:00+01:00",
        },
        durationMin: { type: "number", description: "Length in minutes (default 30)." },
      },
      required: ["title", "startDateTime"],
    },
    run: async (input) => {
      const title = str(input.title);
      const startDateTime = str(input.startDateTime);
      const durationMin = typeof input.durationMin === "number" ? input.durationMin : 30;
      if (!googleConfigured()) {
        return JSON.stringify({
          created: true,
          title,
          startDateTime,
          note: "STUB — pretend this was added (Google Calendar not connected).",
        });
      }
      try {
        const res = await createCalendarEvent({ title, startDateTime, durationMin });
        return JSON.stringify({ ...res, note: "Event created in Google Calendar." });
      } catch (e) {
        return JSON.stringify({
          created: false,
          title,
          error: e instanceof Error ? e.message : "Couldn't create the event.",
        });
      }
    },
    summarize: (input) => ({
      title: "Create calendar event",
      detail: `“${str(input.title)}” at ${str(input.startDateTime)}${
        typeof input.durationMin === "number" ? ` for ${input.durationMin} min` : ""
      }`,
    }),
  },
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd mina && npx vitest run src/lib/tools.test.ts`
Expected: PASS (both tests).

- [ ] **Step 7: Type-check**

Run: `cd mina && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add mina/src/lib/tools.ts mina/src/lib/tools.test.ts
git commit -m "feat(mina): real Google Calendar tools with stub fallback"
```

---

## Task 5: Inject current date/time into the system message

**Files:**
- Modify: `mina/src/app/api/chat/route.ts`

So the model can convert "tomorrow at 3pm" into a correct ISO `startDateTime`.

- [ ] **Step 1: Find where the system message is assembled**

In `mina/src/app/api/chat/route.ts`, the `messages` array is built with a
`{ role: "system", content: MINA_SYSTEM_PROMPT }` entry at the top.

- [ ] **Step 2: Append the current date/time to that system content**

Change the system message construction to:
```ts
      const nowLine = `\n\nCurrent date and time: ${new Date().toString()}.`;
      const messages = [
        { role: "system" as const, content: MINA_SYSTEM_PROMPT + nowLine },
        ...body.messages,
      ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[];
```

- [ ] **Step 3: Type-check + build**

Run: `cd mina && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add mina/src/app/api/chat/route.ts
git commit -m "feat(mina): give the model the current date for scheduling"
```

---

## Task 6: The one-time connect flow

**Files:**
- Create: `mina/src/app/api/google/auth/route.ts`
- Create: `mina/src/app/api/google/callback/route.ts`

- [ ] **Step 1: Create the auth-redirect route**

Create `mina/src/app/api/google/auth/route.ts`:
```ts
import { NextResponse } from "next/server";
import { oauthClient, GOOGLE_SCOPES } from "@/lib/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const redirectUri = new URL("/api/google/callback", req.url).toString();
  const client = oauthClient(redirectUri);
  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES,
  });
  return NextResponse.redirect(url);
}
```

- [ ] **Step 2: Create the callback route**

Create `mina/src/app/api/google/callback/route.ts`:
```ts
import { oauthClient } from "@/lib/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return new Response("Missing ?code from Google.", { status: 400 });
  }
  const redirectUri = new URL("/api/google/callback", req.url).toString();
  const client = oauthClient(redirectUri);
  try {
    const { tokens } = await client.getToken(code);
    const refresh = tokens.refresh_token;
    if (!refresh) {
      return htmlPage(
        "No refresh token returned",
        "Google didn't return a refresh token. Remove this app at " +
          "https://myaccount.google.com/permissions and try connecting again.",
      );
    }
    return htmlPage(
      "Mike is connected to Google ✅",
      "Copy the value below and add it in Vercel as the environment variable " +
        "<b>GOOGLE_REFRESH_TOKEN</b>, then redeploy.<br><br><code>" +
        escapeHtml(refresh) +
        "</code>",
    );
  } catch (e) {
    return htmlPage("Connection failed", escapeHtml(e instanceof Error ? e.message : "Unknown error"));
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function htmlPage(title: string, body: string): Response {
  return new Response(
    `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
     <style>body{font-family:system-ui;background:#0f1115;color:#e7e9ee;max-width:640px;margin:10vh auto;padding:0 1rem;line-height:1.6}
     code{display:block;word-break:break-all;background:#171a21;border:1px solid #262b36;padding:1rem;border-radius:8px;color:#5eead4}</style></head>
     <body><h1>${title}</h1><p>${body}</p></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
```

- [ ] **Step 3: Type-check + build**

Run: `cd mina && npx tsc --noEmit && npm run build`
Expected: compiles; routes `/api/google/auth` and `/api/google/callback` appear as dynamic functions.

- [ ] **Step 4: Commit**

```bash
git add mina/src/app/api/google
git commit -m "feat(mina): one-time Google connect flow (auth + callback)"
```

---

## Task 7: Config, env docs, and bundling

**Files:**
- Modify: `mina/next.config.ts`
- Modify: `mina/.env.example`
- Create: `docs/google-setup.md`

- [ ] **Step 1: Add googleapis to serverExternalPackages**

In `mina/next.config.ts`, extend the existing array:
```ts
  serverExternalPackages: ["imapflow", "nodemailer", "googleapis"],
```

- [ ] **Step 2: Document the env vars**

Append to `mina/.env.example`:
```
# --- Google Suite (optional) ---
# Lets Mike read/act on Calendar, Drive, Docs, Sheets, Contacts.
# See docs/google-setup.md for the one-time setup. Leave blank to use sample data.
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
```

- [ ] **Step 3: Write the setup guide**

Create `docs/google-setup.md` with the click-by-click (Google Cloud project →
enable Calendar/Drive/Docs/Sheets/People APIs → OAuth consent screen, External,
add self, add the 5 scopes, **Publish to Production** → create OAuth client
"Web application" with redirect `https://<domain>/api/google/callback` → put
CLIENT_ID/SECRET in Vercel, redeploy → visit `/api/google/auth`, click Allow past
the unverified warning → copy refresh token into Vercel as GOOGLE_REFRESH_TOKEN,
redeploy). Note the unverified-app warning is expected and safe for personal use.

- [ ] **Step 4: Build to confirm nothing broke**

Run: `cd mina && npm run build`
Expected: success.

- [ ] **Step 5: Commit**

```bash
git add mina/next.config.ts mina/.env.example docs/google-setup.md
git commit -m "chore(mina): google env docs + bundling + setup guide"
```

---

## Task 8: Manual end-to-end verification (on Vercel)

The sandbox blocks Google, so this runs against the live deployment. Not a code
task — a verification checklist performed with the user.

- [ ] **Step 1:** User completes `docs/google-setup.md` (creates project, sets the
  three env vars in Vercel, completes `/api/google/auth`).
- [ ] **Step 2:** Reload Mike, ask "What's on my calendar today?" → expect a real
  calendar card (not the Standup/Deep-work stub).
- [ ] **Step 3:** Ask "Add a 30-minute event called Test tomorrow at 3pm" → expect
  an approval card showing the title + ISO time → approve → confirm the event
  appears in the real Google Calendar.
- [ ] **Step 4:** Temporarily blank `GOOGLE_REFRESH_TOKEN` in Vercel, redeploy, ask
  for the calendar → expect Mike to fall back gracefully (stub or a clean
  "reconnect me" message), not crash. Restore the token afterward.

---

## Self-Review Notes

- **Spec coverage:** Foundation (Task 2), Calendar read+write (Tasks 3–4), connect
  flow (Task 6), Production-publish + scopes documented (Task 7 guide), error
  handling/`invalid_grant` (Tasks 2–4), stub fallback (Task 4), security/approval
  gate (Task 4 keeps `tier: "write"`), testing (Tasks 2, 4, 8). Drive/Docs/Sheets/
  Contacts are intentionally deferred to Phase B+ per the spec.
- **Type consistency:** `googleConfigured`, `listCalendarEvents`, `createCalendarEvent`,
  `GoogleAuthError`, `isAuthError`, `oauthClient`, `GOOGLE_SCOPES` are defined in
  Task 2/3 and used with the same signatures in Tasks 4 and 6.
- **No placeholders:** every code step contains the real code.
