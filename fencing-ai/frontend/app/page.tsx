"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UploadCloud, PlayCircle, Swords, Database } from "lucide-react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const router = useRouter();
  const [tab, setTab] = useState<"upload" | "youtube">("upload");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submitFile(file: File) {
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await axios.post(`${API}/api/analyze/upload`, form);
      router.push(`/analysis/${data.job_id}`);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Upload failed. Is the backend running?");
      setLoading(false);
    }
  }

  async function submitYoutube() {
    if (!youtubeUrl.trim()) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post(`${API}/api/analyze/youtube`, { url: youtubeUrl });
      router.push(`/analysis/${data.job_id}`);
    } catch (e: any) {
      setError(e.response?.data?.detail || "YouTube analysis failed.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Header */}
      <div className="flex flex-col items-center mb-12 text-center">
        <div className="flex items-center gap-3 mb-4">
          <Swords className="w-10 h-10 text-blue-400" />
          <h1 className="text-4xl font-bold tracking-tight">Fencing AI</h1>
        </div>
        <p className="text-gray-400 max-w-md text-lg">
          Upload a fencing video or paste a YouTube link. Our AI will analyze technique,
          detect actions, track scoring, and provide performance insights.
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl p-8 shadow-2xl">
        {/* Tabs */}
        <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
          {(["upload", "youtube"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                tab === t
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {t === "upload" ? "Upload Video" : "YouTube URL"}
            </button>
          ))}
        </div>

        {tab === "upload" && (
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
              dragging
                ? "border-blue-400 bg-blue-900/20"
                : "border-gray-600 hover:border-gray-500"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) submitFile(file);
            }}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <UploadCloud className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-300 font-medium">Drop video here or click to browse</p>
            <p className="text-gray-500 text-sm mt-1">MP4, MOV, AVI — max 500 MB</p>
            <input
              id="file-input"
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) submitFile(f); }}
            />
          </div>
        )}

        {tab === "youtube" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex items-center flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 gap-2">
                <PlayCircle className="w-5 h-5 text-red-400 shrink-0" />
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitYoutube()}
                  className="flex-1 bg-transparent py-3 text-sm text-white placeholder-gray-500 outline-none"
                />
              </div>
            </div>
            <button
              onClick={submitYoutube}
              disabled={!youtubeUrl.trim() || loading}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Analyze Video
            </button>
          </div>
        )}

        {error && (
          <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
        )}

        {loading && (
          <div className="mt-4 text-center text-gray-400 text-sm animate-pulse">
            Submitting video for analysis…
          </div>
        )}
      </div>

      {/* Feature bullets */}
      <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl w-full text-center text-sm">
        {[
          { icon: "⚔️", label: "Action Detection" },
          { icon: "🏅", label: "Score Tracking" },
          { icon: "📐", label: "Technique Analysis" },
          { icon: "📊", label: "Performance Stats" },
        ].map(({ icon, label }) => (
          <div key={label} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-gray-300 font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* Live judging */}
      <Link
        href="/live"
        className="mt-8 px-6 py-3 bg-red-700 hover:bg-red-600 rounded-xl font-semibold inline-flex items-center gap-2 text-white"
      >
        <Swords className="w-5 h-5" /> Live Sabre Judge (camera)
      </Link>

      {/* Dataset / training link */}
      <Link
        href="/dataset"
        className="mt-3 text-sm text-gray-400 hover:text-white inline-flex items-center gap-2"
      >
        <Database className="w-4 h-4" /> Review training dataset →
      </Link>
    </main>
  );
}
