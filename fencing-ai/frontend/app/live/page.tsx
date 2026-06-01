"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Swords } from "lucide-react";
import { judgeFrame, resetROW, type JudgingResult, type Action } from "@/lib/sabre-detector";

// MediaPipe CDN — model is cached by the browser after first load (offline-capable after that)
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

type Phase = "idle" | "loading" | "ready" | "running" | "paused";

const ACTION_COLORS: Record<Action, string> = {
  en_garde: "text-gray-400",
  advance:  "text-blue-400",
  retreat:  "text-gray-500",
  attack:   "text-orange-400",
  lunge:    "text-red-400",
  fleche:   "text-red-500",
  parry:    "text-cyan-400",
  riposte:  "text-yellow-400",
  touch:    "text-green-400",
};

const ACTION_LABELS: Record<Action, string> = {
  en_garde: "En Garde", advance: "Advance", retreat: "Retreat",
  attack: "Attack", lunge: "Lunge", fleche: "Flèche",
  parry: "Parry", riposte: "Riposte", touch: "TOUCH",
};

export default function LivePage() {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<any>(null);
  const animRef     = useRef<number>(0);
  const lastResult  = useRef<JudgingResult | null>(null);
  const touchCooldown = useRef(0);

  const [phase, setPhase]   = useState<Phase>("idle");
  const [error, setError]   = useState("");
  const [score, setScore]   = useState({ left: 0, right: 0 });
  const [result, setResult] = useState<JudgingResult | null>(null);
  const [lastTouch, setLastTouch] = useState("");
  const [flashSide, setFlashSide] = useState<"left" | "right" | null>(null);

  // ── Load MediaPipe ──────────────────────────────────────────────────────────
  const loadModel = useCallback(async () => {
    setPhase("loading");
    setError("");
    try {
      const { PoseLandmarker, FilesetResolver } =
        await import("@mediapipe/tasks-vision");

      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        numPoses: 2,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      landmarkerRef.current = landmarker;
      setPhase("ready");
    } catch (e: any) {
      setError("Failed to load pose model: " + e.message);
      setPhase("idle");
    }
  }, []);

  // ── Camera ──────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e: any) {
      setError("Camera access denied: " + e.message);
    }
  }, []);

  // ── Detection loop ──────────────────────────────────────────────────────────
  const drawLoop = useCallback(() => {
    const video   = videoRef.current;
    const canvas  = canvasRef.current;
    const lander  = landmarkerRef.current;
    if (!video || !canvas || !lander || video.readyState < 2) {
      animRef.current = requestAnimationFrame(drawLoop);
      return;
    }

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);

    const now = performance.now();
    const detected = lander.detectForVideo(video, now);
    const poses = detected.landmarks as { x: number; y: number; z: number; visibility: number }[][];

    if (poses.length >= 2) {
      // Sort by centre-x so poses[0] = left fencer, poses[1] = right fencer
      const sorted = [...poses].sort(
        (a, b) =>
          a.reduce((s, p) => s + p.x, 0) / a.length -
          b.reduce((s, p) => s + p.x, 0) / b.length
      );

      drawSkeleton(ctx, sorted[0], "#60a5fa", canvas.width, canvas.height);
      drawSkeleton(ctx, sorted[1], "#f87171", canvas.width, canvas.height);

      const jr = judgeFrame(sorted[0], sorted[1], now);
      lastResult.current = jr;
      setResult(jr);

      // Touch handling with 1s cooldown
      if (jr.touch && now > touchCooldown.current) {
        touchCooldown.current = now + 1000;
        setScore(s => ({
          ...s,
          [jr.touch!]: s[jr.touch!] + 1,
        }));
        setLastTouch(jr.touchReason);
        setFlashSide(jr.touch);
        playBeep();
        setTimeout(() => setFlashSide(null), 600);
      }
    } else if (poses.length === 1) {
      drawSkeleton(ctx, poses[0], "#a78bfa", canvas.width, canvas.height);
    }

    animRef.current = requestAnimationFrame(drawLoop);
  }, []);

  const startBout = useCallback(async () => {
    resetROW();
    setScore({ left: 0, right: 0 });
    setLastTouch("");
    await startCamera();
    setPhase("running");
    animRef.current = requestAnimationFrame(drawLoop);
  }, [startCamera, drawLoop]);

  const togglePause = useCallback(() => {
    setPhase(p => {
      if (p === "running") {
        cancelAnimationFrame(animRef.current);
        return "paused";
      }
      animRef.current = requestAnimationFrame(drawLoop);
      return "running";
    });
  }, [drawLoop]);

  const resetBout = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    resetROW();
    setScore({ left: 0, right: 0 });
    setResult(null);
    setLastTouch("");
    setPhase("ready");
  }, []);

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  // ── Render ──────────────────────────────────────────────────────────────────
  const lr = result?.left;
  const rr = result?.right;

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-800">
        <Link href="/" className="text-gray-500 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Swords className="w-5 h-5 text-blue-400" />
        <span className="font-bold text-white tracking-wide">SABRE LIVE JUDGE</span>
        <span className="ml-auto text-xs text-gray-500 uppercase tracking-widest">
          {phase === "running" ? "● LIVE" : phase.toUpperCase()}
        </span>
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-3 bg-gray-900 border-b border-gray-800">
        <ScorePanel
          side="left"
          label="LEFT"
          score={score.left}
          action={lr?.action}
          hasROW={lr?.hasROW}
          flash={flashSide === "left"}
          color="blue"
        />
        <div className="flex flex-col items-center justify-center py-3 gap-1">
          <span className="text-gray-600 text-xs uppercase tracking-widest">Sabre</span>
          <span className="text-2xl font-bold text-gray-300">
            {score.left} — {score.right}
          </span>
          {lastTouch && (
            <span className="text-xs text-gray-400 text-center px-2">{lastTouch}</span>
          )}
        </div>
        <ScorePanel
          side="right"
          label="RIGHT"
          score={score.right}
          action={rr?.action}
          hasROW={rr?.hasROW}
          flash={flashSide === "right"}
          color="red"
        />
      </div>

      {/* Camera view */}
      <div className="relative flex-1 bg-black">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-contain" playsInline muted />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain" />

        {/* Overlay flash on touch */}
        {flashSide && (
          <div
            className={`absolute inset-0 pointer-events-none transition-opacity duration-200 ${
              flashSide === "left" ? "bg-blue-500/30" : "bg-red-500/30"
            }`}
          />
        )}

        {/* Initial state overlay */}
        {(phase === "idle" || phase === "ready" || phase === "loading") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-gray-950/90">
            {phase === "loading" && (
              <>
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-300">Loading pose model…</p>
                <p className="text-gray-500 text-sm">First load requires internet (cached for offline use after)</p>
              </>
            )}
            {phase === "idle" && (
              <>
                <Swords className="w-16 h-16 text-blue-400" />
                <p className="text-gray-300 text-lg font-medium">Sabre Live Judge</p>
                <p className="text-gray-500 text-sm text-center max-w-xs">
                  Point the camera sideways at the piste. Both fencers must be visible.
                </p>
                <button
                  onClick={loadModel}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold"
                >
                  Load Model
                </button>
              </>
            )}
            {phase === "ready" && (
              <>
                <div className="text-green-400 text-5xl">✓</div>
                <p className="text-gray-300 font-medium">Model ready</p>
                <button
                  onClick={startBout}
                  className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-semibold"
                >
                  Start Bout
                </button>
              </>
            )}
            {error && <p className="text-red-400 text-sm text-center max-w-sm">{error}</p>}
          </div>
        )}
      </div>

      {/* Controls */}
      {(phase === "running" || phase === "paused") && (
        <div className="flex gap-3 px-4 py-3 bg-gray-900 border-t border-gray-800">
          <button
            onClick={togglePause}
            className="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 font-medium text-sm"
          >
            {phase === "running" ? "Pause" : "Resume"}
          </button>
          <button
            onClick={resetBout}
            className="flex-1 py-2 rounded-lg bg-red-900/60 hover:bg-red-800 font-medium text-sm text-red-300"
          >
            Reset Bout
          </button>
        </div>
      )}
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScorePanel({
  label, score, action, hasROW, flash, color,
}: {
  side: "left" | "right";
  label: string;
  score: number;
  action?: Action;
  hasROW?: boolean;
  flash: boolean;
  color: "blue" | "red";
}) {
  const accent = color === "blue" ? "text-blue-400" : "text-red-400";
  const bg     = flash
    ? (color === "blue" ? "bg-blue-900/60" : "bg-red-900/60")
    : "bg-transparent";

  return (
    <div className={`flex flex-col items-center py-4 transition-colors duration-200 ${bg}`}>
      <span className={`text-xs uppercase tracking-widest font-semibold ${accent}`}>{label}</span>
      <span className={`text-5xl font-bold mt-1 ${accent}`}>{score}</span>
      {action && (
        <span className={`text-xs mt-2 font-medium ${ACTION_COLORS[action]}`}>
          {ACTION_LABELS[action]}
        </span>
      )}
      {hasROW && (
        <span className="text-xs text-yellow-400 mt-1 font-bold">ROW</span>
      )}
    </div>
  );
}

// ── MediaPipe skeleton drawing ────────────────────────────────────────────────

const CONNECTIONS = [
  [11,13],[13,15],[12,14],[14,16],  // arms
  [11,12],[11,23],[12,24],[23,24],  // torso
  [23,25],[25,27],[24,26],[26,28],  // legs
];

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: { x: number; y: number }[],
  color: string,
  w: number,
  h: number
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  for (const [a, b] of CONNECTIONS) {
    const pa = landmarks[a], pb = landmarks[b];
    if (!pa || !pb) continue;
    ctx.beginPath();
    ctx.moveTo(pa.x * w, pa.y * h);
    ctx.lineTo(pb.x * w, pb.y * h);
    ctx.stroke();
  }
  ctx.fillStyle = color;
  for (const pt of landmarks) {
    if (!pt) continue;
    ctx.beginPath();
    ctx.arc(pt.x * w, pt.y * h, 4, 0, 2 * Math.PI);
    ctx.fill();
  }
}

// ── Audio: short beep on touch ────────────────────────────────────────────────

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (_) { /* audio not available */ }
}
