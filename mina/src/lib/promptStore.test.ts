import { describe, it, expect } from "vitest";
import {
  parseEntry,
  isValidTarget,
  activeForAgent,
  renderAddenda,
  MAX_ADDENDA,
  type PromptAddendum,
} from "./promptStore";

const make = (over: Partial<PromptAddendum>): PromptAddendum => ({
  id: "p_1",
  target: "global",
  text: "be concise",
  rationale: "user asked",
  enabled: true,
  createdAt: "2026-06-03T00:00:00.000Z",
  ...over,
});

describe("isValidTarget", () => {
  it("accepts global and every agent id", () => {
    for (const t of ["global", "inbox", "calendar", "workspace", "finance", "general"]) {
      expect(isValidTarget(t)).toBe(true);
    }
  });
  it("rejects unknown targets", () => {
    expect(isValidTarget("billing")).toBe(false);
    expect(isValidTarget("")).toBe(false);
  });
});

describe("parseEntry", () => {
  it("parses a JSON string entry", () => {
    const e = parseEntry(JSON.stringify(make({ id: "p_x", text: "hi" })));
    expect(e?.id).toBe("p_x");
    expect(e?.text).toBe("hi");
    expect(e?.enabled).toBe(true);
  });
  it("coerces an invalid target to global and missing enabled to true", () => {
    const e = parseEntry({ id: "p_y", target: "nope", text: "t", rationale: "r", createdAt: "x" });
    expect(e?.target).toBe("global");
    expect(e?.enabled).toBe(true);
  });
  it("returns null for junk", () => {
    expect(parseEntry(42)).toBeNull();
    expect(parseEntry("{not json")).toBeNull();
  });
});

describe("activeForAgent", () => {
  it("includes enabled global + enabled matching-agent, excludes disabled and other agents", () => {
    const all = [
      make({ id: "a", target: "global", enabled: true }),
      make({ id: "b", target: "inbox", enabled: true }),
      make({ id: "c", target: "inbox", enabled: false }),
      make({ id: "d", target: "finance", enabled: true }),
    ];
    const ids = activeForAgent(all, "inbox").map((a) => a.id);
    expect(ids).toEqual(["a", "b"]);
  });
});

describe("renderAddenda", () => {
  it("returns empty string when nothing active", () => {
    expect(renderAddenda([make({ enabled: false })], "general")).toBe("");
  });
  it("renders active addenda as bullet lines", () => {
    const out = renderAddenda([make({ text: "check timezones", target: "global" })], "calendar");
    expect(out).toContain("- check timezones");
    expect(out).toContain("Refinements you've learned");
  });
});

describe("MAX_ADDENDA", () => {
  it("is 20", () => {
    expect(MAX_ADDENDA).toBe(20);
  });
});
