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
import { gmailConfigured, searchEmails, sendEmail } from "./gmail";
import { fetchPage } from "./web";
import { googleConfigured, listCalendarEvents, createCalendarEvent } from "./google";

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

  // ---- Stripe / finance ---------------------------------------------------
  {
    name: "get_revenue_summary",
    description: "Read a revenue / payments summary from Stripe. Read-only.",
    tier: "read",
    input_schema: {
      type: "object",
      properties: {
        period: { type: "string", description: "e.g. 'this month', 'last 7 days'." },
      },
      required: ["period"],
    },
    run: (input) =>
      JSON.stringify({
        period: str(input.period, "this month"),
        grossUSD: 8420.0,
        payments: 17,
        activeSubscribers: 42,
        failedPayments: 1,
        note: "STUB DATA — not connected to a real Stripe account yet.",
      }),
  },
  {
    name: "issue_refund",
    description:
      "Issue a refund for a charge. This moves real money and is hard to reverse, so it ALWAYS requires explicit user confirmation.",
    tier: "write",
    input_schema: {
      type: "object",
      properties: {
        customer: { type: "string" },
        amountUSD: { type: "number" },
        reason: { type: "string" },
      },
      required: ["customer", "amountUSD"],
    },
    run: (input) =>
      JSON.stringify({
        refunded: true,
        customer: str(input.customer),
        amountUSD: typeof input.amountUSD === "number" ? input.amountUSD : 0,
        note: "STUB — pretend this refund was issued.",
      }),
    summarize: (input) => ({
      title: "Issue refund",
      detail: `Refund $${typeof input.amountUSD === "number" ? input.amountUSD.toFixed(2) : "?"} to ${str(
        input.customer,
      )}${input.reason ? `\nReason: ${str(input.reason)}` : ""}`,
    }),
  },

  // ---- Files --------------------------------------------------------------
  {
    name: "list_files",
    description: "List files in one of the user's allowed folders. Read-only.",
    tier: "read",
    input_schema: {
      type: "object",
      properties: {
        folder: { type: "string", description: "e.g. 'Documents', 'Desktop'." },
      },
      required: ["folder"],
    },
    run: (input) =>
      JSON.stringify({
        folder: str(input.folder, "Documents"),
        files: ["Q1-report.md", "ideas.txt", "contract-acme.pdf"],
        note: "STUB DATA — not connected to a real filesystem yet.",
      }),
  },
  {
    name: "write_file",
    description:
      "Create or overwrite a file with new contents. This changes the user's files, so it requires confirmation.",
    tier: "write",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string" },
        contents: { type: "string" },
      },
      required: ["path", "contents"],
    },
    run: (input) =>
      JSON.stringify({
        written: true,
        path: str(input.path),
        bytes: str(input.contents).length,
        note: "STUB — pretend this file was written.",
      }),
    summarize: (input) => {
      const c = str(input.contents);
      return {
        title: "Write file",
        detail: `Path: ${str(input.path)}\n\n${c.length > 400 ? c.slice(0, 400) + "…" : c}`,
      };
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
