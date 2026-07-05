import { useCallback, useState } from "react";
import { ScrollView, Text, Pressable, StyleSheet, View, Linking } from "react-native";
import { Stack, useLocalSearchParams, useFocusEffect } from "expo-router";
import Markdown from "react-native-markdown-display";
import { getDay } from "../../lib/content";
import { isUnlocked } from "../../lib/progress";
import { LINKS } from "../../lib/links";
import { getOrInitProgress, markDayComplete, type Progress } from "../../store/progress";
import { C } from "../../ui/theme";

export default function DayDetail() {
  const { day: dayParam } = useLocalSearchParams<{ day: string }>();
  const day = parseInt(dayParam ?? "1", 10);
  const [p, setP] = useState<Progress | null>(null);
  useFocusEffect(
    useCallback(() => {
      getOrInitProgress().then(setP);
    }, []),
  );
  const lesson = getDay(day);
  if (!p || !lesson) return null;
  const open = isUnlocked(day, new Date(p.startDate), new Date());
  const done = p.completedDays.includes(day);

  return (
    <>
      <Stack.Screen options={{ title: `Day ${day}` }} />
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Text style={s.title}>{lesson.title}</Text>
        {open ? (
          <>
            <View style={s.card}>
              <Markdown style={{ body: { color: C.text, fontSize: 15, lineHeight: 23 } }}>{lesson.body}</Markdown>
            </View>
            <Pressable
              onPress={async () => setP(await markDayComplete(day))}
              disabled={done}
              style={[s.btn, done && { backgroundColor: C.accentDim }]}
            >
              <Text style={s.btnText}>{done ? "✓ Completed" : "Mark complete"}</Text>
            </Pressable>
            {done && day === 48 && (
              <Pressable
                style={{ backgroundColor: C.card, borderRadius: 14, padding: 16, marginTop: 16 }}
                onPress={() => Linking.openURL(LINKS.course)}
              >
                <Text style={{ color: C.accent, fontWeight: "800", fontSize: 16 }}>48 days done. Go deeper →</Text>
                <Text style={{ color: C.dim, marginTop: 4, fontSize: 13 }}>
                  The full Mental Performance Protocol course picks up where the program ends.
                </Text>
              </Pressable>
            )}
          </>
        ) : (
          <Text style={{ color: C.dim }}>This day hasn't unlocked yet. One day at a time.</Text>
        )}
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  title: { color: C.text, fontSize: 24, fontWeight: "800", marginBottom: 12 },
  card: { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 20 },
  btn: { backgroundColor: C.accent, borderRadius: 12, padding: 16, alignItems: "center" },
  btnText: { color: "#04140A", fontWeight: "800", fontSize: 16 },
});
