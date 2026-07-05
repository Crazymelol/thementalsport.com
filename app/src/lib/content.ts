import raw from "../../assets/content/titans.json";

export type DayLesson = { day: number; title: string; description: string; tags: string[]; body: string };
export const DAYS: DayLesson[] = (raw as { days: DayLesson[] }).days;
export const TOTAL_DAYS = DAYS.length;
export const getDay = (day: number): DayLesson | null => DAYS.find((d) => d.day === day) ?? null;
