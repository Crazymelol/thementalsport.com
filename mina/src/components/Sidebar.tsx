"use client";

import { useEffect, useState, useCallback } from "react";
import type { AgentId } from "@/lib/types";
import type { Memory } from "@/lib/memory";
import type { PromptAddendum } from "@/lib/promptStore";

const AGENT_META: Record<AgentId, { label: string; icon: string }> = {
  inbox:     { label: "Inbox",     icon: "✉️" },
  calendar:  { label: "Calendar",  icon: "📅" },
  workspace: { label: "Workspace", icon: "📁" },
  finance:   { label: "Finance",   icon: "💳" },
  general:   { label: "General",   icon: "🤖" },
};

const TARGET_LABEL: Record<string, string> = {
  global:    "All agents",
  inbox:     "Inbox",
  calendar:  "Calendar",
  workspace: "Workspace",
  finance:   "Finance",
  general:   "General",
};

type Props = {
  agentId: AgentId | null;
  refreshKey: number;
  onClose?: () => void;
};

export default function Sidebar({ agentId, refreshKey, onClose }: Props) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [addenda, setAddenda] = useState<PromptAddendum[]>([]);

  const fetchAll = useCallback(async () => {
    const [memRes, addRes] = await Promise.all([
      fetch("/api/memory"),
      fetch("/api/addenda"),
    ]);
    if (memRes.ok) {
      const d = (await memRes.json()) as { memories: Memory[] };
      setMemories(d.memories);
    }
    if (addRes.ok) {
      const d = (await addRes.json()) as { addenda: PromptAddendum[] };
      setAddenda(d.addenda);
    }
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll, refreshKey]);

  const deleteMemory = async (id: string) => {
    await fetch(`/api/memory/${id}`, { method: "DELETE" });
    setMemories((m) => m.filter((x) => x.id !== id));
  };

  const toggleAddendum = async (id: string, enabled: boolean) => {
    await fetch(`/api/addenda/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    setAddenda((a) => a.map((x) => (x.id === id ? { ...x, enabled } : x)));
  };

  const deleteAddendum = async (id: string) => {
    await fetch(`/api/addenda/${id}`, { method: "DELETE" });
    setAddenda((a) => a.filter((x) => x.id !== id));
  };

  const agent = agentId ? AGENT_META[agentId] : null;

  return (
    <aside className="flex h-full w-full flex-col gap-4 overflow-y-auto p-4 text-sm scroll-slim">
      {/* Close button — mobile only */}
      {onClose && (
        <div className="flex justify-end lg:hidden">
          <button
            onClick={onClose}
            className="rounded-lg border border-mina-edge px-2 py-1 text-xs text-mina-muted hover:text-mina-text transition"
          >
            ✕ Close
          </button>
        </div>
      )}

      {/* Agent panel */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-mina-muted">
          Active Agent
        </h2>
        <div className="flex items-center gap-3 rounded-xl border border-mina-edge bg-mina-panel px-4 py-3">
          {agent ? (
            <>
              <span className="text-xl">{agent.icon}</span>
              <div>
                <p className="font-medium text-mina-text">{agent.label}</p>
                <p className="text-xs text-mina-muted">Last specialist used</p>
              </div>
              <span className="ml-auto h-2 w-2 rounded-full bg-mina-accent" />
            </>
          ) : (
            <>
              <span className="text-xl opacity-40">🤖</span>
              <p className="text-mina-muted">Idle</p>
            </>
          )}
        </div>
      </section>

      {/* Memory panel */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-mina-muted">
          Memory ({memories.length})
        </h2>
        {memories.length === 0 ? (
          <p className="text-xs text-mina-muted px-1">No memories stored yet.</p>
        ) : (
          <ul className="space-y-1">
            {memories.map((m) => (
              <li
                key={m.id}
                className="group flex items-start gap-2 rounded-lg border border-mina-edge bg-mina-panel/60 px-3 py-2"
              >
                <p className="flex-1 text-xs text-mina-text leading-relaxed">{m.text}</p>
                <button
                  onClick={() => void deleteMemory(m.id)}
                  className="shrink-0 text-xs text-mina-muted opacity-0 group-hover:opacity-100 hover:text-mina-danger transition"
                  title="Forget this"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Prompt Addenda panel */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-mina-muted">
          Prompt Tweaks ({addenda.length})
        </h2>
        {addenda.length === 0 ? (
          <p className="text-xs text-mina-muted px-1">No prompt improvements yet.</p>
        ) : (
          <ul className="space-y-2">
            {addenda.map((a) => (
              <li
                key={a.id}
                className={[
                  "group rounded-xl border px-3 py-2.5 transition",
                  a.enabled
                    ? "border-mina-edge bg-mina-panel/60"
                    : "border-mina-edge/40 bg-mina-panel/20 opacity-50",
                ].join(" ")}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-mina-text leading-relaxed">{a.text}</p>
                    <p className="mt-1 text-xs text-mina-muted">
                      {TARGET_LABEL[a.target] ?? a.target}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => void toggleAddendum(a.id, !a.enabled)}
                      className={[
                        "rounded px-1.5 py-0.5 text-xs transition",
                        a.enabled
                          ? "text-mina-accent hover:text-mina-accent/70"
                          : "text-mina-muted hover:text-mina-text",
                      ].join(" ")}
                      title={a.enabled ? "Disable" : "Enable"}
                    >
                      {a.enabled ? "On" : "Off"}
                    </button>
                    <button
                      onClick={() => void deleteAddendum(a.id)}
                      className="text-xs text-mina-muted opacity-0 group-hover:opacity-100 hover:text-mina-danger transition"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
