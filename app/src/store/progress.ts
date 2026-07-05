import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { nextStreak } from "../lib/progress";

const KEY = "tms:progress:v1";

export type Progress = {
  startDate: string; // ISO — first launch
  deviceId: string; // anonymous UUID, coach memory namespace
  completedDays: number[];
  streak: number;
  longestStreak: number;
  lastCompletedAt: string | null;
  reminderHour: number; // local hour for the daily notification
  reminderEnabled: boolean;
};

export async function loadProgress(): Promise<Progress | null> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Progress) : null;
}

async function save(p: Progress): Promise<Progress> {
  await AsyncStorage.setItem(KEY, JSON.stringify(p));
  return p;
}

export async function getOrInitProgress(): Promise<Progress> {
  const existing = await loadProgress();
  if (existing) return existing;
  return save({
    startDate: new Date().toISOString(),
    deviceId: Crypto.randomUUID(),
    completedDays: [],
    streak: 0,
    longestStreak: 0,
    lastCompletedAt: null,
    reminderHour: 8,
    reminderEnabled: true,
  });
}

export async function markDayComplete(day: number, now = new Date()): Promise<Progress> {
  const p = await getOrInitProgress();
  if (!p.completedDays.includes(day)) {
    p.completedDays = [...p.completedDays, day].sort((a, b) => a - b);
    p.streak = nextStreak(p.streak, p.lastCompletedAt ? new Date(p.lastCompletedAt) : null, now);
    p.longestStreak = Math.max(p.longestStreak, p.streak);
    p.lastCompletedAt = now.toISOString();
  }
  return save(p);
}

export async function updateReminder(fields: Pick<Progress, "reminderHour" | "reminderEnabled">): Promise<Progress> {
  const p = await getOrInitProgress();
  return save({ ...p, ...fields });
}
