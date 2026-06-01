/**
 * In-browser inference for the trained sabre action model (ONNX).
 *
 * Loads `/models/sabre.onnx` (exported by backend/training/export_onnx.py) and
 * runs it on a rolling window of pose frames — fully offline once cached.
 *
 * CRITICAL: the feature vector here must match backend/services/pose_estimator.py
 * exactly — 33 MediaPipe landmarks x [x, y, z, visibility], normalised 0-1,
 * in MediaPipe landmark order. Both come straight from MediaPipe's raw output.
 */

import type { InferenceSession, Tensor as OrtTensor } from "onnxruntime-web";

export interface ModelConfig {
  window: number;
  feature_dim: number;
  actions: string[];
}

export interface Prediction {
  action: string;
  confidence: number;
}

const MODEL_URL = "/models/sabre.onnx";
const CONFIG_URL = "/models/sabre.json";

export interface XYZV { x: number; y: number; z: number; visibility?: number }

/** Flatten one frame's landmarks into the canonical normalised feature vector. */
export function landmarksToVector(landmarks: XYZV[], featureDim: number): Float32Array {
  const vec = new Float32Array(featureDim);
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    const base = i * 4;
    if (base + 3 >= featureDim) break;
    vec[base]     = lm.x;
    vec[base + 1] = lm.y;
    vec[base + 2] = lm.z;
    vec[base + 3] = lm.visibility ?? 0;
  }
  return vec;
}

/** Rolling buffer of the last N pose-frame vectors for one fencer. */
export class PoseBuffer {
  private frames: Float32Array[] = [];
  constructor(private window: number, private featureDim: number) {}

  push(landmarks: XYZV[]) {
    this.frames.push(landmarksToVector(landmarks, this.featureDim));
    if (this.frames.length > this.window) this.frames.shift();
  }

  isReady(): boolean {
    return this.frames.length === this.window;
  }

  /** Flattened (window * feature_dim) input tensor data. */
  toInput(): Float32Array {
    const out = new Float32Array(this.window * this.featureDim);
    for (let t = 0; t < this.frames.length; t++) {
      out.set(this.frames[t], t * this.featureDim);
    }
    return out;
  }

  reset() {
    this.frames = [];
  }
}

export class SabreModel {
  private session: InferenceSession | null = null;
  private ort: typeof import("onnxruntime-web") | null = null;
  config: ModelConfig | null = null;

  /** Returns true if the model loaded, false if no model is deployed (404). */
  async load(): Promise<boolean> {
    try {
      // Check the model exists before pulling the heavy runtime
      const cfgRes = await fetch(CONFIG_URL, { method: "GET" });
      if (!cfgRes.ok) return false;
      this.config = await cfgRes.json();

      this.ort = await import("onnxruntime-web");
      this.session = await this.ort.InferenceSession.create(MODEL_URL, {
        executionProviders: ["wasm"],
      });
      return true;
    } catch (e) {
      console.warn("Sabre model not available — using heuristics.", e);
      return false;
    }
  }

  get isLoaded(): boolean {
    return this.session !== null && this.config !== null;
  }

  async predict(buffer: PoseBuffer): Promise<Prediction | null> {
    if (!this.session || !this.ort || !this.config || !buffer.isReady()) return null;

    const input = new this.ort.Tensor("float32", buffer.toInput(), [
      1,
      this.config.window,
      this.config.feature_dim,
    ]);

    const result = await this.session.run({ pose_window: input });
    const logits = result.action_logits.data as Float32Array;

    // Softmax → top class
    let maxIdx = 0;
    let maxVal = -Infinity;
    for (let i = 0; i < logits.length; i++) {
      if (logits[i] > maxVal) { maxVal = logits[i]; maxIdx = i; }
    }
    let sum = 0;
    for (let i = 0; i < logits.length; i++) sum += Math.exp(logits[i] - maxVal);
    const confidence = 1 / sum; // exp(0)/sum

    return { action: this.config.actions[maxIdx], confidence };
  }
}
