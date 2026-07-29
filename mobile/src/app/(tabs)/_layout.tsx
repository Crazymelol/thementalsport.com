import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ColorValue } from "react-native";
import { C } from "../../ui/theme";

const icon =
  (name: keyof typeof Ionicons.glyphMap) =>
  ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} color={color} size={size} />;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: C.bg },
        headerTintColor: C.text,
        tabBarStyle: { backgroundColor: C.bg, borderTopColor: C.card },
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.dim,
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Today", tabBarIcon: icon("today") }} />
      <Tabs.Screen name="program" options={{ title: "Program", tabBarIcon: icon("calendar") }} />
      <Tabs.Screen name="tools" options={{ title: "Tools", tabBarIcon: icon("pulse") }} />
      <Tabs.Screen name="coach" options={{ title: "Coach", tabBarIcon: icon("chatbubbles") }} />
    </Tabs>
  );
}
