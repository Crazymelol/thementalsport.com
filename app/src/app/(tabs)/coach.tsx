import { useCallback, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { askCoach, type CoachMessage } from "../../lib/coachClient";
import { getOrInitProgress } from "../../store/progress";
import { C } from "../../ui/theme";

const OPENER: CoachMessage = {
  role: "assistant",
  content: "I'm your mental performance coach. What are you working on — nerves, focus, confidence, bouncing back?",
};

export default function Coach() {
  const [messages, setMessages] = useState<CoachMessage[]>([OPENER]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const deviceId = useRef<string>("");
  const list = useRef<FlatList<CoachMessage>>(null);
  useFocusEffect(
    useCallback(() => {
      getOrInitProgress().then((p) => {
        deviceId.current = p.deviceId;
      });
    }, []),
  );

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next: CoachMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const reply = await askCoach(next.filter((m) => m !== OPENER), deviceId.current);
      setMessages([...next, { role: "assistant", content: reply || "…" }]);
    } catch (e) {
      setMessages([
        ...next,
        { role: "assistant", content: e instanceof Error ? e.message : "Something went wrong — try again." },
      ]);
    } finally {
      setBusy(false);
      setTimeout(() => list.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FlatList
        ref={list}
        contentContainerStyle={{ padding: 14, gap: 8 }}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={[s.bubble, item.role === "user" ? s.user : s.coach]}>
            <Text style={s.bubbleText}>{item.content}</Text>
          </View>
        )}
      />
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={input}
          onChangeText={setInput}
          placeholder={busy ? "Coach is thinking…" : "Ask your coach"}
          placeholderTextColor={C.dim}
          editable={!busy}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <Pressable style={[s.send, busy && { opacity: 0.5 }]} onPress={send} disabled={busy}>
          <Text style={{ color: "#04140A", fontWeight: "800" }}>{busy ? "…" : "Send"}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  bubble: { maxWidth: "85%", borderRadius: 14, padding: 12 },
  user: { alignSelf: "flex-end", backgroundColor: C.accentDim },
  coach: { alignSelf: "flex-start", backgroundColor: C.card },
  bubbleText: { color: C.text, fontSize: 15, lineHeight: 21 },
  inputRow: { flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: C.card },
  input: { flex: 1, backgroundColor: C.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: C.text },
  send: { backgroundColor: C.accent, borderRadius: 12, paddingHorizontal: 18, justifyContent: "center" },
});
