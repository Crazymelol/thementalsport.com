"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MinaOrb, { type MinaState } from "@/components/MinaOrb";
import ActionCard from "@/components/ActionCard";
import { useVoice } from "@/hooks/useVoice";
import type {
  ActionProposal,
  ApiMessage,
  ContentBlock,
  ServerEvent,
} from "@/lib/types";

type Bubble = { id: string; role: "user" | "mina" | "system"; text: string };

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

export default function Home() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [streaming, setStreaming] = useState("");
  const [pending, setPending] = useState<ActionProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [speakEnabled, setSpeakEnabled] = useState(true);

  const convoRef = useRef<ApiMessage[]>([]);
  const streamingRef = useRef("");
  const decisionsRef = useRef<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const voice = useVoice();

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

  const addBubble = useCallback((role: Bubble["role"], text: string) => {
    if (!text.trim()) return;
    setBubbles((b) => [...b, { id: newId(), role, text }]);
  }, []);

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
                addBubble("mina", t);
              }
              streamingRef.current = "";
              setStreaming("");
              break;
            }
            case "tool_result":
              convoRef.current.push({ role: "user", content: event.content });
              break;
            case "action_required":
              decisionsRef.current = {};
              setPending(event.actions);
              break;
            case "error":
              addBubble("system", `⚠️ ${event.message}`);
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
        addBubble("system", `⚠️ ${err instanceof Error ? err.message : "Connection error."}`);
      } finally {
        streamingRef.current = "";
        setStreaming("");
        setLoading(false);
      }
    },
    [addBubble, speakEnabled, voice],
  );

  const sendText = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t || loading) return;
      voice.cancelSpeak();
      addBubble("user", t);
      convoRef.current.push({ role: "user", content: t });
      setInput("");
      void runChat();
    },
    [addBubble, loading, runChat, voice],
  );

  // Decide on a pending action; once all are decided, continue the turn.
  const decide = useCallback(
    (id: string, approved: boolean) => {
      decisionsRef.current[id] = approved;
      const allResolved = pending.every((a) => a.id in decisionsRef.current);
      if (!allResolved) {
        // Remove decided cards; keep waiting on the rest.
        setPending((p) => p.filter((a) => !(a.id in decisionsRef.current)));
        return;
      }
      const decisions = { ...decisionsRef.current };
      setPending([]);
      addBubble(
        "system",
        Object.values(decisions).some(Boolean)
          ? "✓ You approved an action. Mina is carrying it out…"
          : "✗ You cancelled. Mina will adjust.",
      );
      void runChat(decisions);
    },
    [addBubble, pending, runChat],
  );

  const micClick = () => {
    if (voice.listening) {
      voice.stop();
    } else {
      voice.start((finalText) => sendText(finalText));
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-6">
      {/* Header */}
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Mina</h1>
          <p className="text-xs text-mina-muted">Voice-first AI agent · prototype</p>
        </div>
        <button
          onClick={() => setSpeakEnabled((v) => !v)}
          className="rounded-lg border border-mina-edge px-3 py-1.5 text-sm text-mina-muted hover:text-mina-text"
          title={speakEnabled ? "Mute Mina's voice" : "Unmute Mina's voice"}
        >
          {speakEnabled ? "🔊 Voice on" : "🔇 Voice off"}
        </button>
      </header>

      {/* Orb */}
      <div className="my-6">
        <MinaOrb state={orbState} />
      </div>

      {/* Conversation */}
      <div
        ref={scrollRef}
        className="scroll-slim mb-4 flex-1 space-y-3 overflow-y-auto rounded-xl border border-mina-edge bg-mina-panel/50 p-4"
      >
        {bubbles.length === 0 && !streaming && (
          <div className="space-y-2 text-sm text-mina-muted">
            <p>Try asking:</p>
            <ul className="space-y-1">
              <li>“What's on my calendar today?”</li>
              <li>“Draft a reply to Alex accepting the proposal.”</li>
              <li>“How much revenue did I make this month?”</li>
              <li>“Refund Alex's last charge.” <span className="opacity-60">(watch the approval step)</span></li>
            </ul>
          </div>
        )}

        {bubbles.map((b) => (
          <Message key={b.id} role={b.role} text={b.text} />
        ))}
        {streaming && <Message role="mina" text={streaming} />}

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
              ? "bg-mina-accent text-black"
              : "border border-mina-edge text-mina-muted hover:text-mina-text",
            !voice.sttSupported ? "opacity-40" : "",
          ].join(" ")}
          title={voice.sttSupported ? "Talk to Mina" : "Voice input not supported in this browser"}
        >
          🎤
        </button>
        <input
          value={voice.listening && voice.interim ? voice.interim : input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendText(input);
          }}
          placeholder={voice.listening ? "Listening…" : "Message Mina…"}
          disabled={loading}
          className="h-11 flex-1 rounded-full border border-mina-edge bg-mina-panel px-4 text-sm outline-none placeholder:text-mina-muted focus:border-mina-accent disabled:opacity-50"
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

function Message({ role, text }: { role: Bubble["role"]; text: string }) {
  if (role === "system") {
    return <p className="text-center text-xs text-mina-muted">{text}</p>;
  }
  const isUser = role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={[
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm",
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
