"use client";

import { useEffect, useRef, useState } from "react";
import { Server, CheckCircle2, XCircle, Loader2, X } from "lucide-react";
import { getApiUrl, setApiUrl, DEFAULT_API_URL } from "@/lib/api-url";

type Health = "idle" | "checking" | "ok" | "error";

export default function BackendSelector() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [current, setCurrent] = useState(DEFAULT_API_URL);
  const [health, setHealth] = useState<Health>("idle");
  const panelRef = useRef<HTMLDivElement>(null);

  // Read current value on mount (client-only)
  useEffect(() => {
    setCurrent(getApiUrl());
    setInput(getApiUrl());
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function checkHealth(url: string) {
    setHealth("checking");
    try {
      const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(4000) });
      setHealth(res.ok ? "ok" : "error");
    } catch {
      setHealth("error");
    }
  }

  function save() {
    const trimmed = input.trim().replace(/\/$/, "");
    if (!trimmed) return;
    setApiUrl(trimmed);
    setCurrent(trimmed);
    setHealth("idle");
    setOpen(false);
    window.location.reload();
  }

  function usePreset(url: string) {
    setInput(url);
    setHealth("idle");
  }

  const isLocalhost = current.includes("localhost") || current.includes("127.0.0.1");
  const displayHost = current.replace(/^https?:\/\//, "").split("/")[0];

  return (
    <div className="fixed bottom-4 right-4 z-50" ref={panelRef}>
      {/* Floating badge */}
      <button
        onClick={() => { setOpen((o) => !o); setHealth("idle"); }}
        className="flex items-center gap-1.5 bg-gray-800 border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white rounded-full px-3 py-1.5 text-xs shadow-lg transition-colors"
        title="Switch backend"
      >
        <Server className="w-3.5 h-3.5" />
        <span className="max-w-[140px] truncate">{displayHost}</span>
        <span className={`w-2 h-2 rounded-full shrink-0 ${isLocalhost ? "bg-yellow-400" : "bg-green-400"}`} />
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute bottom-10 right-0 w-80 bg-gray-900 border border-gray-600 rounded-2xl shadow-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-white">Backend URL</span>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Presets */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => usePreset("http://localhost:8000")}
              className="flex-1 text-xs py-1.5 rounded-lg border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white transition-colors"
            >
              Local PC
            </button>
            {DEFAULT_API_URL !== "http://localhost:8000" && (
              <button
                onClick={() => usePreset(DEFAULT_API_URL)}
                className="flex-1 text-xs py-1.5 rounded-lg border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white transition-colors truncate px-2"
              >
                Default
              </button>
            )}
          </div>

          {/* URL input */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); setHealth("idle"); }}
              onKeyDown={(e) => e.key === "Enter" && save()}
              placeholder="http://localhost:8000"
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500"
            />
            <button
              onClick={() => checkHealth(input.trim())}
              disabled={health === "checking"}
              className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-xs text-gray-300 hover:text-white transition-colors disabled:opacity-50"
              title="Test connection"
            >
              {health === "checking" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : health === "ok" ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : health === "error" ? (
                <XCircle className="w-4 h-4 text-red-400" />
              ) : (
                "Test"
              )}
            </button>
          </div>

          {health === "error" && (
            <p className="text-xs text-red-400 mb-3">
              Could not reach backend. Make sure it&apos;s running and the URL is correct.
            </p>
          )}
          {health === "ok" && (
            <p className="text-xs text-green-400 mb-3">Backend is reachable.</p>
          )}

          <button
            onClick={save}
            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white transition-colors"
          >
            Save &amp; reload
          </button>

          <p className="text-xs text-gray-500 mt-2 text-center">
            Stored in your browser — other users are not affected.
          </p>
        </div>
      )}
    </div>
  );
}
