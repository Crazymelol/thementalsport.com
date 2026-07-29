import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import type { BreathingExercise } from "../lib/breathing";
import { C } from "./theme";

export function BreathingTimer({ exercise }: { exercise: BreathingExercise }) {
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [remaining, setRemaining] = useState(exercise.phases[0].seconds);
  const scale = useRef(new Animated.Value(0.6)).current;

  // Reset when switching exercises.
  useEffect(() => {
    setRunning(false);
    setPhaseIdx(0);
    scale.setValue(0.6);
    setRemaining(exercise.phases[0].seconds);
  }, [exercise, scale]);

  useEffect(() => {
    if (!running) return;
    const phase = exercise.phases[phaseIdx];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (phase.label !== "Hold") {
      Animated.timing(scale, {
        toValue: phase.label === "Exhale" ? 0.6 : 1,
        duration: phase.seconds * 1000,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
    setRemaining(phase.seconds);
    const tick = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    const next = setTimeout(() => setPhaseIdx((i) => (i + 1) % exercise.phases.length), phase.seconds * 1000);
    return () => {
      clearInterval(tick);
      clearTimeout(next);
    };
  }, [running, phaseIdx, exercise, scale]);

  const stop = () => {
    setRunning(false);
    setPhaseIdx(0);
    scale.setValue(0.6);
    setRemaining(exercise.phases[0].seconds);
  };

  return (
    <View style={s.wrap}>
      <Animated.View style={[s.circle, { transform: [{ scale }] }]} />
      <Text style={s.phase}>{running ? exercise.phases[phaseIdx].label : exercise.name}</Text>
      <Text style={s.count}>{running ? String(remaining) : " "}</Text>
      <Pressable style={s.btn} onPress={() => (running ? stop() : setRunning(true))}>
        <Text style={s.btnText}>{running ? "Stop" : "Start"}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: 24 },
  circle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: C.accentDim,
    borderColor: C.accent,
    borderWidth: 3,
    marginBottom: 16,
  },
  phase: { color: C.text, fontSize: 22, fontWeight: "800" },
  count: { color: C.dim, fontSize: 18, minHeight: 24 },
  btn: { marginTop: 12, backgroundColor: C.accent, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 40 },
  btnText: { color: "#04140A", fontWeight: "800" },
});
