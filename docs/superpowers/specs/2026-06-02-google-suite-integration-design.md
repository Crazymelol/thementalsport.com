# Google Suite Integration — Design Spec

**Date:** 2026-06-02
**Feature:** Connect Mike (the AI agent) to a single personal Google account so he
can read and act on Google Calendar, Drive, Docs, Sheets, and Contacts.
**Status:** Approved design — pending implementation plan.

---

## 1. Goal

Give Mike standing, server-side access to one personal `@gmail.com` account's
Google services, using a single OAuth2 refresh token. The user connects **once**
and never re-authenticates under normal use. Reads run freely; every write goes
through the existing human approval gate.

Build order: **Calendar first** (proves the whole chain end-to-end), then Drive,
Docs, Sheets, Contacts as fast follow-ons that reuse the same foundation.

## 2. Research-driven decisions (validated 2026-06-02)

Two landmines were found and designed around:

1. **Refresh tokens expire after 7 days while the OAuth app is in "Testing"
   status.** → The app **MUST be published to "Production" status**. For a
   single personal user this needs **no Google verification** — the user clicks
   past a one-time "unverified app" warning (well under Google's 100-user cap).
   In Production, the refresh token is long-lived.
2. **Full Drive access is a "restricted" scope** (stricter than "sensitive").
   The user has explicitly chosen **full Drive access** (`.../auth/drive`),
   accepting that it works for their own account past the unverified warning,
   with the known risk that Google could tighten unverified restricted-scope
   access in future. Documented as a conscious trade-off.

Other validated facts:
- `googleapis` npm package works in Vercel serverless (Node.js runtime). No
  special bundling needed; route already uses `runtime = "nodejs"`.
- `access_type: "offline"` **and** `prompt: "consent"` together guarantee a
  refresh token is returned.
- `oauth2Client.setCredentials({ refresh_token })` makes the library
  auto-refresh access tokens transparently.
- A **"Web application"** OAuth client (not "Desktop") is correct, with the
  callback registered on the Vercel domain.
- Tokens can still be invalidated by: 6 months of inactivity, account password
  change, or explicit user revocation → handle `invalid_grant` gracefully.

## 3. Architecture

New and changed pieces, each with a single clear purpose:

### 3.1 `mina/src/lib/google.ts` (new) — the connection
- `googleConfigured(): boolean` — true when `GOOGLE_CLIENT_ID`,
  `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REFRESH_TOKEN` are all set.
- `getAuthClient(): OAuth2Client` — builds a `google.auth.OAuth2` from the three
  env vars and calls `setCredentials({ refresh_token })`. Library auto-refreshes
  access tokens.
- `GOOGLE_SCOPES: string[]` — the full scope list (see §4), used by both the
  connect flow and documentation.
- Thin typed helpers per service, returning plain objects the tools serialize:
  - `listCalendarEvents(timeMin, timeMax)`, `createCalendarEvent(...)`
  - `listDriveFiles(query)` (later phases: docs/sheets/contacts helpers)
- Centralized error mapping: detect `invalid_grant` / 401 and throw a typed
  `GoogleAuthError` so tools can surface a clean "reconnect me" message.

### 3.2 Connect flow (new, used once during setup)
- `GET /api/google/auth` — redirects to Google's consent screen via
  `generateAuthUrl({ access_type: "offline", prompt: "consent", scope: GOOGLE_SCOPES })`.
- `GET /api/google/callback` — exchanges `?code=` for tokens, then renders a
  minimal HTML page **displaying the `refresh_token`** with copy instructions
  ("paste this into Vercel as `GOOGLE_REFRESH_TOKEN`, then redeploy"). The token
  is shown only to the authenticated browser session that completed consent; it
  is never logged or persisted server-side.

### 3.3 Tools (`mina/src/lib/tools.ts`)
Replace the existing Calendar stubs with real implementations, same tier model:
- `get_calendar_events` (read) → real schedule via `listCalendarEvents`.
- `create_calendar_event` (write) → proposes an event; **approval card**; on
  approval, `createCalendarEvent` runs. Unchanged gate mechanics.
Each Google tool follows the Gmail precedent: **if `googleConfigured()` is false,
return the existing stub data** so the app never breaks pre-setup.

Later phases add `list_drive_files`/`search_drive`, `read_doc`/`write_doc`,
`read_sheet`/`update_sheet`, `search_contacts` — each read-or-write-tiered,
writes always gated.

### 3.4 Tool result cards (`ToolResultCard.tsx`)
The Calendar card already exists and renders `{date, events[]}` — real data maps
to the same shape, so no UI change is needed for Calendar. New cards added per
service in their phases.

## 4. OAuth scopes (exact strings)

Requested together at consent (so one setup covers everything):

| Service | Scope | Tier |
|---|---|---|
| Calendar (read/write) | `https://www.googleapis.com/auth/calendar` | sensitive |
| Drive (full, user's choice) | `https://www.googleapis.com/auth/drive` | restricted |
| Docs (read/write) | `https://www.googleapis.com/auth/documents` | sensitive |
| Sheets (read/write) | `https://www.googleapis.com/auth/spreadsheets` | sensitive |
| Contacts (read/write) | `https://www.googleapis.com/auth/contacts` | sensitive |

(Gmail remains on its separate App Password path, already live — not part of this
OAuth grant, to avoid disturbing a working integration.)

## 5. Environment variables (server-side only)

| Var | Source | Notes |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Google Cloud OAuth client | public-ish, still server-side |
| `GOOGLE_CLIENT_SECRET` | Google Cloud OAuth client | secret |
| `GOOGLE_REFRESH_TOKEN` | captured by `/api/google/callback` | secret; the standing permission |

Stored in Vercel env vars + local `.env.local` (gitignored). Never reach the
browser bundle.

## 6. Error handling

- Not configured → stub data (identical to Gmail behavior).
- `invalid_grant` / 401 from Google → tool returns a structured error; Mike says,
  in character, that he's lost his Google connection and needs reconnecting
  (re-run the connect flow). No crash.
- Per-call API errors (e.g. event not found) → returned as readable text Mike
  relays.

## 7. Security

- All tokens live only server-side in the `/api/*` routes (Node runtime).
- Every **write** (create event, edit doc, update sheet, change contact) passes
  the existing approval-card gate — non-negotiable, same as email sending.
- The refresh token is shown exactly once, in the callback page, to the browser
  that completed consent; it is not logged or stored on the server.
- Prompt-injection rules already in the system prompt continue to apply: content
  read from Google is DATA, never commands.

## 8. One-time setup the user performs (Google Cloud Console)

1. Create a Google Cloud project.
2. Enable APIs: Calendar, Drive, Docs, Sheets, People.
3. Configure the OAuth consent screen (External), add themselves, add the §4
   scopes, and **publish the app to Production**.
4. Create **OAuth client credentials → "Web application"**; register redirect
   URI `https://<mike-domain>/api/google/callback`.
5. Put `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` into Vercel; redeploy.
6. Visit `/api/google/auth` on the live site, click "Allow" (past the unverified
   warning), copy the refresh token from the callback page into Vercel as
   `GOOGLE_REFRESH_TOKEN`; redeploy.

A click-by-click version is provided at handoff.

## 9. Testing

- **Unit:** `googleConfigured()` truth table; stub-fallback when unset; scope
  list correctness; `invalid_grant` → `GoogleAuthError` mapping (mock the client).
- **Build:** `tsc --noEmit` + `next build` pass; `googleapis` added to
  `serverExternalPackages` if tracing requires it.
- **Manual e2e (on Vercel, since the sandbox blocks Google):** complete the
  connect flow; ask Mike for today's real events (read card); ask him to create
  an event → approval card → confirm it lands in the real calendar.

## 10. Out of scope (YAGNI)

- Multi-user login / token database (single user only).
- Gmail migration to OAuth (App Password path stays).
- Drive/Docs/Sheets/Contacts tool *bodies* beyond Calendar — same foundation,
  built in subsequent plans, not this one.
- Background/proactive automation.

## 11. Phased delivery

- **Phase A (this plan):** `lib/google.ts` foundation + connect flow + Calendar
  read/write tools + tests + setup guide. End state: Mike reads & creates real
  calendar events.
- **Phase B+:** Drive, then Docs, then Sheets, then Contacts — one plan each,
  each reusing the foundation.
