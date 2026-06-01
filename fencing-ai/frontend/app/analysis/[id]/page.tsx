"use client";

import { useEffect, useState, use } from "react";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, Clock, Target, TrendingUp, MessageSquare } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Job = {
  job_id: string;
  status: string;
  progress: number;
  error?: string;
  filename?: string;
  url?: string;
  result?: AnalysisResult;
};

type AnalysisResult = {
  total_frames: number;
  duration_seconds: number;
  actions: Action[];
  technique_notes: TechniqueNote[];
  scoring_events: ScoringEvent[];
  score: { left: number; right: number };
  performance_stats: PerformanceStats;
  overall_assessment: string;
};

type Action = {
  frame_range: [number, number];
  action: string;
  confidence: number;
  description: string;
  fencer: string;
};

type TechniqueNote = {
  observation: string;
  severity: "excellent" | "good" | "needs_work" | "critical";
  fencer: string;
};

type ScoringEvent = {
  frame: number;
  touch_by: string;
  target_area: string;
  confidence: number;
};

type PerformanceStats = {
  pose_detected_pct: number;
  knee_angle: { mean?: number; min?: number; max?: number };
  sword_arm_angle: { mean?: number; min?: number; max?: number };
  stance_width_pct: { mean?: number; min?: number; max?: number };
};

const STATUS_LABELS: Record<string, string> = {
  queued: "Queued…",
  downloading: "Downloading video…",
  processing: "Extracting frames…",
  estimating_poses: "Estimating poses…",
  ai_analysis: "AI analyzing…",
  complete: "Complete",
  error: "Error",
};

const SEVERITY_COLORS: Record<string, string> = {
  excellent: "text-green-400 bg-green-900/30 border-green-700",
  good: "text-blue-400 bg-blue-900/30 border-blue-700",
  needs_work: "text-yellow-400 bg-yellow-900/30 border-yellow-700",
  critical: "text-red-400 bg-red-900/30 border-red-700",
};

const ACTION_COLORS: Record<string, string> = {
  attack: "bg-red-600",
  lunge: "bg-orange-500",
  fleche: "bg-orange-600",
  parry: "bg-blue-600",
  riposte: "bg-cyan-600",
  advance: "bg-gray-600",
  retreat: "bg-gray-700",
  en_garde: "bg-gray-500",
  touch: "bg-green-600",
  halt: "bg-purple-600",
};

export default function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    async function poll() {
      try {
        const { data } = await axios.get<Job>(`${API}/api/jobs/${id}`);
        setJob(data);
        if (data.status === "complete" || data.status === "error") {
          clearInterval(interval);
        }
      } catch (e) {
        console.error(e);
      }
    }

    poll();
    interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [id]);

  if (!job) {
    return <LoadingScreen message="Loading…" />;
  }

  if (job.status !== "complete") {
    return (
      <LoadingScreen
        message={STATUS_LABELS[job.status] || job.status}
        progress={job.progress}
        error={job.error}
      />
    );
  }

  const r = job.result!;

  return (
    <main className="min-h-screen px-4 py-10 max-w-5xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Analysis Results</h1>
        <p className="text-gray-400 text-sm">
          {job.filename || job.url} — {r.duration_seconds}s · {r.total_frames} frames
        </p>
      </div>

      {/* Score */}
      <ScoreCard score={r.score} />

      {/* Overall assessment */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-2 text-blue-400 font-medium">
          <MessageSquare className="w-4 h-4" /> Coach Summary
        </div>
        <p className="text-gray-200 leading-relaxed">{r.overall_assessment}</p>
      </div>

      {/* Performance stats */}
      <StatsGrid stats={r.performance_stats} />

      {/* Actions timeline */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-orange-400" /> Action Timeline
        </h2>
        {r.actions.length === 0 ? (
          <p className="text-gray-500">No actions detected.</p>
        ) : (
          <div className="space-y-2">
            {r.actions.map((a, i) => (
              <ActionRow key={i} action={a} fps={2} />
            ))}
          </div>
        )}
      </section>

      {/* Technique notes */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-400" /> Technique Feedback
        </h2>
        {r.technique_notes.length === 0 ? (
          <p className="text-gray-500">No technique notes.</p>
        ) : (
          <div className="space-y-2">
            {r.technique_notes.map((n, i) => (
              <div
                key={i}
                className={`border rounded-xl px-4 py-3 text-sm ${SEVERITY_COLORS[n.severity] || "border-gray-700 bg-gray-800"}`}
              >
                <span className="font-semibold capitalize mr-2">[{n.severity}]</span>
                {n.observation}
                {n.fencer !== "both" && (
                  <span className="ml-2 text-xs opacity-70">({n.fencer} fencer)</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Scoring events */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-green-400" /> Scoring Events
        </h2>
        {r.scoring_events.length === 0 ? (
          <p className="text-gray-500">No scoring touches detected.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2 pr-6">Time</th>
                  <th className="text-left py-2 pr-6">Touch By</th>
                  <th className="text-left py-2 pr-6">Target Area</th>
                  <th className="text-left py-2">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {r.scoring_events.map((e, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    <td className="py-2 pr-6 text-gray-300">{(e.frame / 2).toFixed(1)}s</td>
                    <td className="py-2 pr-6 capitalize font-medium">{e.touch_by}</td>
                    <td className={`py-2 pr-6 capitalize ${e.target_area === "valid" ? "text-green-400" : "text-yellow-400"}`}>
                      {e.target_area}
                    </td>
                    <td className="py-2 text-gray-400">{(e.confidence * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function LoadingScreen({ message, progress, error }: { message: string; progress?: number; error?: string }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      {error ? (
        <div className="text-center">
          <p className="text-red-400 text-lg font-medium mb-4">{error}</p>
          <Link href="/" className="text-blue-400 hover:underline">← Try again</Link>
        </div>
      ) : (
        <div className="text-center w-full max-w-sm">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-gray-300 font-medium mb-4">{message}</p>
          {progress !== undefined && (
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function ScoreCard({ score }: { score: { left: number; right: number } }) {
  const total = score.left + score.right;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-6 flex items-center justify-center gap-8">
      <div className="text-center">
        <div className="text-5xl font-bold text-blue-400">{score.left}</div>
        <div className="text-gray-400 text-sm mt-1">Left Fencer</div>
      </div>
      <div className="text-2xl font-light text-gray-600">—</div>
      <div className="text-center">
        <div className="text-5xl font-bold text-red-400">{score.right}</div>
        <div className="text-gray-400 text-sm mt-1">Right Fencer</div>
      </div>
      {total > 0 && (
        <div className="ml-4 text-gray-500 text-sm">{total} touch{total !== 1 ? "es" : ""}</div>
      )}
    </div>
  );
}

function StatsGrid({ stats }: { stats: PerformanceStats }) {
  const items = [
    { label: "Pose Detection", value: `${stats.pose_detected_pct}%`, sub: "frames with pose" },
    { label: "Knee Angle (avg)", value: stats.knee_angle?.mean ? `${stats.knee_angle.mean}°` : "—", sub: "lunge depth indicator" },
    { label: "Sword Arm (avg)", value: stats.sword_arm_angle?.mean ? `${stats.sword_arm_angle.mean}°` : "—", sub: "arm extension" },
    { label: "Stance Width", value: stats.stance_width_pct?.mean ? `${stats.stance_width_pct.mean}%` : "—", sub: "relative to frame width" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {items.map(({ label, value, sub }) => (
        <div key={label} className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white mb-1">{value}</div>
          <div className="text-gray-300 text-xs font-medium">{label}</div>
          <div className="text-gray-500 text-xs mt-0.5">{sub}</div>
        </div>
      ))}
    </div>
  );
}

function ActionRow({ action, fps }: { action: Action; fps: number }) {
  const startTime = (action.frame_range[0] / fps).toFixed(1);
  const endTime = (action.frame_range[1] / fps).toFixed(1);
  const color = ACTION_COLORS[action.action] || "bg-gray-600";

  return (
    <div className="flex items-start gap-3 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm">
      <span className={`${color} text-white text-xs px-2 py-0.5 rounded-full font-medium capitalize shrink-0 mt-0.5`}>
        {action.action.replace(/_/g, " ")}
      </span>
      <div className="flex-1 text-gray-300">{action.description}</div>
      <div className="text-gray-500 text-xs shrink-0 text-right">
        <div>{startTime}s – {endTime}s</div>
        <div className="capitalize">{action.fencer}</div>
      </div>
    </div>
  );
}
