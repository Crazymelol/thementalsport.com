import { describe, it, expect } from "vitest";
import { getDayLesson, searchProtocols, TOTAL_DAYS } from "./coachContent";

describe("coachContent", () => {
  it("has 48 days", () => expect(TOTAL_DAYS).toBe(48));
  it("returns day 1 with title and body", () => {
    const d = getDayLesson(1)!;
    expect(d.title).toContain("Choking");
    expect(d.body.length).toBeGreaterThan(200);
  });
  it("returns null out of range", () => {
    expect(getDayLesson(0)).toBeNull();
    expect(getDayLesson(49)).toBeNull();
  });
  it("finds breathing-related protocols", () => {
    const hits = searchProtocols("breathing");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.length).toBeLessThanOrEqual(3);
    expect(hits[0]).toHaveProperty("day");
  });
  it("empty query → []", () => expect(searchProtocols("")).toEqual([]));
});
