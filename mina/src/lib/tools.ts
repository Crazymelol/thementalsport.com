// Mina's tool router.
//
// This is the extensible seam where real integrations plug in. Today every
// tool is a STUB returning realistic mock data — nothing touches a real
// calendar, inbox, or Stripe account yet. What's real and load-bearing is the
// *structure*: each tool declares a safety TIER, and write-tier tools are
// never executed without explicit user approval (enforced in /api/chat).
//
// To wire a real integration later: keep the schema + tier, and replace the
// `run()` body with a real API call. The rest of the system is unchanged.

import type { Tier } from "./types";
import { gmailConfigured, searchEmails, sendEmail, trashEmails } from "./gmail";
import { fetchPage } from "./web";
import { memoryConfigured, addMemory, searchMemories, deleteMemory } from "./memory";
import { stripeConfigured, getRevenueSummary, listRecentPayments, issueRefund } from "./stripe";
import {
  addAddendum,
  removeAddendum,
  setEnabled,
  listAddenda,
  isValidTarget,
  type AddendumTarget,
} from "./promptStore";
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

export type ToolDef = {
  name: string;
  description: string;
  tier: Tier;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  /** Executor. Returns a string Mina reads as the tool result. May be async. */
  run: (input: Record<string, unknown>) => string | Promise<string>;
  /** Builds the human-facing title + detail for a write-tier approval card. */
  summarize?: (input: Record<string, unknown>) => { title: string; detail: string };
};

const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);

export const TOOLS: ToolDef[] = [
  // ---- Calendar -----------------------------------------------------------
  {
    name: "get_calendar_events",
    description:
      "Read upcoming events from the user's calendar for a given day or range. Use this to answer questions about the schedule.",
    tier: "read",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Natural-language day, e.g. 'today', 'tomorrow', 'Friday'." },
      },
      required: ["date"],
    },
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
  },
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

  // ---- Email --------------------------------------------------------------
  {
    name: "search_emails",
    description:
      "Search the user's inbox and return matching message summaries. Read-only.",
    tier: "read",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to search for." },
      },
      required: ["query"],
    },
    run: async (input) => {
      const query = str(input.query);
      if (!gmailConfigured()) {
        return JSON.stringify({
          query,
          results: [
            { from: "Alex <alex@acme.com>", subject: "Re: Proposal", snippet: "Looks great — let's lock the Friday call.", unread: true },
            { from: "Stripe", subject: "Payment received", snippet: "$500.00 from Acme Corp.", unread: false },
          ],
          note: "STUB DATA — not a real inbox yet.",
        });
      }
      try {
        const results = await searchEmails(query);
        return JSON.stringify({
          query,
          results,
          note: results.length ? "Live Gmail results." : "No matching emails found.",
        });
      } catch (e) {
        return JSON.stringify({
          query,
          results: [],
          error: `Couldn't reach Gmail: ${e instanceof Error ? e.message : "unknown error"}`,
        });
      }
    },
  },
  {
    name: "send_email",
    description:
      "Send an email on the user's behalf. This is irreversible once sent, so it ALWAYS requires explicit user confirmation. Draft the full body before calling.",
    tier: "write",
    input_schema: {
      type: "object",
      properties: {
        to: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" },
      },
      required: ["to", "subject", "body"],
    },
    run: async (input) => {
      const to = str(input.to);
      const subject = str(input.subject);
      const body = str(input.body);
      if (!gmailConfigured()) {
        return JSON.stringify({
          sent: true,
          to,
          subject,
          note: "STUB — pretend this email was sent (Gmail not connected).",
        });
      }
      try {
        await sendEmail(to, subject, body);
        return JSON.stringify({ sent: true, to, subject, note: "Email sent via Gmail." });
      } catch (e) {
        return JSON.stringify({
          sent: false,
          to,
          subject,
          error: `Failed to send: ${e instanceof Error ? e.message : "unknown error"}`,
        });
      }
    },
    summarize: (input) => ({
      title: "Send email",
      detail: `To: ${str(input.to)}\nSubject: ${str(input.subject)}\n\n${str(input.body)}`,
    }),
  },

  {
    name: "trash_emails",
    description:
      "Move all inbox emails matching a query (e.g. a sender name like 'eurobank') to Gmail Trash. Destructive but recoverable (Gmail keeps trashed mail ~30 days). ALWAYS requires explicit user confirmation. Only use when the user clearly asks to delete/remove/clear emails.",
    tier: "write",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to match — usually a sender, e.g. 'eurobank'." },
      },
      required: ["query"],
    },
    run: async (input) => {
      const query = str(input.query);
      if (!query) return JSON.stringify({ trashed: 0, error: "No query provided." });
      if (!gmailConfigured()) {
        return JSON.stringify({
          trashed: 3,
          query,
          note: "STUB — pretend these were trashed (Gmail not connected).",
        });
      }
      try {
        const res = await trashEmails(query);
        return JSON.stringify({
          ...res,
          note: res.trashed
            ? `Moved ${res.trashed} email(s) to Trash.`
            : "No matching emails found.",
        });
      } catch (e) {
        return JSON.stringify({
          trashed: 0,
          query,
          error: `Couldn't trash emails: ${e instanceof Error ? e.message : "unknown error"}`,
        });
      }
    },
    summarize: (input) => ({
      title: "Move emails to Trash",
      detail: `Trash all inbox emails matching “${str(input.query)}”.\n\nThis is recoverable — Gmail keeps trashed mail for ~30 days.`,
    }),
  },

  // ---- Stripe / finance ---------------------------------------------------
  {
    name: "get_revenue_summary",
    description:
      "Read a revenue / payments summary from Stripe for a period (gross revenue net of refunds, payment count, active subscribers, failed payments). Read-only.",
    tier: "read",
    input_schema: {
      type: "object",
      properties: {
        period: { type: "string", description: "e.g. 'this month', 'last 7 days', 'today', 'this year'." },
      },
      required: ["period"],
    },
    run: async (input) => {
      const period = str(input.period, "this month");
      if (!stripeConfigured()) {
        return JSON.stringify({
          period,
          grossUSD: 8420.0,
          payments: 17,
          activeSubscribers: 42,
          failedPayments: 1,
          note: "STUB DATA — not connected to a real Stripe account yet.",
        });
      }
      try {
        const summary = await getRevenueSummary(period);
        return JSON.stringify({ ...summary, note: "Live Stripe." });
      } catch (e) {
        return JSON.stringify({
          period,
          error: e instanceof Error ? e.message : "Couldn't reach Stripe.",
        });
      }
    },
  },
  {
    name: "list_recent_payments",
    description:
      "List recent Stripe charges (id, amount, status, customer, date). Read-only. Use this to find the charge id needed before issuing a refund.",
    tier: "read",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "How many recent charges to return (default 10, max 100)." },
      },
    },
    run: async (input) => {
      const limit = typeof input.limit === "number" ? input.limit : 10;
      if (!stripeConfigured()) {
        return JSON.stringify({
          payments: [
            { id: "ch_STUB1", amountUSD: 149.0, refundedUSD: 0, status: "succeeded", customer: "alex@example.com", created: "2026-06-02", description: "Pro plan" },
            { id: "ch_STUB2", amountUSD: 49.0, refundedUSD: 0, status: "succeeded", customer: "sam@example.com", created: "2026-06-01", description: "Starter plan" },
          ],
          note: "STUB DATA — not connected to a real Stripe account yet.",
        });
      }
      try {
        const payments = await listRecentPayments(limit);
        return JSON.stringify({ payments, note: "Live Stripe." });
      } catch (e) {
        return JSON.stringify({ payments: [], error: e instanceof Error ? e.message : "Couldn't reach Stripe." });
      }
    },
  },
  {
    name: "issue_refund",
    description:
      "Issue a refund against a Stripe charge id (get ids from list_recent_payments). Optionally partial via amountUSD; omit to refund the full charge. This moves real money and is hard to reverse, so it ALWAYS requires explicit user confirmation.",
    tier: "write",
    input_schema: {
      type: "object",
      properties: {
        chargeId: { type: "string", description: "The Stripe charge id, e.g. 'ch_...'." },
        amountUSD: { type: "number", description: "Optional partial amount; omit for a full refund." },
        reason: {
          type: "string",
          description: "Optional: 'duplicate', 'fraudulent', or 'requested_by_customer'.",
        },
      },
      required: ["chargeId"],
    },
    run: async (input) => {
      const chargeId = str(input.chargeId);
      const amountUSD = typeof input.amountUSD === "number" ? input.amountUSD : undefined;
      const reason = str(input.reason) || undefined;
      if (!chargeId) return JSON.stringify({ refunded: false, error: "No charge id provided." });
      if (!stripeConfigured()) {
        return JSON.stringify({
          refunded: true,
          chargeId,
          amountUSD: amountUSD ?? 0,
          note: "STUB — pretend this refund was issued (Stripe not connected).",
        });
      }
      try {
        const res = await issueRefund({ chargeId, amountUSD, reason });
        return JSON.stringify({ ...res, note: res.refunded ? "Refund issued." : "Refund not completed." });
      } catch (e) {
        return JSON.stringify({ refunded: false, chargeId, error: e instanceof Error ? e.message : "Refund failed." });
      }
    },
    summarize: (input) => {
      const amt = typeof input.amountUSD === "number" ? `$${input.amountUSD.toFixed(2)}` : "full amount";
      return {
        title: "Issue refund",
        detail: `Refund ${amt} on charge ${str(input.chargeId)}${input.reason ? `\nReason: ${str(input.reason)}` : ""}`,
      };
    },
  },

  // ---- Drive --------------------------------------------------------------
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

  // ---- Docs ---------------------------------------------------------------
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

  // ---- Sheets -------------------------------------------------------------
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

  // ---- Contacts -----------------------------------------------------------
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

  // ---- Memory -------------------------------------------------------------
  {
    name: "remember",
    description:
      "Save a durable fact or preference about the principal (their business, people, habits, how they like things done) to long-term memory. Runs immediately and is always shown to the user. Do NOT store passwords, API keys, or tokens.",
    tier: "read",
    input_schema: {
      type: "object",
      properties: {
        text: { type: "string", description: "The fact to remember, phrased concisely." },
      },
      required: ["text"],
    },
    run: async (input) => {
      const text = str(input.text);
      if (!text) return JSON.stringify({ remembered: false, error: "Nothing to remember." });
      if (!memoryConfigured()) {
        return JSON.stringify({
          remembered: true,
          text,
          note: "STUB — memory store not set up yet (add Upstash Redis on Vercel).",
        });
      }
      const mem = await addMemory(text);
      return JSON.stringify({ remembered: true, id: mem.id, text: mem.text, note: "Saved to memory." });
    },
  },
  {
    name: "recall",
    description:
      "Search the principal's long-term memory for a fact or preference. Read-only. Use before claiming you don't know something about them.",
    tier: "read",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to look up." },
      },
      required: ["query"],
    },
    run: async (input) => {
      const query = str(input.query);
      if (!memoryConfigured()) {
        return JSON.stringify({
          query,
          memories: [],
          note: "STUB — memory store not set up yet (add Upstash Redis on Vercel).",
        });
      }
      const matches = await searchMemories(query);
      return JSON.stringify({
        query,
        memories: matches.map((m) => ({ id: m.id, text: m.text })),
        note: "Live memory.",
      });
    },
  },
  {
    name: "forget",
    description:
      "Delete a remembered fact by its id (get ids from recall). WRITES to memory (destructive), so it requires confirmation.",
    tier: "write",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "The memory id to delete." },
      },
      required: ["id"],
    },
    run: async (input) => {
      const id = str(input.id);
      if (!memoryConfigured()) {
        return JSON.stringify({
          deleted: true,
          id,
          note: "STUB — memory store not set up yet.",
        });
      }
      const res = await deleteMemory(id);
      return JSON.stringify({ ...res, id, note: res.deleted ? "Removed from memory." : "No such memory." });
    },
    summarize: (input) => ({
      title: "Forget a memory",
      detail: `Delete memory id: ${str(input.id)}`,
    }),
  },

  // ---- Self-improvement ---------------------------------------------------
  {
    name: "propose_prompt_improvement",
    description:
      "Propose an addition to your OWN instructions to permanently improve how you work (e.g. a recurring preference or correction the user gave you). WRITES to your persistent instructions, so it requires user approval. Additive only — you cannot edit or remove existing rules. `target` is 'global' or one specialist id: inbox, calendar, workspace, finance, general.",
    tier: "write",
    input_schema: {
      type: "object",
      properties: {
        target: { type: "string", description: "'global' or a specialist id." },
        text: { type: "string", description: "The guidance to append, phrased as an instruction." },
        rationale: { type: "string", description: "Why this helps — shown on the approval card." },
      },
      required: ["target", "text", "rationale"],
    },
    run: async (input) => {
      const rawTarget = str(input.target, "global");
      const target: AddendumTarget = isValidTarget(rawTarget) ? rawTarget : "global";
      const text = str(input.text);
      const rationale = str(input.rationale);
      if (!text) return JSON.stringify({ added: false, error: "Nothing to add." });
      const res = await addAddendum(target, text, rationale);
      return JSON.stringify(
        res.added
          ? { added: true, id: res.addendum?.id, target, text, note: "Added to your instructions." }
          : { added: false, error: res.error },
      );
    },
    summarize: (input) => ({
      title: `Teach myself (${str(input.target, "global")})`,
      detail: `${str(input.text)}\n\nWhy: ${str(input.rationale)}`,
    }),
  },
  {
    name: "revert_prompt_improvement",
    description:
      "Permanently delete one of your learned instruction addenda by id (get ids from list_prompt_improvements). WRITES, so it requires user approval.",
    tier: "write",
    input_schema: {
      type: "object",
      properties: { id: { type: "string", description: "The addendum id to delete." } },
      required: ["id"],
    },
    run: async (input) => {
      const id = str(input.id);
      const res = await removeAddendum(id);
      return JSON.stringify({ ...res, id, note: res.removed ? "Reverted." : "No such addendum." });
    },
    summarize: (input) => ({
      title: "Revert a learned instruction",
      detail: `Delete addendum id: ${str(input.id)}`,
    }),
  },
  {
    name: "toggle_prompt_improvement",
    description:
      "Enable or disable a learned instruction addendum by id without deleting it. WRITES, so it requires user approval.",
    tier: "write",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "The addendum id." },
        enabled: { type: "boolean", description: "true to enable, false to disable." },
      },
      required: ["id", "enabled"],
    },
    run: async (input) => {
      const id = str(input.id);
      const enabled = input.enabled !== false;
      const res = await setEnabled(id, enabled);
      return JSON.stringify({ ok: res.ok, id, enabled, note: res.ok ? "Updated." : "No such addendum." });
    },
    summarize: (input) => ({
      title: `${input.enabled !== false ? "Enable" : "Disable"} a learned instruction`,
      detail: `Addendum id: ${str(input.id)}`,
    }),
  },
  {
    name: "list_prompt_improvements",
    description:
      "List all your learned instruction addenda (id, target, text, rationale, enabled). Read-only. Use when the user asks what you've learned or taught yourself.",
    tier: "read",
    input_schema: { type: "object", properties: {} },
    run: async () => {
      const all = await listAddenda();
      return JSON.stringify({
        improvements: all.map((a) => ({
          id: a.id,
          target: a.target,
          text: a.text,
          rationale: a.rationale,
          enabled: a.enabled,
        })),
      });
    },
  },

  // ---- Web ----------------------------------------------------------------
  {
    name: "browse_url",
    description:
      "Fetch a web page and read its text content. Use this to look something up online, read an article, or check a public page. Read-only — it cannot click, log in, or fill forms.",
    tier: "read",
    input_schema: {
      type: "object",
      properties: {
        url: { type: "string", description: "The page URL, e.g. 'https://example.com/article'." },
      },
      required: ["url"],
    },
    run: async (input) => {
      const url = str(input.url);
      if (!url) return JSON.stringify({ error: "No URL provided." });
      try {
        const page = await fetchPage(url);
        return JSON.stringify({
          url: page.url,
          title: page.title,
          text: page.text,
          truncated: page.truncated,
        });
      } catch (e) {
        return JSON.stringify({
          url,
          error: `Couldn't read that page: ${e instanceof Error ? e.message : "unknown error"}`,
        });
      }
    },
  },
];

const BY_NAME = new Map(TOOLS.map((t) => [t.name, t]));

export const getTool = (name: string): ToolDef | undefined => BY_NAME.get(name);

/** Tool definitions in the shape the OpenAI / Groq chat API expects. */
export const toolDefsForApi = () =>
  TOOLS.map(({ name, description, input_schema }) => ({
    type: "function" as const,
    function: { name, description, parameters: input_schema },
  }));

export const isWrite = (name: string): boolean => getTool(name)?.tier === "write";
