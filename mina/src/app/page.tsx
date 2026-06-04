"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MinaOrb, { type MinaState } from "@/components/MinaOrb";
import ActionCard from "@/components/ActionCard";
import ToolResultCard from "@/components/ToolResultCard";
import Sidebar from "@/components/Sidebar";
import { useVoice } from "@/hooks/useVoice";
import type {
  ActionProposal,
  AgentId,
  ApiMessage,
  ServerEvent,
} from "@/lib/types";

type Bubble =
  | { id: string; kind: "message"; role: "user" | "mina" | "system"; text: string }
  | { id: string; kind: "tool_card"; toolName: string; data: unknown };

const STORAGE_KEY = "mina_session_v1";

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const textOf = (content: string | null): string => (content ?? "").trim();

function loadSession(): { bubbles: Bubble[]; messages: ApiMessage[] } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { bubbles: Bubble[]; messages: ApiMessage[] };
  } catch {
    return null;
  }
}

function saveSession(bubbles: Bubble[], messages: ApiMessage[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ bubbles, messages }));
  } catch {}
}

export default function Home() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [streaming, setStreaming] = useState("");
  const [pending, setPending] = useState<ActionProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [speakEnabled, setSpeakEnabled] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [agentId, setAgentId] = useState<AgentId | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tick, setTick] = useState(0);

  const convoRef = useRef<ApiMessage[]>([]);
  const streamingRef = useRef("");
  const decisionsRef = useRef<Record<string, boolean>>({});
  const bubblesRef = useRef<Bubble[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const voice = useVoice();

  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      setBubbles(saved.bubbles);
      bubblesRef.current = saved.bubbles;
      convoRef.current = saved.messages;
    }
    setHydrated(true);
  }, []);

  // Clock tick for HUD time display
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const orbState: MinaState = voice.listening
    ? "listening"
    : voice.speaking
      ? "speaking"
      : loading
        ? "thinking"
        : "idle";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [bubbles, streaming, pending]);

  const addBubble = useCallback((b: Bubble) => {
    setBubbles((prev) => {
      const next = [...prev, b];
      bubblesRef.current = next;
      saveSession(next, convoRef.current);
      return next;
    });
  }, []);

  const addMessage = useCallback(
    (role: "user" | "mina" | "system", text: string) => {
      if (!text.trim()) return;
      addBubble({ id: newId(), kind: "message", role, text });
    },
    [addBubble],
  );

  const clearConversation = useCallback(() => {
    setBubbles([]);
    bubblesRef.current = [];
    convoRef.current = [];
    setPending([]);
    setStreaming("");
    streamingRef.current = "";
    setAgentId(null);
    voice.cancelSpeak();
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, [voice]);

  const runChat = useCallback(
    async (decisions?: Record<string, boolean>) => {
      setLoading(true);
      streamingRef.current = "";
      setStreaming("");
      let lastMinaText = "";

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: convoRef.current, decisions }),
        });
        if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const handle = (event: ServerEvent) => {
          switch (event.type) {
            case "delta":
              streamingRef.current += event.text;
              setStreaming(streamingRef.current);
              break;
            case "assistant": {
              convoRef.current.push(event.message);
              const t = event.message.role === "assistant" ? textOf(event.message.content) : "";
              if (t) {
                lastMinaText = t;
                addMessage("mina", t);
              }
              streamingRef.current = "";
              setStreaming("");
              saveSession(bubblesRef.current, convoRef.current);
              break;
            }
            case "tool_result":
              for (const m of event.messages) convoRef.current.push(m);
              break;
            case "tool_card":
              addBubble({ id: newId(), kind: "tool_card", toolName: event.toolName, data: event.data });
              break;
            case "action_required":
              decisionsRef.current = {};
              setPending(event.actions);
              break;
            case "agent":
              setAgentId(event.agentId);
              break;
            case "error":
              addMessage("system", `⚠️ ${event.message}`);
              break;
            case "done":
              break;
          }
        };

        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";
          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data:")) continue;
            const json = line.slice(5).trim();
            if (json) handle(JSON.parse(json) as ServerEvent);
          }
        }

        if (lastMinaText && speakEnabled) voice.speak(lastMinaText);
      } catch (err) {
        addMessage("system", `⚠️ ${err instanceof Error ? err.message : "Connection error."}`);
      } finally {
        streamingRef.current = "";
        setStreaming("");
        setLoading(false);
        setRefreshKey((k) => k + 1);
      }
    },
    [addBubble, addMessage, speakEnabled, voice],
  );

  const sendText = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t || loading) return;
      voice.cancelSpeak();
      addMessage("user", t);
      convoRef.current.push({ role: "user", content: t });
      setInput("");
      inputRef.current?.focus();
      void runChat();
    },
    [addMessage, loading, runChat, voice],
  );

  const decide = useCallback(
    (id: string, approved: boolean) => {
      decisionsRef.current[id] = approved;
      const allResolved = pending.every((a) => a.id in decisionsRef.current);
      if (!allResolved) {
        setPending((p) => p.filter((a) => !(a.id in decisionsRef.current)));
        return;
      }
      const decisions = { ...decisionsRef.current };
      setPending([]);
      addMessage(
        "system",
        Object.values(decisions).some(Boolean)
          ? "✓ Approved — Mike is carrying it out…"
          : "✗ Cancelled.",
      );
      void runChat(decisions);
    },
    [addMessage, pending, runChat],
  );

  const micClick = () => {
    if (voice.listening) {
      voice.stop();
    } else {
      voice.start((finalText) => sendText(finalText));
    }
  };

  if (!hydrated) return null;

  const isEmpty = bubbles.length === 0 && !streaming;
  const now = new Date();
  void tick; // trigger re-render for clock

  return (
    <div
      className="relative flex h-screen overflow-hidden scan-grid"
      style={{ background: "#000308" }}
    >
      {/* Background ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,80,150,0.08) 0%, transparent 70%)",
        }}
      />

      {/* ── Left sidebar — desktop always visible, mobile overlay ── */}
      <>
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/70 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <aside
          className={[
            "z-30 flex flex-col transition-transform duration-200",
            "border-r",
            "lg:relative lg:w-72 lg:translate-x-0 lg:flex",
            sidebarOpen
              ? "fixed left-0 top-0 h-full w-72 translate-x-0"
              : "fixed left-0 top-0 h-full w-72 -translate-x-full lg:translate-x-0",
          ].join(" ")}
          style={{ borderColor: "rgba(0,212,255,0.1)", background: "rgba(1,5,12,0.95)" }}
        >
          <Sidebar
            agentId={agentId}
            refreshKey={refreshKey}
            onClose={() => setSidebarOpen(false)}
          />
        </aside>
      </>

      {/* ── Main area ── */}
      <main className="flex flex-1 flex-col min-w-0 overflow-hidden">

        {/* Top HUD bar */}
        <header
          className="flex items-center justify-between px-4 py-2 shrink-0"
          style={{ borderBottom: "1px solid rgba(0,212,255,0.1)", background: "rgba(0,5,12,0.8)" }}
        >
          {/* Left: menu + title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="lg:hidden text-mina-muted hover:text-mina-accent text-lg transition"
            >
              ☰
            </button>
            <div>
              <h1
                className="text-sm font-bold tracking-[0.3em] animate-flicker"
                style={{ color: "#00d4ff", textShadow: "0 0 10px rgba(0,212,255,0.5)" }}
              >
                M·I·K·E
              </h1>
              <p className="hud-label">JARVIS-CLASS AI SYSTEM · ONLINE</p>
            </div>
          </div>

          {/* Center: system time */}
          <div className="hidden sm:flex flex-col items-center">
            <p
              className="text-sm font-mono font-bold tracking-widest"
              style={{ color: "#00d4ff" }}
            >
              {now.toLocaleTimeString("en-GB")}
            </p>
            <p className="hud-label">{now.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase()}</p>
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-2">
            {bubbles.length > 0 && (
              <button
                onClick={clearConversation}
                className="hud-label hover:text-mina-danger transition px-2 py-1 rounded hud-panel"
                style={{ fontSize: "0.6rem" }}
              >
                CLEAR
              </button>
            )}
            <button
              onClick={() => setSpeakEnabled((v) => !v)}
              className="hud-panel rounded px-2 py-1 text-xs text-mina-muted hover:text-mina-accent transition"
            >
              {speakEnabled ? "🔊" : "🔇"}
            </button>

            {/* Status indicator */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded hud-panel">
              <span
                className="h-1.5 w-1.5 rounded-full animate-pulse"
                style={{
                  background: loading ? "#ffaa00" : "#00ff88",
                  boxShadow: loading ? "0 0 6px #ffaa00" : "0 0 6px #00ff88",
                }}
              />
              <span className="hud-label">{loading ? "PROC" : "RDY"}</span>
            </div>
          </div>
        </header>

        {/* Body: orb + chat */}
        <div className="flex flex-1 overflow-hidden">

          {/* Orb column (fixed width, center) */}
          <div
            className="hidden md:flex flex-col items-center justify-start pt-8 px-4 shrink-0"
            style={{ width: 260, borderRight: "1px solid rgba(0,212,255,0.06)" }}
          >
            <MinaOrb state={orbState} />

            {/* Quick actions */}
            <div className="mt-6 w-full space-y-1.5">
              <p className="hud-label mb-2 text-center">QUICK COMMANDS</p>
              {[
                { q: "What's on my calendar today?", code: "CAL" },
                { q: "Search my inbox for recent emails", code: "INB" },
                { q: "How much revenue this month?", code: "FIN" },
              ].map(({ q, code }) => (
                <button
                  key={q}
                  onClick={() => sendText(q)}
                  disabled={loading}
                  className="w-full flex items-center gap-2 rounded px-2 py-1.5 text-left transition disabled:opacity-30"
                  style={{
                    background: "rgba(0,212,255,0.03)",
                    border: "1px solid rgba(0,212,255,0.08)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(0,212,255,0.25)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(0,212,255,0.08)")}
                >
                  <span
                    className="shrink-0 text-[9px] font-bold font-mono px-1 py-0.5 rounded"
                    style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff" }}
                  >
                    {code}
                  </span>
                  <span className="text-[10px] font-mono text-mina-muted leading-tight">{q}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat feed */}
          <div className="flex flex-1 flex-col overflow-hidden">

            {/* Mobile orb strip */}
            <div
              className="md:hidden flex items-center gap-4 px-4 py-3 shrink-0"
              style={{ borderBottom: "1px solid rgba(0,212,255,0.06)" }}
            >
              <div className="scale-50 origin-left -my-8">
                <MinaOrb state={orbState} />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {[
                  { q: "What's on my calendar today?", label: "📅 Cal" },
                  { q: "Search my inbox for recent emails", label: "✉️ Inbox" },
                  { q: "How much revenue this month?", label: "💳 Rev" },
                ].map(({ q, label }) => (
                  <button
                    key={q}
                    onClick={() => sendText(q)}
                    disabled={loading}
                    className="shrink-0 text-[10px] px-2 py-1 rounded hud-panel text-mina-muted hover:text-mina-accent transition disabled:opacity-30"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message list */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-slim"
            >
              {isEmpty && (
                <div className="flex flex-col items-center justify-center h-full gap-6 text-center py-12">
                  <div>
                    <p
                      className="text-lg font-bold tracking-[0.5em] animate-flicker"
                      style={{ color: "#00d4ff", textShadow: "0 0 20px rgba(0,212,255,0.6)" }}
                    >
                      GOOD MORNING, SIR.
                    </p>
                    <p className="hud-label mt-2">ALL SYSTEMS OPERATIONAL · AWAITING COMMAND</p>
                  </div>
                  <div className="w-full max-w-md grid grid-cols-2 gap-2">
                    {[
                      { q: "What's on my calendar today?",      label: "📅  CALENDAR CHECK" },
                      { q: "Draft a reply to Alex accepting the proposal.", label: "✉️  DRAFT EMAIL" },
                      { q: "How much revenue did I make this month?",       label: "💳  REVENUE REPORT" },
                      { q: "Refund Alex's last charge.",                     label: "⚠️  ISSUE REFUND" },
                    ].map(({ q, label }) => (
                      <button
                        key={q}
                        onClick={() => sendText(q)}
                        disabled={loading}
                        className="rounded p-3 text-left transition disabled:opacity-30 relative overflow-hidden"
                        style={{
                          background: "rgba(0,212,255,0.03)",
                          border: "1px solid rgba(0,212,255,0.1)",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(0,212,255,0.3)")}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(0,212,255,0.1)")}
                      >
                        <p className="hud-label">{label}</p>
                        <p className="text-[10px] text-mina-muted font-mono mt-1 leading-tight">{q}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {bubbles.map((b) => {
                if (b.kind === "tool_card") {
                  return <ToolResultCard key={b.id} toolName={b.toolName} data={b.data} />;
                }
                return <HudMessage key={b.id} role={b.role} text={b.text} />;
              })}

              {streaming && <HudMessage role="mina" text={streaming} />}

              {loading && !streaming && pending.length === 0 && (
                <div className="flex justify-start">
                  <div
                    className="rounded px-4 py-3 flex items-center gap-2"
                    style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.12)" }}
                  >
                    <span className="hud-label">PROCESSING</span>
                    <ThinkingDots />
                  </div>
                </div>
              )}

              {pending.map((a) => (
                <ActionCard
                  key={a.id}
                  action={a}
                  disabled={loading}
                  onApprove={() => decide(a.id, true)}
                  onDeny={() => decide(a.id, false)}
                />
              ))}
            </div>

            {/* Composer */}
            <div
              className="px-4 py-3 shrink-0"
              style={{ borderTop: "1px solid rgba(0,212,255,0.1)", background: "rgba(0,5,12,0.8)" }}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={micClick}
                  disabled={!voice.sttSupported || loading}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-base transition"
                  style={
                    voice.listening
                      ? {
                          background: "rgba(0,255,100,0.15)",
                          border: "1px solid rgba(0,255,100,0.5)",
                          color: "#00ff88",
                          boxShadow: "0 0 16px rgba(0,255,100,0.3)",
                        }
                      : {
                          background: "rgba(0,212,255,0.05)",
                          border: "1px solid rgba(0,212,255,0.15)",
                          color: "#4a7a99",
                        }
                  }
                >
                  🎤
                </button>
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    value={voice.listening && voice.interim ? voice.interim : input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendText(input);
                      }
                    }}
                    placeholder={voice.listening ? "Listening…" : "Enter command…"}
                    disabled={loading}
                    className="w-full h-10 rounded px-4 text-sm font-mono outline-none transition disabled:opacity-50"
                    style={{
                      background: "rgba(0,212,255,0.04)",
                      border: "1px solid rgba(0,212,255,0.2)",
                      color: "#c8f0ff",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(0,212,255,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(0,212,255,0.2)")}
                  />
                </div>
                <button
                  onClick={() => sendText(input)}
                  disabled={loading || !input.trim()}
                  className="h-10 px-5 rounded text-xs font-bold tracking-widest transition"
                  style={{
                    background: "rgba(0,212,255,0.15)",
                    border: "1px solid rgba(0,212,255,0.3)",
                    color: "#00d4ff",
                  }}
                  onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.background = "rgba(0,212,255,0.25)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,212,255,0.15)")}
                >
                  SEND
                </button>
              </div>
              {!voice.sttSupported && (
                <p className="mt-1 text-center hud-label">VOICE INPUT: CHROME/EDGE REQUIRED</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1 w-1 rounded-full animate-pulse"
          style={{
            background: "#00d4ff",
            boxShadow: "0 0 4px #00d4ff",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

function HudMessage({ role, text }: { role: "user" | "mina" | "system"; text: string }) {
  if (role === "system") {
    return (
      <p className="text-center hud-label py-1 tracking-widest">
        {text}
      </p>
    );
  }

  const isUser = role === "user";

  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className="max-w-[85%] whitespace-pre-wrap rounded px-4 py-2.5 text-sm leading-relaxed font-mono"
        style={
          isUser
            ? {
                background: "rgba(0,212,255,0.1)",
                border: "1px solid rgba(0,212,255,0.25)",
                color: "#c8f0ff",
                boxShadow: "0 0 16px rgba(0,212,255,0.08)",
              }
            : {
                background: "rgba(0,20,40,0.6)",
                border: "1px solid rgba(0,212,255,0.12)",
                color: "#c8f0ff",
              }
        }
      >
        {!isUser && (
          <span
            className="text-[9px] font-bold tracking-widest block mb-1"
            style={{ color: "#00d4ff" }}
          >
            MIKE ▶
          </span>
        )}
        {text}
      </div>
    </div>
  );
}
