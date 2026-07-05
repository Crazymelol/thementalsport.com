export type BreathPhase = { label: "Inhale" | "Hold" | "Exhale" | "Inhale again"; seconds: number };
export type BreathingExercise = { id: string; name: string; blurb: string; phases: BreathPhase[]; source: string };

export const EXERCISES: BreathingExercise[] = [
  {
    id: "box",
    name: "Box Breathing",
    blurb: "The Navy SEAL 4-4-4-4: steady the system before or during competition.",
    phases: [
      { label: "Inhale", seconds: 4 },
      { label: "Hold", seconds: 4 },
      { label: "Exhale", seconds: 4 },
      { label: "Hold", seconds: 4 },
    ],
    source: "The Mental Performance Protocol — arousal control module",
  },
  {
    id: "sigh",
    name: "Physiological Sigh",
    blurb: "Double inhale + long exhale — the fastest evidence-backed downshift.",
    phases: [
      { label: "Inhale", seconds: 2 },
      { label: "Inhale again", seconds: 1 },
      { label: "Exhale", seconds: 6 },
    ],
    source: "The Mental Performance Protocol — 60-second reset",
  },
];
