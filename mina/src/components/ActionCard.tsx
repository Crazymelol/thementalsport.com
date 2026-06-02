"use client";

// The approval gate, made visible. When Mina wants to take a write action
// (send an email, issue a refund, create an event, write a file), she does not
// do it — she proposes it here and waits. This is the PRD's core safety
// promise: nothing irreversible happens without an explicit click.

import type { ActionProposal } from "@/lib/types";

export default function ActionCard({
  action,
  onApprove,
  onDeny,
  disabled,
}: {
  action: ActionProposal;
  onApprove: () => void;
  onDeny: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-xl border border-mina-warn/40 bg-mina-warn/5 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-block rounded-full bg-mina-warn/20 px-2 py-0.5 text-xs font-medium text-mina-warn">
          Needs your approval
        </span>
        <span className="text-sm font-semibold text-mina-text">{action.title}</span>
      </div>
      <pre className="mb-3 whitespace-pre-wrap break-words rounded-lg bg-black/30 p-3 text-sm text-mina-text/90">
        {action.detail}
      </pre>
      <div className="flex gap-2">
        <button
          onClick={onApprove}
          disabled={disabled}
          className="rounded-lg bg-mina-accent px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={onDeny}
          disabled={disabled}
          className="rounded-lg border border-mina-edge px-4 py-2 text-sm font-medium text-mina-muted transition hover:text-mina-text disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
