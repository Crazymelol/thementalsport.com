"use client";

import type { JSX } from "react";

// Renders a pretty card in the conversation for each read-tool result Mina runs.
// The data shapes come from tools.ts run() stubs — keep in sync if stubs change.

type CalendarEvent = { time: string; title: string; durationMin?: number };
type Email = { from: string; subject: string; snippet: string; unread?: boolean };
type RevenueData = {
  period: string;
  grossUSD: number;
  payments: number;
  activeSubscribers: number;
  failedPayments?: number;
};

function CalendarCard({ data }: { data: { date: string; events: CalendarEvent[] } }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-mina-accent">
        📅 Calendar — {data.date}
      </p>
      {data.events.length === 0 ? (
        <p className="text-sm text-mina-muted">Nothing scheduled.</p>
      ) : (
        data.events.map((ev, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg bg-black/20 px-3 py-2">
            <span className="mt-0.5 min-w-[44px] font-mono text-xs text-mina-accent">{ev.time}</span>
            <div>
              <p className="text-sm text-mina-text">{ev.title}</p>
              {ev.durationMin && (
                <p className="text-xs text-mina-muted">{ev.durationMin} min</p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function EmailCard({ data }: { data: { query: string; results: Email[] } }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-mina-accent">
        ✉️ Email — "{data.query}"
      </p>
      {data.results.length === 0 ? (
        <p className="text-sm text-mina-muted">No results.</p>
      ) : (
        data.results.map((m, i) => (
          <div key={i} className="rounded-lg bg-black/20 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-mina-text">{m.from}</span>
              {m.unread && (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-mina-accent" />
              )}
            </div>
            <p className="text-sm font-medium text-mina-text">{m.subject}</p>
            <p className="mt-0.5 text-xs text-mina-muted line-clamp-2">{m.snippet}</p>
          </div>
        ))
      )}
    </div>
  );
}

function RevenueCard({ data }: { data: RevenueData }) {
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-mina-accent">
        💳 Revenue — {data.period}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Gross", value: fmt(data.grossUSD) },
          { label: "Payments", value: String(data.payments) },
          { label: "Subscribers", value: String(data.activeSubscribers) },
          { label: "Failed", value: String(data.failedPayments ?? 0) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg bg-black/20 px-3 py-2">
            <p className="text-xs text-mina-muted">{label}</p>
            <p className="text-lg font-semibold text-mina-text">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function WebCard({ data }: { data: { url: string; title?: string; text?: string; error?: string } }) {
  let host = data.url;
  try {
    host = new URL(data.url).host;
  } catch {}
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-mina-accent">
        🌐 Web — {host}
      </p>
      {data.error ? (
        <p className="text-sm text-mina-danger">{data.error}</p>
      ) : (
        <div className="rounded-lg bg-black/20 px-3 py-2">
          {data.title && <p className="text-sm font-medium text-mina-text">{data.title}</p>}
          {data.text && (
            <p className="mt-1 max-h-32 overflow-hidden text-xs text-mina-muted">{data.text.slice(0, 400)}…</p>
          )}
        </div>
      )}
    </div>
  );
}

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

function DocCard({ data }: { data: { title?: string; name?: string; text?: string } }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-mina-accent">
        📄 Doc — {data.title ?? data.name ?? "document"}
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

function RememberCard({ data }: { data: { text?: string } }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-mina-accent">
        🧠 Remembered
      </p>
      <p className="rounded-lg bg-black/20 px-3 py-2 text-sm text-mina-text">{data.text}</p>
    </div>
  );
}

function RecallCard({ data }: { data: { query: string; memories: { id: string; text: string }[] } }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-mina-accent">
        🧠 Memory — "{data.query}"
      </p>
      {data.memories.length === 0 ? (
        <p className="text-sm text-mina-muted">Nothing on that yet.</p>
      ) : (
        <div className="space-y-1">
          {data.memories.map((m) => (
            <div key={m.id} className="rounded-lg bg-black/20 px-3 py-1.5">
              <p className="text-sm text-mina-text">{m.text}</p>
              <p className="text-[10px] text-mina-muted/70">{m.id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ToolResultCard({
  toolName,
  data,
}: {
  toolName: string;
  data: unknown;
}) {
  let inner: JSX.Element;

  if (toolName === "browse_url") {
    inner = <WebCard data={data as { url: string; title?: string; text?: string; error?: string }} />;
  } else if (toolName === "get_calendar_events") {
    inner = <CalendarCard data={data as { date: string; events: CalendarEvent[] }} />;
  } else if (toolName === "search_emails") {
    inner = <EmailCard data={data as { query: string; results: Email[] }} />;
  } else if (toolName === "get_revenue_summary") {
    inner = <RevenueCard data={data as RevenueData} />;
  } else if (toolName === "search_drive") {
    inner = <DriveCard data={data as { search?: string; files: { id: string; name: string; mimeType: string }[] }} />;
  } else if (toolName === "read_doc" || toolName === "read_drive_file") {
    inner = <DocCard data={data as { title?: string; name?: string; text?: string }} />;
  } else if (toolName === "read_sheet") {
    inner = <SheetCard data={data as { rows: string[][] }} />;
  } else if (toolName === "search_contacts") {
    inner = <ContactsCard data={data as { query: string; contacts: { name: string; email?: string; phone?: string }[] }} />;
  } else if (toolName === "remember") {
    inner = <RememberCard data={data as { text?: string }} />;
  } else if (toolName === "recall") {
    inner = <RecallCard data={data as { query: string; memories: { id: string; text: string }[] }} />;
  } else {
    inner = (
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-mina-accent">
          🔧 {toolName}
        </p>
        <pre className="whitespace-pre-wrap text-xs text-mina-muted">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  }

  const note =
    data && typeof data === "object" && "note" in data
      ? String((data as { note?: unknown }).note ?? "")
      : "";
  const isStub = /stub/i.test(note);

  return (
    <div className="rounded-xl border border-mina-edge/60 bg-mina-panel/80 p-3 text-sm">
      {inner}
      <p className="mt-2 text-right text-[10px] text-mina-muted/50">
        {isStub ? "sample data · stub" : "live"}
      </p>
    </div>
  );
}
