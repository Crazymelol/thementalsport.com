"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, Plus, Trash2, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { getApiUrl } from "@/lib/api-url";

// Must match the training vocabulary in training/dataset_loader.py (minus "none").
const ACTIONS = [
  "attack", "parry", "riposte", "lunge", "fleche",
  "advance", "retreat", "en_garde", "touch", "halt",
];
const FENCERS = ["left", "right", "unknown"];
const FPS = 2; // frames extracted per second

type Label = {
  frame_range: [number, number];
  action: string;
  confidence: number;
  description: string;
  fencer: string;
};

type VideoData = {
  id: string;
  url: string;
  frames: number;
  reviewed: boolean;
  labels: Label[];
  frame_urls: string[];
};

export default function CorrectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<VideoData | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [frame, setFrame] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get<VideoData>(`${getApiUrl()}/api/dataset/videos/${id}`)
      .then(({ data }) => {
        setData(data);
        setLabels(data.labels.map(normalize));
      })
      .catch((e) => setError(e.response?.data?.detail || "Could not load video."));
  }, [id]);

  const step = useCallback(
    (delta: number) => {
      if (!data) return;
      setFrame((f) => Math.max(0, Math.min(data.frames - 1, f + delta)));
    },
    [data]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  function updateLabel(i: number, patch: Partial<Label>) {
    setLabels((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function addLabel() {
    setLabels((ls) => [
      ...ls,
      { frame_range: [frame, frame], action: "attack", confidence: 1.0, description: "", fencer: "unknown" },
    ]);
  }

  function deleteLabel(i: number) {
    setLabels((ls) => ls.filter((_, idx) => idx !== i));
  }

  async function save() {
    setSaving(true);
    setSavedMsg("");
    setError("");
    try {
      await axios.put(`${getApiUrl()}/api/dataset/videos/${id}/labels`, {
        labels: labels,
        reviewed: true,
      });
      setSavedMsg("Saved & marked reviewed.");
    } catch (e: any) {
      setError(e.response?.data?.detail || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (error && !data) {
    return (
      <main className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/dataset" className="text-blue-400 hover:underline">← Back to dataset</Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const frameUrl = `${API}${data.frame_urls[frame]}`;
  const activeLabels = labels
    .map((l, i) => ({ l, i }))
    .filter(({ l }) => frame >= l.frame_range[0] && frame <= l.frame_range[1]);

  return (
    <main className="min-h-screen px-4 py-8 max-w-5xl mx-auto">
      <Link href="/dataset" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to dataset
      </Link>

      <h1 className="text-2xl font-bold mb-1">Correct Labels</h1>
      <p className="text-gray-500 text-sm mb-6 truncate">{data.url}</p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Frame viewer */}
        <div>
          <div className="bg-black border border-gray-700 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={frameUrl} alt={`frame ${frame}`} className="max-h-full max-w-full" />
          </div>

          {/* Scrubber */}
          <div className="flex items-center gap-3 mt-3">
            <button onClick={() => step(-1)} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="range"
              min={0}
              max={data.frames - 1}
              value={frame}
              onChange={(e) => setFrame(Number(e.target.value))}
              className="flex-1 accent-blue-500"
            />
            <button onClick={() => step(1)} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center text-sm text-gray-400 mt-2">
            Frame {frame} / {data.frames - 1} · {(frame / FPS).toFixed(1)}s
            <span className="text-gray-600 ml-2 text-xs">(← → to step)</span>
          </div>

          {/* Active labels at this frame */}
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Active at this frame</div>
            {activeLabels.length === 0 ? (
              <p className="text-gray-600 text-sm">No labels here.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {activeLabels.map(({ l, i }) => (
                  <span key={i} className="bg-blue-900/40 border border-blue-700 text-blue-300 text-xs px-2 py-1 rounded-full">
                    {l.action} ({l.fencer})
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Label editor */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Labels ({labels.length})</h2>
            <button
              onClick={addLabel}
              className="inline-flex items-center gap-1 text-sm bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg"
            >
              <Plus className="w-4 h-4" /> Add at frame {frame}
            </button>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {labels.map((l, i) => (
              <div key={i} className="bg-gray-900 border border-gray-700 rounded-xl p-3 space-y-2">
                <div className="flex gap-2">
                  <select
                    value={l.action}
                    onChange={(e) => updateLabel(i, { action: e.target.value })}
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-sm"
                  >
                    {ACTIONS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                  <select
                    value={l.fencer}
                    onChange={(e) => updateLabel(i, { fencer: e.target.value })}
                    className="bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-sm"
                  >
                    {FENCERS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => deleteLabel(i)}
                    className="p-1.5 text-red-400 hover:bg-red-900/30 rounded-lg"
                    title="Delete label"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 text-xs w-12">Frames</span>
                  <input
                    type="number"
                    min={0}
                    max={data.frames - 1}
                    value={l.frame_range[0]}
                    onChange={(e) => updateLabel(i, { frame_range: [Number(e.target.value), l.frame_range[1]] })}
                    className="w-16 bg-gray-800 border border-gray-600 rounded px-2 py-1"
                  />
                  <button
                    onClick={() => updateLabel(i, { frame_range: [frame, l.frame_range[1]] })}
                    className="text-xs text-blue-400 hover:underline"
                  >
                    set
                  </button>
                  <span className="text-gray-600">–</span>
                  <input
                    type="number"
                    min={0}
                    max={data.frames - 1}
                    value={l.frame_range[1]}
                    onChange={(e) => updateLabel(i, { frame_range: [l.frame_range[0], Number(e.target.value)] })}
                    className="w-16 bg-gray-800 border border-gray-600 rounded px-2 py-1"
                  />
                  <button
                    onClick={() => updateLabel(i, { frame_range: [l.frame_range[0], frame] })}
                    className="text-xs text-blue-400 hover:underline"
                  >
                    set
                  </button>
                  {l.confidence < 1 && (
                    <span className="ml-auto text-xs text-gray-500">conf {(l.confidence * 100).toFixed(0)}%</span>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="description (optional)"
                  value={l.description}
                  onChange={(e) => updateLabel(i, { description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-sm placeholder-gray-600"
                />
              </div>
            ))}
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 py-2.5 rounded-lg font-medium"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save & mark reviewed"}
          </button>
          {savedMsg && <p className="text-green-400 text-sm text-center mt-2">{savedMsg}</p>}
          {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}
        </div>
      </div>
    </main>
  );
}

function normalize(l: any): Label {
  return {
    frame_range: [l.frame_range?.[0] ?? 0, l.frame_range?.[1] ?? 0],
    action: l.action ?? "attack",
    confidence: l.confidence ?? 1.0,
    description: l.description ?? "",
    fencer: l.fencer ?? "unknown",
  };
}
