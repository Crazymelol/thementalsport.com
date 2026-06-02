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
type FileList = { folder: string; files: string[] };

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

function FilesCard({ data }: { data: FileList }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-mina-accent">
        📁 Files — {data.folder}
      </p>
      {data.files.length === 0 ? (
        <p className="text-sm text-mina-muted">Empty folder.</p>
      ) : (
        <div className="space-y-1">
          {data.files.map((f) => (
            <div key={f} className="flex items-center gap-2 rounded-lg bg-black/20 px-3 py-1.5">
              <span className="text-mina-muted text-xs">◦</span>
              <span className="text-sm text-mina-text">{f}</span>
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

  if (toolName === "get_calendar_events") {
    inner = <CalendarCard data={data as { date: string; events: CalendarEvent[] }} />;
  } else if (toolName === "search_emails") {
    inner = <EmailCard data={data as { query: string; results: Email[] }} />;
  } else if (toolName === "get_revenue_summary") {
    inner = <RevenueCard data={data as RevenueData} />;
  } else if (toolName === "list_files") {
    inner = <FilesCard data={data as FileList} />;
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

  return (
    <div className="rounded-xl border border-mina-edge/60 bg-mina-panel/80 p-3 text-sm">
      {inner}
      <p className="mt-2 text-right text-[10px] text-mina-muted/50">sample data · stub</p>
    </div>
  );
}
