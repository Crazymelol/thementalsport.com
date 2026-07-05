import { DAYS, getDay, TOTAL_DAYS } from "../content";

it("bundles 48 contiguous days", () => {
  expect(TOTAL_DAYS).toBe(48);
  DAYS.forEach((d, i) => expect(d.day).toBe(i + 1));
});

it("day 1 has content", () => {
  expect(getDay(1)!.title).toContain("Choking");
  expect(getDay(1)!.body.length).toBeGreaterThan(200);
});
