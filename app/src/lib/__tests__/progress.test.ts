import { unlockedDayCount, isUnlocked, nextStreak } from "../progress";

const d = (s: string) => new Date(s + "T10:00:00");

describe("unlockedDayCount", () => {
  it("day of install unlocks day 1 only", () => expect(unlockedDayCount(d("2026-06-01"), d("2026-06-01"))).toBe(1));
  it("next calendar day unlocks day 2", () => expect(unlockedDayCount(d("2026-06-01"), d("2026-06-02"))).toBe(2));
  it("same-day boundary: late night to early morning still counts a day", () =>
    expect(unlockedDayCount(new Date("2026-06-01T23:50:00"), new Date("2026-06-02T00:10:00"))).toBe(2));
  it("caps at 48", () => expect(unlockedDayCount(d("2026-01-01"), d("2026-12-01"))).toBe(48));
  it("isUnlocked matches the count", () => {
    expect(isUnlocked(2, d("2026-06-01"), d("2026-06-02"))).toBe(true);
    expect(isUnlocked(3, d("2026-06-01"), d("2026-06-02"))).toBe(false);
  });
});

describe("nextStreak", () => {
  it("first completion → 1", () => expect(nextStreak(0, null, d("2026-06-01"))).toBe(1));
  it("second completion same day → unchanged", () => expect(nextStreak(3, d("2026-06-01"), d("2026-06-01"))).toBe(3));
  it("completion on consecutive day → +1", () => expect(nextStreak(3, d("2026-06-01"), d("2026-06-02"))).toBe(4));
  it("gap resets to 1", () => expect(nextStreak(9, d("2026-06-01"), d("2026-06-04"))).toBe(1));
});
