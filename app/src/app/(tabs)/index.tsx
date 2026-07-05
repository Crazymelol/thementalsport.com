import { useCallback, useState } from "react";
import { ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import Markdown from "react-native-markdown-display";
import { getDay } from "../../lib/content";
import { unlockedDayCount } from "../../lib/progress";
import { getOrInitProgress, markDayComplete, type Progress } from "../../store/progress";
import { syncDailyReminder } from "../../lib/reminders";
import { C } from "../../ui/theme";

export default function Today() {
  const [p, setP] = useState<Progress | null>(null);
  useFocusEffect(
    useCallback(() => {
      getOrInitProgress().then(async (prog) => {
        setP(prog);
        await syncDailyReminder(prog);
      });
    }, []),
  );
  if (!p) return null;

  const unlocked = unlockedDayCount(new Date(p.startDate), new Date());
  // Today = the lowest unlocked-but-incomplete day (catch-up first), else the newest unlocked.
  const day = Array.from({ length: unlocked }, (_, i) => i + 1).find((d) => !p.completedDays.includes(d)) ?? unlocked;
  const lesson = getDay(day)!;
  const done = p.completedDays.includes(day);

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Text style={s.kicker}>
        DAY {day} OF 48 · 🔥 {p.streak}-day streak
      </Text>
      <Text style={s.title}>{lesson.title}</Text>
      <Text style={s.desc}>{lesson.description}</Text>
      <View style={s.card}>
        <Markdown style={md}>{lesson.body}</Markdown>
      </View>
      <Pressable
        onPress={async () => setP(await markDayComplete(day))}
        disabled={done}
        style={[s.btn, done && { backgroundColor: C.accentDim }]}
      >
        <Text style={s.btnText}>{done ? "✓ Day complete" : "Mark day complete"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  kicker: { color: C.accent, fontWeight: "700", letterSpacing: 1, marginBottom: 8 },
  title: { color: C.text, fontSize: 26, fontWeight: "800", marginBottom: 6 },
  desc: { color: C.dim, fontSize: 15, marginBottom: 16 },
  card: { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 20 },
  btn: { backgroundColor: C.accent, borderRadius: 12, padding: 16, alignItems: "center" },
  btnText: { color: "#04140A", fontWeight: "800", fontSize: 16 },
});

const md = {
  body: { color: C.text, fontSize: 15, lineHeight: 23 },
  heading2: { color: C.text, fontWeight: "800" as const, marginTop: 14 },
  heading3: { color: C.text, fontWeight: "700" as const, marginTop: 10 },
  strong: { color: C.text },
  blockquote: { backgroundColor: "#101720", borderLeftColor: C.accent, borderLeftWidth: 3, padding: 8 },
  bullet_list: { marginVertical: 6 },
};
