/**
 * Sabre right-of-way and action detector.
 * Runs entirely in the browser — no server needed.
 *
 * Landmark indices from MediaPipe Pose:
 *   0  nose        11 left_shoulder   12 right_shoulder
 *   13 left_elbow  14 right_elbow     15 left_wrist   16 right_wrist
 *   23 left_hip    24 right_hip       27 left_ankle   28 right_ankle
 */

export type Action =
  | "en_garde" | "advance" | "retreat"
  | "attack" | "lunge" | "fleche"
  | "parry" | "riposte" | "touch";

export type Fencer = "left" | "right";

export interface FencerState {
  fencer: Fencer;
  action: Action;
  hasROW: boolean;          // right-of-way
  armExtension: number;     // 0–1 (1 = fully extended)
  isAdvancing: boolean;
  wristX: number;           // normalised 0–1
  wristY: number;
}

export interface JudgingResult {
  left: FencerState;
  right: FencerState;
  touch: Fencer | null;     // who scored this frame
  touchReason: string;
}

// ── Landmark index constants ─────────────────────────────────────────────────
const L = {
  NOSE: 0,
  L_SHOULDER: 11, R_SHOULDER: 12,
  L_ELBOW: 13,    R_ELBOW: 14,
  L_WRIST: 15,    R_WRIST: 16,
  L_HIP: 23,      R_HIP: 24,
  L_ANKLE: 27,    R_ANKLE: 28,
} as const;

interface XY { x: number; y: number; }

function lm(landmarks: XY[], idx: number): XY {
  return landmarks[idx] ?? { x: 0, y: 0 };
}

function angle(a: XY, b: XY, c: XY): number {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y) + 1e-6;
  return (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI;
}

function dist(a: XY, b: XY): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// ── Per-fencer analysis ──────────────────────────────────────────────────────

interface PrevState {
  wristX: number;
  ankleX: number;
  elbowAngle: number;
  ts: number;
}

const prevState: Record<Fencer, PrevState | null> = { left: null, right: null };

function analyseFencer(
  id: Fencer,
  pts: XY[],
  opponentPts: XY[],
  now: number
): FencerState {
  // Sabre is almost always right-handed; sword arm = right wrist/elbow/shoulder.
  // Detect handedness: whichever wrist is closer to the opponent.
  const leftWrist  = lm(pts, L.L_WRIST);
  const rightWrist = lm(pts, L.R_WRIST);
  const opponentX  = lm(opponentPts, L.NOSE).x;

  const swordWrist    = Math.abs(leftWrist.x  - opponentX) < Math.abs(rightWrist.x  - opponentX) ? leftWrist  : rightWrist;
  const swordElbow    = Math.abs(leftWrist.x  - opponentX) < Math.abs(rightWrist.x  - opponentX)
    ? lm(pts, L.L_ELBOW) : lm(pts, L.R_ELBOW);
  const swordShoulder = Math.abs(leftWrist.x  - opponentX) < Math.abs(rightWrist.x  - opponentX)
    ? lm(pts, L.L_SHOULDER) : lm(pts, L.R_SHOULDER);

  const hip   = lm(pts, L.L_HIP);
  const ankle = lm(pts, L.L_ANKLE);
  const nose  = lm(pts, L.NOSE);

  // Arm extension: elbow angle > 140° = extended
  const elbowAngle = angle(swordShoulder, swordElbow, swordWrist);
  const armExtension = Math.max(0, Math.min(1, (elbowAngle - 90) / 90));

  // Footwork
  const prev = prevState[id];
  let isAdvancing = false;
  let wristVelocity = 0;
  let elbowDelta = 0;

  if (prev && now - prev.ts < 300) {
    const dAnkle = ankle.x - prev.ankleX;
    // left fencer advancing = x increasing; right fencer advancing = x decreasing
    isAdvancing = id === "left" ? dAnkle > 0.005 : dAnkle < -0.005;
    wristVelocity = (swordWrist.x - prev.wristX) / (now - prev.ts);
    elbowDelta = elbowAngle - prev.elbowAngle;
  }

  prevState[id] = { wristX: swordWrist.x, ankleX: ankle.x, elbowAngle, ts: now };

  // ── Action classification ─────────────────────────────────────────────────
  let action: Action = "en_garde";

  const attacking =
    elbowDelta > 5 &&      // arm extending
    armExtension > 0.55 &&
    (id === "left" ? wristVelocity > 0.0003 : wristVelocity < -0.0003);

  const kneeBend = angle(hip, lm(pts, L.L_HIP), ankle); // rough lunge indicator
  const isLunging = kneeBend < 120 && attacking;

  const isFleche = attacking && isAdvancing && armExtension > 0.8;

  const parrying =
    !attacking &&
    Math.abs(swordWrist.y - lm(opponentPts, L.R_WRIST).y) < 0.08 &&
    elbowDelta < -3;

  const retreating = prev
    ? (id === "left"
        ? ankle.x - prev.ankleX < -0.005
        : ankle.x - prev.ankleX > 0.005)
    : false;

  if      (isFleche)   action = "fleche";
  else if (isLunging)  action = "lunge";
  else if (attacking)  action = "attack";
  else if (parrying)   action = "parry";
  else if (isAdvancing) action = "advance";
  else if (retreating)  action = "retreat";

  // ── Touch detection: wrist near opponent's valid sabre target ─────────────
  // Valid = head (nose), torso (shoulders/hips area), sword arm (shoulder/elbow/wrist)
  const validTargets = [
    lm(opponentPts, L.NOSE),
    lm(opponentPts, L.L_SHOULDER), lm(opponentPts, L.R_SHOULDER),
    lm(opponentPts, L.L_ELBOW),    lm(opponentPts, L.R_ELBOW),
    lm(opponentPts, L.L_WRIST),    lm(opponentPts, L.R_WRIST),
  ];
  const minDist = Math.min(...validTargets.map(t => dist(swordWrist, t)));
  const touchDetected = minDist < 0.06 && armExtension > 0.6;

  if (touchDetected) action = "touch";

  return {
    fencer: id,
    action,
    hasROW: attacking || isFleche || isLunging,
    armExtension,
    isAdvancing,
    wristX: swordWrist.x,
    wristY: swordWrist.y,
  };
}

// ── Right-of-way ─────────────────────────────────────────────────────────────

let rowHolder: Fencer | null = null;
let rowTimestamp = 0;

export function resetROW() {
  rowHolder = null;
  rowTimestamp = 0;
  prevState.left = null;
  prevState.right = null;
}

export function judgeFrame(
  leftLandmarks: XY[],
  rightLandmarks: XY[],
  now = performance.now()
): JudgingResult {
  const left  = analyseFencer("left",  leftLandmarks,  rightLandmarks, now);
  const right = analyseFencer("right", rightLandmarks, leftLandmarks,  now);

  // ROW: first to initiate attack claims it; a parry transfers it.
  if (left.action === "parry")  { rowHolder = "right"; rowTimestamp = now; }
  if (right.action === "parry") { rowHolder = "left";  rowTimestamp = now; }
  if (left.hasROW  && !rowHolder && now - rowTimestamp > 400) { rowHolder = "left";  rowTimestamp = now; }
  if (right.hasROW && !rowHolder && now - rowTimestamp > 400) { rowHolder = "right"; rowTimestamp = now; }
  // ROW expires after 1.5 s of no attacking action
  if (rowHolder && now - rowTimestamp > 1500) { rowHolder = null; }

  left.hasROW  = rowHolder === "left";
  right.hasROW = rowHolder === "right";

  // ── Score a touch ─────────────────────────────────────────────────────────
  let touch: Fencer | null = null;
  let touchReason = "";

  if (left.action === "touch" && right.action === "touch") {
    // Simultaneous — ROW decides in sabre
    if (rowHolder) { touch = rowHolder; touchReason = `Simultaneous — ${rowHolder} had ROW`; }
    else           { touchReason = "Simultaneous — no ROW — no touch awarded"; }
  } else if (left.action === "touch") {
    if (!rowHolder || rowHolder === "left") { touch = "left"; touchReason = "Left scores"; }
    else { touchReason = "Left contact — no ROW — no touch"; }
  } else if (right.action === "touch") {
    if (!rowHolder || rowHolder === "right") { touch = "right"; touchReason = "Right scores"; }
    else { touchReason = "Right contact — no ROW — no touch"; }
  }

  return { left, right, touch, touchReason };
}
