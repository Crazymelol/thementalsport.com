import { useCallback, useState } from "react";
import { FlatList, Text, View, Pressable, StyleSheet } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { DAYS } from "../../lib/content";
import { unlockedDayCount } from "../../lib/progress";
import { getOrInitProgress, type Progress } from "../../store/progress";
import { C } from "../../ui/theme";

export default function Program() {
  const [p, setP] = useState<Progress | null>(null);
  useFocusEffect(
    useCallback(() => {
      getOrInitProgress().then(setP);
    }, []),
  );
  if (!p) return null;
  const unlocked = unlockedDayCount(new Date(p.startDate), new Date());

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 12 }}
      data={DAYS}
      keyExtractor={(d) => String(d.day)}
      renderItem={({ item }) => {
        const done = p.completedDays.includes(item.day);
        const open = item.day <= unlocked;
        return (
          <Pressable
            disabled={!open}
            onPress={() => router.push(`/day/${item.day}`)}
            style={[s.row, !open && { opacity: 0.45 }]}
          >
            <View
              style={[
                s.badge,
                done
                  ? { backgroundColor: C.accent }
                  : open
                    ? { borderColor: C.accent, borderWidth: 2 }
                    : { backgroundColor: C.lock },
              ]}
            >
              <Text style={[s.badgeText, done && { color: "#04140A" }]}>{done ? "✓" : item.day}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={s.rowSub} numberOfLines={1}>
                {open ? item.description : "Unlocks later — one day at a time"}
              </Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.card, borderRadius: 12, padding: 12, marginBottom: 8 },
  badge: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  badgeText: { color: C.text, fontWeight: "800" },
  rowTitle: { color: C.text, fontWeight: "700" },
  rowSub: { color: C.dim, fontSize: 12, marginTop: 2 },
});
