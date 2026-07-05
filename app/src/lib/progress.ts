// Pure date/streak math. All comparisons are LOCAL-calendar-day based so a
// 23:50 → 00:10 gap still counts as "the next day" for both unlocks and streaks.
import { TOTAL_DAYS } from "./content";

const dayStamp = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const MS_DAY = 86_400_000;

export const calendarDaysBetween = (a: Date, b: Date) => Math.round((dayStamp(b) - dayStamp(a)) / MS_DAY);

/** How many program days are unlocked: day 1 on install day, +1 per calendar day, capped. */
export const unlockedDayCount = (startDate: Date, now: Date) =>
  Math.max(1, Math.min(TOTAL_DAYS, calendarDaysBetween(startDate, now) + 1));

export const isUnlocked = (day: number, startDate: Date, now: Date) => day <= unlockedDayCount(startDate, now);

/** Streak transition on completing a day. Same-day: unchanged; consecutive day: +1; gap: reset. */
export function nextStreak(current: number, lastCompletedAt: Date | null, now: Date): number {
  if (!lastCompletedAt) return 1;
  const gap = calendarDaysBetween(lastCompletedAt, now);
  if (gap === 0) return Math.max(1, current);
  if (gap === 1) return current + 1;
  return 1;
}
