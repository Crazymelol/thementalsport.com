import { describe, it, expect } from "vitest";
import { parsePeriod, centsToUSD, stripeConfigured } from "./stripe";

// A fixed "now" for deterministic period math: Wed 2026-06-03 12:00:00 local.
const NOW = new Date(2026, 5, 3, 12, 0, 0);

describe("centsToUSD", () => {
  it("converts cents to dollars", () => {
    expect(centsToUSD(8420_00)).toBe(8420);
    expect(centsToUSD(1599)).toBe(15.99);
    expect(centsToUSD(0)).toBe(0);
  });
});

describe("parsePeriod", () => {
  it("today → start of today", () => {
    const p = parsePeriod("today", NOW);
    expect(p.label).toBe("today");
    expect(p.gte).toBe(Math.floor(new Date(2026, 5, 3, 0, 0, 0).getTime() / 1000));
  });

  it("this month → first of the month", () => {
    const p = parsePeriod("this month", NOW);
    expect(p.label).toBe("this month");
    expect(p.gte).toBe(Math.floor(new Date(2026, 5, 1, 0, 0, 0).getTime() / 1000));
  });

  it("this year → first of the year", () => {
    const p = parsePeriod("revenue this year", NOW);
    expect(p.label).toBe("this year");
    expect(p.gte).toBe(Math.floor(new Date(2026, 0, 1, 0, 0, 0).getTime() / 1000));
  });

  it("explicit N days → N days ago", () => {
    const p = parsePeriod("last 7 days", NOW);
    expect(p.label).toBe("last 7 days");
    expect(p.gte).toBe(Math.floor((NOW.getTime() - 7 * 86_400_000) / 1000));
  });

  it("this week → last 7 days", () => {
    expect(parsePeriod("this week", NOW).label).toBe("last 7 days");
  });

  it("generic month phrasing → last 30 days", () => {
    expect(parsePeriod("past month or so", NOW).label).toBe("last 30 days");
  });

  it("unknown / empty → defaults to this month", () => {
    expect(parsePeriod("", NOW).label).toBe("this month");
    expect(parsePeriod("whatever", NOW).label).toBe("this month");
  });

  it("lte is always now", () => {
    const p = parsePeriod("today", NOW);
    expect(p.lte).toBe(Math.floor(NOW.getTime() / 1000));
  });
});

describe("stripeConfigured", () => {
  it("is false when no key is set in the test env", () => {
    expect(stripeConfigured()).toBe(false);
  });
});
