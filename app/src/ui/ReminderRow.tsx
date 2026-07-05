import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { updateReminder, type Progress } from "../store/progress";
import { syncDailyReminder } from "../lib/reminders";
import { C } from "./theme";

export function ReminderRow({ progress, onChange }: { progress: Progress; onChange: (p: Progress) => void }) {
  const [busy, setBusy] = useState(false);
  const apply = async (fields: { reminderHour: number; reminderEnabled: boolean }) => {
    if (busy) return;
    setBusy(true);
    const p = await updateReminder(fields);
    await syncDailyReminder(p);
    onChange(p);
    setBusy(false);
  };
  const hour = progress.reminderHour;
  return (
    <View style={s.row}>
      <Text style={s.label}>Daily reminder</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable
          disabled={!progress.reminderEnabled}
          onPress={() => apply({ reminderEnabled: true, reminderHour: (hour + 23) % 24 })}
        >
          <Text style={s.step}>−</Text>
        </Pressable>
        <Text style={s.time}>{String(hour).padStart(2, "0")}:00</Text>
        <Pressable
          disabled={!progress.reminderEnabled}
          onPress={() => apply({ reminderEnabled: true, reminderHour: (hour + 1) % 24 })}
        >
          <Text style={s.step}>＋</Text>
        </Pressable>
        <Switch
          value={progress.reminderEnabled}
          onValueChange={(v) => apply({ reminderEnabled: v, reminderHour: hour })}
          trackColor={{ true: C.accentDim, false: C.lock }}
          thumbColor={progress.reminderEnabled ? C.accent : C.dim}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 12,
    marginTop: 20,
  },
  label: { color: C.text, fontWeight: "700" },
  step: { color: C.accent, fontSize: 22, fontWeight: "800", paddingHorizontal: 6 },
  time: { color: C.text, fontVariant: ["tabular-nums"], fontWeight: "700" },
});
