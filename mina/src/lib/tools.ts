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

export type ToolDef = {
  name: string;
  description: string;
  tier: Tier;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  /** Stub executor. Returns a string Mina reads as the tool result. */
  run: (input: Record<string, unknown>) => string;
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
    run: (input) =>
      JSON.stringify({
        date: str(input.date, "today"),
        events: [
          { time: "09:00", title: "Standup", durationMin: 15 },
          { time: "11:00", title: "Deep work block", durationMin: 90 },
          { time: "15:00", title: "Call with Alex (Acme Corp)", durationMin: 45 },
        ],
        note: "STUB DATA — not a real calendar yet.",
      }),
  },
  {
    name: "create_calendar_event",
    description:
      "Create a new calendar event. This WRITES to the calendar, so it requires user confirmation.",
    tier: "write",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        date: { type: "string", description: "e.g. 'Friday'" },
        time: { type: "string", description: "e.g. '3pm'" },
        durationMin: { type: "number" },
      },
      required: ["title", "date", "time"],
    },
    run: (input) =>
      JSON.stringify({
        created: true,
        event: {
          title: str(input.title),
          date: str(input.date),
          time: str(input.time),
          durationMin: typeof input.durationMin === "number" ? input.durationMin : 30,
        },
        note: "STUB — pretend this was added to the calendar.",
      }),
    summarize: (input) => ({
      title: "Create calendar event",
      detail: `“${str(input.title)}” on ${str(input.date)} at ${str(input.time)}${
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
    run: (input) =>
      JSON.stringify({
        query: str(input.query),
        results: [
          { from: "Alex <alex@acme.com>", subject: "Re: Proposal", snippet: "Looks great — let's lock the Friday call.", unread: true },
          { from: "Stripe", subject: "Payment received", snippet: "$500.00 from Acme Corp.", unread: false },
        ],
        note: "STUB DATA — not a real inbox yet.",
      }),
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
    run: (input) =>
      JSON.stringify({
        sent: true,
        to: str(input.to),
        subject: str(input.subject),
        note: "STUB — pretend this email was sent.",
      }),
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
