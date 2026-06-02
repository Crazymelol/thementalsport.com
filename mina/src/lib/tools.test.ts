import { afterEach, describe, expect, it, vi } from "vitest";
import { getTool } from "./tools";

afterEach(() => vi.unstubAllEnvs());

describe("get_calendar_events stub fallback", () => {
  it("returns stub events when Google is not configured", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "");
    vi.stubEnv("GOOGLE_REFRESH_TOKEN", "");
    const tool = getTool("get_calendar_events");
    expect(tool).toBeDefined();
    const out = JSON.parse(await tool!.run({ date: "today" }));
    expect(out.note).toMatch(/stub/i);
    expect(Array.isArray(out.events)).toBe(true);
  });
});

describe("create_calendar_event approval card summary", () => {
  it("summarizes the proposed event for the approval card", () => {
    const tool = getTool("create_calendar_event");
    const s = tool!.summarize!({
      title: "Call with Alex",
      startDateTime: "2026-06-05T15:00:00+01:00",
      durationMin: 30,
    });
    expect(s.title).toBe("Create calendar event");
    expect(s.detail).toMatch(/Call with Alex/);
  });
});
