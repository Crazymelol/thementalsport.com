import { useState } from "react";
import { ScrollView, Text, Pressable, StyleSheet, View, Linking } from "react-native";
import { EXERCISES } from "../../lib/breathing";
import { BreathingTimer } from "../../ui/BreathingTimer";
import { LINKS } from "../../lib/links";
import { C } from "../../ui/theme";

export default function Tools() {
  const [active, setActive] = useState(EXERCISES[0]);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {EXERCISES.map((e) => (
          <Pressable
            key={e.id}
            onPress={() => setActive(e)}
            style={[s.chip, active.id === e.id && { backgroundColor: C.accent }]}
          >
            <Text style={[s.chipText, active.id === e.id && { color: "#04140A" }]}>{e.name}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={s.blurb}>{active.blurb}</Text>
      <BreathingTimer exercise={active} />
      <Text style={s.source}>{active.source}</Text>
      <Pressable style={s.deeper} onPress={() => Linking.openURL(LINKS.course)}>
        <Text style={s.deeperTitle}>Go deeper: the full course →</Text>
        <Text style={s.deeperSub}>All 8 modules of The Mental Performance Protocol, on thementalsport.com</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  chip: { backgroundColor: C.card, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  chipText: { color: C.text, fontWeight: "700" },
  blurb: { color: C.dim, marginTop: 14 },
  source: { color: C.lock, fontSize: 12, textAlign: "center", marginTop: 8 },
  deeper: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginTop: 24 },
  deeperTitle: { color: C.accent, fontWeight: "800", fontSize: 16 },
  deeperSub: { color: C.dim, marginTop: 4, fontSize: 13 },
});
