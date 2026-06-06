"use client";

import { useEffect, useState, useCallback } from "react";
import type { AgentId } from "@/lib/types";
import type { Memory } from "@/lib/memory";
import type { PromptAddendum } from "@/lib/promptStore";
import type { Skill } from "@/lib/skills";

const AGENT_META: Record<AgentId, { label: string; code: string; color: string }> = {
  inbox:     { label: "INBOX",     code: "INB", color: "#00ff88" },
  calendar:  { label: "CALENDAR",  code: "CAL", color: "#00aaff" },
  workspace: { label: "WORKSPACE", code: "WRK", color: "#aa88ff" },
  finance:   { label: "FINANCE",   code: "FIN", color: "#ffaa00" },
  general:   { label: "GENERAL",   code: "GEN", color: "#00d4ff" },
};

const TARGET_LABEL: Record<string, string> = {
  global: "ALL", inbox: "INB", calendar: "CAL",
  workspace: "WRK", finance: "FIN", general: "GEN",
};

type Props = {
  agentId: AgentId | null;
  refreshKey: number;
  onClose?: () => void;
};

export default function Sidebar({ agentId, refreshKey, onClose }: Props) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [addenda, setAddenda] = useState<PromptAddendum[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  const fetchAll = useCallback(async () => {
    const [memRes, addRes, skillRes] = await Promise.all([
      fetch("/api/memory"),
      fetch("/api/addenda"),
      fetch("/api/skills"),
    ]);
    if (memRes.ok) {
      const d = (await memRes.json()) as { memories: Memory[] };
      setMemories(d.memories);
    }
    if (addRes.ok) {
      const d = (await addRes.json()) as { addenda: PromptAddendum[] };
      setAddenda(d.addenda);
    }
    if (skillRes.ok) {
      const d = (await skillRes.json()) as { skills: Skill[] };
      setSkills(d.skills);
    }
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll, refreshKey]);

  const deleteMemory = async (id: string) => {
    await fetch(`/api/memory/${id}`, { method: "DELETE" });
    setMemories((m) => m.filter((x) => x.id !== id));
  };

  const deleteSkill = async (id: string) => {
    await fetch(`/api/skills/${id}`, { method: "DELETE" });
    setSkills((s) => s.filter((x) => x.id !== id));
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
  const now = new Date();

  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-y-auto p-3 scroll-slim">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="hud-label">SYSTEM PANEL</p>
          <p className="text-[10px] text-mina-muted font-mono">{now.toLocaleTimeString()}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-mina-muted hover:text-mina-accent text-xs transition px-2 py-1 hud-panel rounded"
          >
            ✕
          </button>
        )}
      </div>

      {/* Active Agent */}
      <div className="relative hud-panel rounded-lg p-3 bracket-tl bracket-tr">
        <p className="hud-label mb-2">ACTIVE MODULE</p>
        {agent ? (
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded text-xs font-bold font-mono"
              style={{
                background: `rgba(0,0,0,0.6)`,
                border: `1px solid ${agent.color}`,
                color: agent.color,
                boxShadow: `0 0 12px ${agent.color}40`,
              }}
            >
              {agent.code}
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest" style={{ color: agent.color }}>
                {agent.label}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="h-1.5 w-1.5 rounded-full animate-pulse"
                  style={{ background: agent.color, boxShadow: `0 0 6px ${agent.color}` }}
                />
                <p className="hud-label">ONLINE</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded text-xs font-bold font-mono hud-panel text-mina-muted">
              ---
            </div>
            <div>
              <p className="text-xs tracking-widest text-mina-muted">NO MODULE</p>
              <p className="hud-label">STANDBY</p>
            </div>
          </div>
        )}
      </div>

      {/* System status bars */}
      <div className="hud-panel rounded-lg p-3">
        <p className="hud-label mb-2">SYSTEM STATUS</p>
        <div className="space-y-2">
          {[
            { label: "NEURAL NET", value: 94 },
            { label: "MEMORY BUS", value: memories.length > 0 ? Math.min(100, memories.length * 12 + 40) : 20 },
            { label: "VOICE I/O",  value: 78 },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="flex justify-between mb-0.5">
                <span className="hud-label">{label}</span>
                <span className="hud-label">{value}%</span>
              </div>
              <div className="h-1 rounded-full" style={{ background: "rgba(0,212,255,0.08)" }}>
                <div
                  className="h-1 rounded-full transition-all duration-1000"
                  style={{
                    width: `${value}%`,
                    background: "linear-gradient(90deg, rgba(0,100,200,0.8), rgba(0,212,255,0.9))",
                    boxShadow: "0 0 6px rgba(0,212,255,0.5)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Memory */}
      <div className="hud-panel rounded-lg p-3 flex-1 min-h-0">
        <div className="flex items-center justify-between mb-2">
          <p className="hud-label">MEMORY BANK</p>
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{
              background: "rgba(0,212,255,0.1)",
              color: "#00d4ff",
              border: "1px solid rgba(0,212,255,0.2)",
            }}
          >
            {memories.length} ENTRIES
          </span>
        </div>
        {memories.length === 0 ? (
          <p className="text-[10px] text-mina-muted font-mono italic">// NO DATA</p>
        ) : (
          <ul className="space-y-1.5 max-h-40 overflow-y-auto scroll-slim">
            {memories.map((m) => (
              <li
                key={m.id}
                className="group flex items-start gap-2 rounded p-2"
                style={{
                  background: "rgba(0,212,255,0.03)",
                  border: "1px solid rgba(0,212,255,0.08)",
                }}
              >
                <span className="hud-label mt-0.5 shrink-0">▶</span>
                <p className="flex-1 text-[10px] text-mina-text leading-relaxed font-mono">{m.text}</p>
                <button
                  onClick={() => void deleteMemory(m.id)}
                  className="shrink-0 text-[10px] text-mina-muted opacity-0 group-hover:opacity-100 hover:text-mina-danger transition"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Skills */}
      <div className="hud-panel rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="hud-label">SKILLS</p>
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{
              background: "rgba(0,212,255,0.1)",
              color: "#00d4ff",
              border: "1px solid rgba(0,212,255,0.2)",
            }}
          >
            {skills.length} LOADED
          </span>
        </div>
        {skills.length === 0 ? (
          <p className="text-[10px] text-mina-muted font-mono italic">// NO SKILLS</p>
        ) : (
          <ul className="space-y-1.5">
            {skills.map((s) => (
              <li
                key={s.id}
                className="group rounded p-2"
                style={{
                  background: "rgba(170,136,255,0.05)",
                  border: "1px solid rgba(170,136,255,0.15)",
                }}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold tracking-widest font-mono" style={{ color: "#aa88ff" }}>
                      {s.name.toUpperCase()}
                    </p>
                    <p className="text-[10px] text-mina-muted font-mono mt-0.5 line-clamp-1">{s.description}</p>
                  </div>
                  <button
                    onClick={() => void deleteSkill(s.id)}
                    className="shrink-0 text-[10px] text-mina-muted opacity-0 group-hover:opacity-100 hover:text-mina-danger transition"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Prompt Addenda */}
      <div className="hud-panel rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="hud-label">DIRECTIVES</p>
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{
              background: "rgba(0,212,255,0.1)",
              color: "#00d4ff",
              border: "1px solid rgba(0,212,255,0.2)",
            }}
          >
            {addenda.length} LOADED
          </span>
        </div>
        {addenda.length === 0 ? (
          <p className="text-[10px] text-mina-muted font-mono italic">// NO DIRECTIVES</p>
        ) : (
          <ul className="space-y-1.5">
            {addenda.map((a) => (
              <li
                key={a.id}
                className="group rounded p-2 transition"
                style={{
                  background: a.enabled ? "rgba(0,212,255,0.03)" : "rgba(0,0,0,0.2)",
                  border: `1px solid ${a.enabled ? "rgba(0,212,255,0.12)" : "rgba(0,212,255,0.04)"}`,
                  opacity: a.enabled ? 1 : 0.4,
                }}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-mina-text leading-relaxed font-mono line-clamp-2">{a.text}</p>
                    <p className="hud-label mt-0.5">{TARGET_LABEL[a.target] ?? a.target}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => void toggleAddendum(a.id, !a.enabled)}
                      className="text-[10px] font-mono transition"
                      style={{ color: a.enabled ? "#00d4ff" : "#4a7a99" }}
                    >
                      {a.enabled ? "ON" : "OFF"}
                    </button>
                    <button
                      onClick={() => void deleteAddendum(a.id)}
                      className="text-[10px] text-mina-muted opacity-0 group-hover:opacity-100 hover:text-mina-danger transition"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
