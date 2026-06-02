"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MinaOrb, { type MinaState } from "@/components/MinaOrb";
import ActionCard from "@/components/ActionCard";
import ToolResultCard from "@/components/ToolResultCard";
import { useVoice } from "@/hooks/useVoice";
import type {
  ActionProposal,
  ApiMessage,
  ContentBlock,
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

const textOf = (content: string | ContentBlock[]): string => {
  if (typeof content === "string") return content;
  return content
    .filter((b): b is Extract<ContentBlock, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
};

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

  const convoRef = useRef<ApiMessage[]>([]);
  const streamingRef = useRef("");
  const decisionsRef = useRef<Record<string, boolean>>({});
  const bubblesRef = useRef<Bubble[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const voice = useVoice();

  // Restore session from sessionStorage on first mount
  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      setBubbles(saved.bubbles);
      bubblesRef.current = saved.bubbles;
      convoRef.current = saved.messages;
    }
    setHydrated(true);
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
              convoRef.current.push({ role: "assistant", content: event.content });
              const t = textOf(event.content);
              if (t) {
                lastMinaText = t;
                addMessage("mina", t);
              }
              streamingRef.current = "";
              setStreaming("");
              // Persist after assistant message
              saveSession(bubblesRef.current, convoRef.current);
              break;
            }
            case "tool_result":
              convoRef.current.push({ role: "user", content: event.content });
              break;
            case "tool_card":
              addBubble({ id: newId(), kind: "tool_card", toolName: event.toolName, data: event.data });
              break;
            case "action_required":
              decisionsRef.current = {};
              setPending(event.actions);
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
          ? "✓ Approved — Mina is carrying it out…"
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

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-6">
      {/* Header */}
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-mina-text">Mina</h1>
          <p className="text-xs text-mina-muted">Voice-first AI agent · prototype</p>
        </div>
        <div className="flex items-center gap-2">
          {bubbles.length > 0 && (
            <button
              onClick={clearConversation}
              className="rounded-lg px-3 py-1.5 text-xs text-mina-muted hover:text-mina-text transition"
              title="Clear conversation"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setSpeakEnabled((v) => !v)}
            className="rounded-lg border border-mina-edge px-3 py-1.5 text-sm text-mina-muted hover:text-mina-text transition"
            title={speakEnabled ? "Mute Mina's voice" : "Unmute Mina's voice"}
          >
            {speakEnabled ? "🔊 Voice on" : "🔇 Voice off"}
          </button>
        </div>
      </header>

      {/* Orb */}
      <div className="my-6">
        <MinaOrb state={orbState} />
      </div>

      {/* Conversation */}
      <div
        ref={scrollRef}
        className="scroll-slim mb-4 flex-1 space-y-3 overflow-y-auto rounded-xl border border-mina-edge bg-mina-panel/50 p-4"
        style={{ minHeight: "300px", maxHeight: "calc(100vh - 340px)" }}
      >
        {isEmpty && (
          <div className="space-y-3 text-sm text-mina-muted">
            <p className="font-medium text-mina-text/70">Ask Mina anything. For example:</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                { q: "What's on my calendar today?", icon: "📅" },
                { q: "Draft a reply to Alex accepting the proposal.", icon: "✉️" },
                { q: "How much revenue did I make this month?", icon: "💳" },
                { q: "Refund Alex's last charge.", icon: "⚠️" },
              ].map(({ q, icon }) => (
                <button
                  key={q}
                  onClick={() => sendText(q)}
                  disabled={loading}
                  className="flex items-start gap-2 rounded-lg border border-mina-edge bg-mina-panel/60 px-3 py-2 text-left text-xs text-mina-muted hover:border-mina-accent/50 hover:text-mina-text transition disabled:opacity-40"
                >
                  <span className="shrink-0">{icon}</span>
                  <span>{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {bubbles.map((b) => {
          if (b.kind === "tool_card") {
            return <ToolResultCard key={b.id} toolName={b.toolName} data={b.data} />;
          }
          return <Message key={b.id} role={b.role} text={b.text} />;
        })}

        {/* Streaming text bubble */}
        {streaming && <Message role="mina" text={streaming} />}

        {/* Thinking indicator — shows when waiting for first token */}
        {loading && !streaming && pending.length === 0 && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-mina-edge bg-mina-panel px-4 py-3">
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
      <div className="flex items-center gap-2">
        <button
          onClick={micClick}
          disabled={!voice.sttSupported || loading}
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg transition",
            voice.listening
              ? "bg-mina-accent text-black shadow-[0_0_16px_-2px] shadow-mina-accent/70"
              : "border border-mina-edge text-mina-muted hover:border-mina-accent/50 hover:text-mina-text",
            !voice.sttSupported ? "opacity-40" : "",
          ].join(" ")}
          title={voice.sttSupported ? "Talk to Mina" : "Voice input not supported in this browser"}
        >
          🎤
        </button>
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
          placeholder={voice.listening ? "Listening…" : "Message Mina…"}
          disabled={loading}
          className="h-11 flex-1 rounded-full border border-mina-edge bg-mina-panel px-4 text-sm outline-none placeholder:text-mina-muted focus:border-mina-accent/70 disabled:opacity-50 transition"
        />
        <button
          onClick={() => sendText(input)}
          disabled={loading || !input.trim()}
          className="h-11 rounded-full bg-mina-accent px-5 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-40"
        >
          Send
        </button>
      </div>

      {!voice.sttSupported && (
        <p className="mt-2 text-center text-xs text-mina-muted">
          Voice input needs Chrome or Edge. You can still type to Mina.
        </p>
      )}
    </main>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-mina-accent/60 animate-pulse"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

function Message({ role, text }: { role: "user" | "mina" | "system"; text: string }) {
  if (role === "system") {
    return <p className="text-center text-xs text-mina-muted py-1">{text}</p>;
  }
  const isUser = role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={[
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-mina-accent text-black"
            : "border border-mina-edge bg-mina-panel text-mina-text",
        ].join(" ")}
      >
        {text}
      </div>
    </div>
  );
}
