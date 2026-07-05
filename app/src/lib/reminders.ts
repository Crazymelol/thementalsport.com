// One local daily notification: "Day N is ready". Local-only (no push server).
// Re-synced on every app open so the day number tracks the unlock state.
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { unlockedDayCount } from "./progress";
import { TOTAL_DAYS } from "./content";
import type { Progress } from "../store/progress";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function syncDailyReminder(p: Progress): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!p.reminderEnabled) return;
    const perms = await Notifications.requestPermissionsAsync();
    if (!perms.granted) return;
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("daily", {
        name: "Daily training",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const nextDay = Math.min(TOTAL_DAYS, unlockedDayCount(new Date(p.startDate), new Date()) + 1);
    await Notifications.scheduleNotificationAsync({
      content: { title: "The Mental Sport", body: `Day ${nextDay} is ready. Keep the streak alive. 🔥` },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: p.reminderHour,
        minute: 0,
        channelId: "daily",
      },
    });
  } catch {
    // Notifications are best-effort — never block the app on them.
  }
}
