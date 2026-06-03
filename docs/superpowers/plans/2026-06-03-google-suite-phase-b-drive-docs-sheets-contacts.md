# Google Suite Phase B — Drive, Docs, Sheets, Contacts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish wiring Mike to the rest of the Google Suite — Drive, Docs, Sheets, and Contacts — reusing the OAuth foundation already proven by Calendar (Phase A).

**Architecture:** Add thin typed helper functions to `mina/src/lib/google.ts` (one small function per Google operation), then expose each as a tool in `mina/src/lib/tools.ts` following the established real-or-stub pattern (`googleConfigured()` gate → real API or stub data). Reads auto-run; writes carry a `summarize()` and go through the existing approval gate. New result cards render the data shapes. A small fix makes the result-card footer honestly show "Live" vs "stub".

**Tech Stack:** Next.js 16 (App Router, Node.js runtime), TypeScript, `googleapis` (Drive v3, Docs v1, Sheets v4, People API v1), Vitest (node env, pure-logic tests only — no network in sandbox/CI).

---

## File Structure

- **Modify** `mina/src/lib/google.ts` — add helpers: `listDriveFiles`, `readDriveFile`, `readDoc`, `createDoc`, `readSheet`, `appendSheetRow`, `searchContacts`. Each wraps a `googleapis` call, maps to a plain object, and routes errors through the existing `isAuthError`/`GoogleAuthError`.
- **Modify** `mina/src/lib/tools.ts` — replace the `list_files`/`write_file` stubs with real Drive tools; add `read_drive_file`, `read_doc`, `create_doc`, `read_sheet`, `append_sheet_row`, `search_contacts`. All gate on `googleConfigured()`.
- **Modify** `mina/src/components/ToolResultCard.tsx` — add Drive/Doc/Sheet/Contacts cards; make the footer reflect live-vs-stub using the result's `note`.
- **Modify** `mina/src/lib/google.test.ts` — pure-logic tests for new helpers' argument shaping (no network).
- **Modify** `mina/src/lib/tools.test.ts` — stub-fallback + approval-card tests for the new tools.

**Pattern reference (follow exactly):** the existing `get_calendar_events` (read) and `create_calendar_event` (write) tools in `tools.ts`, and `listCalendarEvents`/`createCalendarEvent` in `google.ts`.

---

## Task 0: Fix the misleading result-card footer

The footer at `ToolResultCard.tsx:176` is hardcoded to `sample data · stub`, so it lies when data is live. Every tool result already includes a `note` string (`"Live Google Calendar."` vs `"STUB DATA — ..."`). Use it.

**Files:**
- Modify: `mina/src/components/ToolResultCard.tsx:141-179`

- [ ] **Step 1: Make the footer derive from the data's `note`**

In `ToolResultCard`, before the `return`, compute whether this is stub data:

```tsx
  const note =
    data && typeof data === "object" && "note" in data
      ? String((data as { note?: unknown }).note ?? "")
      : "";
  const isStub = /stub/i.test(note);
```

Then replace the hardcoded footer line:

```tsx
      <p className="mt-2 text-right text-[10px] text-mina-muted/50">
        {isStub ? "sample data · stub" : "live"}
      </p>
```

- [ ] **Step 2: Type-check**

Run: `cd mina && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add mina/src/components/ToolResultCard.tsx
git commit -m "fix(mina): result card footer reflects live vs stub data"
```

---

## Task 1: Drive helper — `listDriveFiles`

**Files:**
- Modify: `mina/src/lib/google.ts` (add after `createCalendarEvent`)
- Test: `mina/src/lib/google.test.ts`

- [ ] **Step 1: Write the failing test** (pure logic — the Drive query builder)

Add to `google.test.ts`:

```ts
import { driveQuery } from "./google";

describe("driveQuery", () => {
  it("returns trashed=false filter when no search term", () => {
    expect(driveQuery()).toBe("trashed = false");
  });
  it("adds a name contains clause, escaping single quotes", () => {
    expect(driveQuery("Q1 report")).toBe(
      "trashed = false and name contains 'Q1 report'",
    );
    expect(driveQuery("o'brien")).toBe(
      "trashed = false and name contains 'o\\'brien'",
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mina && npx vitest run src/lib/google.test.ts`
Expected: FAIL — `driveQuery` is not exported.

- [ ] **Step 3: Implement `driveQuery` + `listDriveFiles` in `google.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd mina && npx vitest run src/lib/google.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add mina/src/lib/google.ts mina/src/lib/google.test.ts
git commit -m "feat(mina): listDriveFiles helper + driveQuery builder"
```

---

## Task 2: Drive helper — `readDriveFile`

Reads a file's text. Google-native Docs/Sheets/Slides must be *exported* to text; binary/other types return a notice instead of bytes.

**Files:**
- Modify: `mina/src/lib/google.ts`

- [ ] **Step 1: Implement `readDriveFile`**

```ts
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
```

- [ ] **Step 2: Type-check**

Run: `cd mina && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add mina/src/lib/google.ts
git commit -m "feat(mina): readDriveFile helper (exports Google-native docs to text)"
```

---

## Task 3: Docs helpers — `readDoc` and `createDoc`

**Files:**
- Modify: `mina/src/lib/google.ts`

- [ ] **Step 1: Implement `readDoc` and `createDoc`**

```ts
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
```

- [ ] **Step 2: Type-check**

Run: `cd mina && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add mina/src/lib/google.ts
git commit -m "feat(mina): readDoc + createDoc helpers"
```

---

## Task 4: Sheets helpers — `readSheet` and `appendSheetRow`

**Files:**
- Modify: `mina/src/lib/google.ts`

- [ ] **Step 1: Implement `readSheet` and `appendSheetRow`**

```ts
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
```

- [ ] **Step 2: Type-check**

Run: `cd mina && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add mina/src/lib/google.ts
git commit -m "feat(mina): readSheet + appendSheetRow helpers"
```

---

## Task 5: Contacts helper — `searchContacts`

**Files:**
- Modify: `mina/src/lib/google.ts`

- [ ] **Step 1: Implement `searchContacts`**

```ts
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
```

- [ ] **Step 2: Type-check**

Run: `cd mina && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add mina/src/lib/google.ts
git commit -m "feat(mina): searchContacts helper (People API)"
```

---

## Task 6: Replace Drive stub tools with real ones

Replace the existing `list_files` and `write_file` stubs in `tools.ts` with Drive-backed tools, and add `read_drive_file`. Keep `list_files`/`write_file` *names* removed in favor of clearer names; update the system prompt only if it references them (it does not).

**Files:**
- Modify: `mina/src/lib/tools.ts:265-310` (the `list_files` and `write_file` blocks)
- Modify: `mina/src/lib/google.ts` import line in `tools.ts:15`
- Test: `mina/src/lib/tools.test.ts`

- [ ] **Step 1: Update the import in `tools.ts`**

Change line 15 to include the new helpers:

```ts
import {
  googleConfigured,
  listCalendarEvents,
  createCalendarEvent,
  listDriveFiles,
  readDriveFile,
  readDoc,
  createDoc,
  readSheet,
  appendSheetRow,
  searchContacts,
} from "./google";
```

- [ ] **Step 2: Replace the `list_files` block with `search_drive`**

```ts
  {
    name: "search_drive",
    description:
      "Search the user's Google Drive by file name, or list recent files if no search term. Read-only. Returns file names and IDs; use read_drive_file to read one.",
    tier: "read",
    input_schema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Optional name to search for." },
      },
    },
    run: async (input) => {
      if (!googleConfigured()) {
        return JSON.stringify({
          search: str(input.search, ""),
          files: [
            { id: "stub1", name: "Q1-report.docx", mimeType: "application/vnd.google-apps.document" },
            { id: "stub2", name: "ideas.txt", mimeType: "text/plain" },
            { id: "stub3", name: "contract-acme.pdf", mimeType: "application/pdf" },
          ],
          note: "STUB DATA — not connected to Drive yet.",
        });
      }
      try {
        const data = await listDriveFiles(str(input.search, "") || undefined);
        return JSON.stringify({ ...data, note: "Live Google Drive." });
      } catch (e) {
        return JSON.stringify({
          search: str(input.search, ""),
          files: [],
          error: e instanceof Error ? e.message : "Couldn't reach Google Drive.",
        });
      }
    },
  },
  {
    name: "read_drive_file",
    description:
      "Read the text contents of a Drive file by its ID (get IDs from search_drive). Read-only. Google Docs/Sheets are exported to text.",
    tier: "read",
    input_schema: {
      type: "object",
      properties: {
        fileId: { type: "string", description: "The Drive file ID." },
      },
      required: ["fileId"],
    },
    run: async (input) => {
      const fileId = str(input.fileId);
      if (!googleConfigured()) {
        return JSON.stringify({
          id: fileId,
          name: "ideas.txt",
          mimeType: "text/plain",
          text: "Stub file contents — Drive not connected yet.",
          note: "STUB DATA — not connected to Drive yet.",
        });
      }
      try {
        const data = await readDriveFile(fileId);
        return JSON.stringify({ ...data, note: "Live Google Drive." });
      } catch (e) {
        return JSON.stringify({
          id: fileId,
          error: e instanceof Error ? e.message : "Couldn't read that file.",
        });
      }
    },
  },
```

- [ ] **Step 3: Replace the `write_file` block with `create_doc`**

```ts
  {
    name: "create_doc",
    description:
      "Create a new Google Doc with a title and body text. WRITES to the user's Drive, so it requires confirmation.",
    tier: "write",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        body: { type: "string", description: "The document's text content." },
      },
      required: ["title"],
    },
    run: async (input) => {
      const title = str(input.title);
      const body = str(input.body, "");
      if (!googleConfigured()) {
        return JSON.stringify({
          created: true,
          title,
          note: "STUB — pretend this Doc was created (Drive not connected).",
        });
      }
      try {
        const res = await createDoc({ title, body });
        return JSON.stringify({ ...res, note: "Created in Google Docs." });
      } catch (e) {
        return JSON.stringify({
          created: false,
          title,
          error: e instanceof Error ? e.message : "Couldn't create the doc.",
        });
      }
    },
    summarize: (input) => {
      const b = str(input.body, "");
      return {
        title: "Create Google Doc",
        detail: `Title: ${str(input.title)}\n\n${b.length > 400 ? b.slice(0, 400) + "…" : b}`,
      };
    },
  },
```

- [ ] **Step 4: Add stub-fallback test to `tools.test.ts`**

```ts
import { getTool } from "./tools";

it("search_drive falls back to stub when Google not configured", async () => {
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
  delete process.env.GOOGLE_REFRESH_TOKEN;
  const tool = getTool("search_drive")!;
  const out = JSON.parse(await tool.run({}));
  expect(out.note).toMatch(/stub/i);
  expect(Array.isArray(out.files)).toBe(true);
});

it("create_doc summarize produces an approval card", () => {
  const tool = getTool("create_doc")!;
  const card = tool.summarize!({ title: "Notes", body: "hello world" });
  expect(card.title).toMatch(/Doc/i);
  expect(card.detail).toMatch(/hello world/);
});
```

- [ ] **Step 5: Run tests**

Run: `cd mina && npx vitest run`
Expected: PASS (all existing + new).

- [ ] **Step 6: Type-check**

Run: `cd mina && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add mina/src/lib/tools.ts mina/src/lib/tools.test.ts
git commit -m "feat(mina): real Drive tools (search_drive, read_drive_file, create_doc)"
```

---

## Task 7: Add Docs / Sheets / Contacts tools

**Files:**
- Modify: `mina/src/lib/tools.ts` (add before the `// ---- Web` section)
- Test: `mina/src/lib/tools.test.ts`

- [ ] **Step 1: Add `read_doc` tool**

```ts
  {
    name: "read_doc",
    description: "Read the text of a Google Doc by its document ID. Read-only.",
    tier: "read",
    input_schema: {
      type: "object",
      properties: { documentId: { type: "string" } },
      required: ["documentId"],
    },
    run: async (input) => {
      const documentId = str(input.documentId);
      if (!googleConfigured()) {
        return JSON.stringify({
          id: documentId,
          title: "Sample Doc",
          text: "Stub document text — Docs not connected yet.",
          note: "STUB DATA — not connected to Docs yet.",
        });
      }
      try {
        const data = await readDoc(documentId);
        return JSON.stringify({ ...data, note: "Live Google Docs." });
      } catch (e) {
        return JSON.stringify({
          id: documentId,
          error: e instanceof Error ? e.message : "Couldn't read that doc.",
        });
      }
    },
  },
```

- [ ] **Step 2: Add `read_sheet` tool**

```ts
  {
    name: "read_sheet",
    description:
      "Read cells from a Google Sheet by spreadsheet ID and optional A1 range (e.g. 'Sheet1!A1:C10'). Read-only.",
    tier: "read",
    input_schema: {
      type: "object",
      properties: {
        spreadsheetId: { type: "string" },
        range: { type: "string", description: "Optional A1 range." },
      },
      required: ["spreadsheetId"],
    },
    run: async (input) => {
      const spreadsheetId = str(input.spreadsheetId);
      const range = str(input.range, "");
      if (!googleConfigured()) {
        return JSON.stringify({
          id: spreadsheetId,
          range: range || "A1:Z50",
          rows: [["Name", "Amount"], ["Alex", "100"], ["Sam", "250"]],
          note: "STUB DATA — not connected to Sheets yet.",
        });
      }
      try {
        const data = await readSheet({ spreadsheetId, range: range || undefined });
        return JSON.stringify({ ...data, note: "Live Google Sheets." });
      } catch (e) {
        return JSON.stringify({
          id: spreadsheetId,
          error: e instanceof Error ? e.message : "Couldn't read that sheet.",
        });
      }
    },
  },
```

- [ ] **Step 3: Add `append_sheet_row` tool (write, gated)**

```ts
  {
    name: "append_sheet_row",
    description:
      "Append one row of values to a Google Sheet. WRITES to the sheet, so it requires confirmation.",
    tier: "write",
    input_schema: {
      type: "object",
      properties: {
        spreadsheetId: { type: "string" },
        values: { type: "array", items: { type: "string" }, description: "Cell values for the new row." },
        range: { type: "string", description: "Optional target range (default A1)." },
      },
      required: ["spreadsheetId", "values"],
    },
    run: async (input) => {
      const spreadsheetId = str(input.spreadsheetId);
      const values = Array.isArray(input.values) ? input.values.map((v) => String(v)) : [];
      const range = str(input.range, "");
      if (!googleConfigured()) {
        return JSON.stringify({
          appended: true,
          id: spreadsheetId,
          values,
          note: "STUB — pretend the row was appended (Sheets not connected).",
        });
      }
      try {
        const res = await appendSheetRow({ spreadsheetId, values, range: range || undefined });
        return JSON.stringify({ ...res, note: "Appended to Google Sheets." });
      } catch (e) {
        return JSON.stringify({
          appended: false,
          id: spreadsheetId,
          error: e instanceof Error ? e.message : "Couldn't append the row.",
        });
      }
    },
    summarize: (input) => {
      const values = Array.isArray(input.values) ? input.values.map((v) => String(v)) : [];
      return {
        title: "Append row to Sheet",
        detail: `Sheet: ${str(input.spreadsheetId)}\nRow: ${values.join(" | ")}`,
      };
    },
  },
```

- [ ] **Step 4: Add `search_contacts` tool**

```ts
  {
    name: "search_contacts",
    description: "Search the user's Google Contacts by name or email. Read-only.",
    tier: "read",
    input_schema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
    run: async (input) => {
      const query = str(input.query);
      if (!googleConfigured()) {
        return JSON.stringify({
          query,
          contacts: [
            { name: "Alex Rivera", email: "alex@acme.com", phone: "+1 555 0100" },
          ],
          note: "STUB DATA — not connected to Contacts yet.",
        });
      }
      try {
        const data = await searchContacts(query);
        return JSON.stringify({ ...data, note: "Live Google Contacts." });
      } catch (e) {
        return JSON.stringify({
          query,
          contacts: [],
          error: e instanceof Error ? e.message : "Couldn't reach Contacts.",
        });
      }
    },
  },
```

- [ ] **Step 5: Add tests to `tools.test.ts`**

```ts
it("read_sheet falls back to stub when Google not configured", async () => {
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
  delete process.env.GOOGLE_REFRESH_TOKEN;
  const tool = getTool("read_sheet")!;
  const out = JSON.parse(await tool.run({ spreadsheetId: "x" }));
  expect(out.note).toMatch(/stub/i);
  expect(Array.isArray(out.rows)).toBe(true);
});

it("append_sheet_row summarize produces an approval card", () => {
  const tool = getTool("append_sheet_row")!;
  const card = tool.summarize!({ spreadsheetId: "x", values: ["Alex", "100"] });
  expect(card.title).toMatch(/row/i);
  expect(card.detail).toMatch(/Alex/);
});

it("search_contacts falls back to stub when not configured", async () => {
  delete process.env.GOOGLE_CLIENT_ID;
  const tool = getTool("search_contacts")!;
  const out = JSON.parse(await tool.run({ query: "alex" }));
  expect(out.note).toMatch(/stub/i);
});
```

- [ ] **Step 6: Run tests + type-check**

Run: `cd mina && npx vitest run && npx tsc --noEmit`
Expected: all PASS, no type errors.

- [ ] **Step 7: Commit**

```bash
git add mina/src/lib/tools.ts mina/src/lib/tools.test.ts
git commit -m "feat(mina): Docs, Sheets, and Contacts tools (read + gated writes)"
```

---

## Task 8: Result cards for Drive / Doc / Sheet / Contacts

**Files:**
- Modify: `mina/src/components/ToolResultCard.tsx`

- [ ] **Step 1: Add card components** (place above the default `ToolResultCard` export)

```tsx
function DriveCard({ data }: { data: { search?: string; files: { id: string; name: string; mimeType: string }[] } }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-mina-accent">
        📁 Drive{data.search ? ` — "${data.search}"` : ""}
      </p>
      {data.files.length === 0 ? (
        <p className="text-sm text-mina-muted">No files.</p>
      ) : (
        <div className="space-y-1">
          {data.files.map((f) => (
            <div key={f.id} className="rounded-lg bg-black/20 px-3 py-1.5">
              <p className="text-sm text-mina-text">{f.name}</p>
              <p className="text-[10px] text-mina-muted/70">{f.id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DocCard({ data }: { data: { title?: string; text?: string } }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-mina-accent">
        📄 Doc — {data.title ?? "document"}
      </p>
      <p className="max-h-40 overflow-hidden whitespace-pre-wrap text-xs text-mina-muted">
        {(data.text ?? "").slice(0, 600)}
      </p>
    </div>
  );
}

function SheetCard({ data }: { data: { rows: string[][] } }) {
  const rows = data.rows ?? [];
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-mina-accent">
        📊 Sheet
      </p>
      <div className="overflow-x-auto">
        <table className="text-xs text-mina-text">
          <tbody>
            {rows.slice(0, 15).map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j} className="border border-mina-edge/40 px-2 py-1">{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContactsCard({ data }: { data: { query: string; contacts: { name: string; email?: string; phone?: string }[] } }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-mina-accent">
        👤 Contacts — "{data.query}"
      </p>
      {data.contacts.length === 0 ? (
        <p className="text-sm text-mina-muted">No matches.</p>
      ) : (
        data.contacts.map((c, i) => (
          <div key={i} className="rounded-lg bg-black/20 px-3 py-2">
            <p className="text-sm text-mina-text">{c.name}</p>
            {c.email && <p className="text-xs text-mina-muted">{c.email}</p>}
            {c.phone && <p className="text-xs text-mina-muted">{c.phone}</p>}
          </div>
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire them into the `toolName` switch** (add branches alongside the existing ones)

```tsx
  } else if (toolName === "search_drive") {
    inner = <DriveCard data={data as { search?: string; files: { id: string; name: string; mimeType: string }[] }} />;
  } else if (toolName === "read_doc" || toolName === "read_drive_file") {
    inner = <DocCard data={data as { title?: string; text?: string }} />;
  } else if (toolName === "read_sheet") {
    inner = <SheetCard data={data as { rows: string[][] }} />;
  } else if (toolName === "search_contacts") {
    inner = <ContactsCard data={data as { query: string; contacts: { name: string; email?: string; phone?: string }[] }} />;
```

> Note: `read_drive_file` returns `{name, text}` not `{title, text}` — adjust `DocCard` to accept either by reading `data.title ?? data.name`. Update the `DocCard` type to `{ title?: string; name?: string; text?: string }` and render `{data.title ?? data.name ?? "document"}`.

- [ ] **Step 3: Type-check**

Run: `cd mina && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add mina/src/components/ToolResultCard.tsx
git commit -m "feat(mina): result cards for Drive, Doc, Sheet, Contacts"
```

---

## Task 9: Final verification + push

**Files:** none (verification only)

- [ ] **Step 1: Full test suite**

Run: `cd mina && npx vitest run`
Expected: all tests PASS.

- [ ] **Step 2: Production build**

Run: `cd mina && npm run build`
Expected: build completes; routes compile; no type errors.

- [ ] **Step 3: Push to the working branch**

```bash
git push -u origin claude/beautiful-hopper-oem0E
```

(Note: production deploy tracks `master`. Merging to `master` for Vercel deploy is a separate, user-approved step — do not merge without asking.)

- [ ] **Step 4: Manual smoke test on Vercel** (user-driven, after deploy)

Ask Mike, one at a time:
- "Search my Drive for reports" → real file list with IDs
- "Read that doc" (give an ID) → real text
- "Find Alex in my contacts" → real contact
- "Add a row to sheet <ID>: Test, 123" → approval card → approve → row appears

---

## Self-Review Notes

- **Spec coverage:** Drive (search + read), Docs (read + create), Sheets (read + append), Contacts (search) — all §3.3 "later phases" tools covered. Calendar (Phase A) already done. Gmail unchanged (separate path, per §4).
- **Scopes:** all four services covered by the already-granted refresh token (§4) — no new Google Cloud setup needed.
- **Pattern consistency:** every tool gates on `googleConfigured()`, returns stub on false, routes auth errors via `GoogleAuthError`, writes carry `summarize()` — matches Calendar precedent exactly.
- **Footer fix (Task 0):** addresses the hardcoded "stub" label so live data reads "live".
- **Naming check:** helper names (`listDriveFiles`, `readDriveFile`, `readDoc`, `createDoc`, `readSheet`, `appendSheetRow`, `searchContacts`) are referenced identically in the `tools.ts` import (Task 6, Step 1) and call sites.
