import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadProgress, markDayComplete, getOrInitProgress } from "../../store/progress";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("expo-crypto", () => ({ randomUUID: () => "123e4567-e89b-42d3-a456-426614174000" }));

beforeEach(() => AsyncStorage.clear());

it("loadProgress returns null before init", async () => {
  expect(await loadProgress()).toBeNull();
});

it("initializes once and persists startDate + deviceId", async () => {
  const p1 = await getOrInitProgress();
  const p2 = await getOrInitProgress();
  expect(p1.startDate).toBe(p2.startDate);
  expect(p1.deviceId).toBe(p2.deviceId);
  expect(p1.deviceId).toMatch(/^[0-9a-f-]{36}$/i);
});

it("markDayComplete records the day and updates streaks", async () => {
  await getOrInitProgress();
  const p = await markDayComplete(1);
  expect(p.completedDays).toContain(1);
  expect(p.streak).toBe(1);
  expect(p.longestStreak).toBe(1);
  const again = await markDayComplete(1);
  expect(again.completedDays).toEqual([1]); // no duplicates
});
