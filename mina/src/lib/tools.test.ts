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

describe("Google Suite stub fallbacks", () => {
  function clearGoogle() {
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "");
    vi.stubEnv("GOOGLE_REFRESH_TOKEN", "");
  }

  it("search_drive falls back to stub when Google not configured", async () => {
    clearGoogle();
    const out = JSON.parse(await getTool("search_drive")!.run({}));
    expect(out.note).toMatch(/stub/i);
    expect(Array.isArray(out.files)).toBe(true);
  });

  it("read_sheet falls back to stub when Google not configured", async () => {
    clearGoogle();
    const out = JSON.parse(await getTool("read_sheet")!.run({ spreadsheetId: "x" }));
    expect(out.note).toMatch(/stub/i);
    expect(Array.isArray(out.rows)).toBe(true);
  });

  it("search_contacts falls back to stub when not configured", async () => {
    clearGoogle();
    const out = JSON.parse(await getTool("search_contacts")!.run({ query: "alex" }));
    expect(out.note).toMatch(/stub/i);
  });
});

describe("Google Suite approval cards", () => {
  it("create_doc summarize produces an approval card", () => {
    const card = getTool("create_doc")!.summarize!({ title: "Notes", body: "hello world" });
    expect(card.title).toMatch(/Doc/i);
    expect(card.detail).toMatch(/hello world/);
  });

  it("append_sheet_row summarize produces an approval card", () => {
    const card = getTool("append_sheet_row")!.summarize!({ spreadsheetId: "x", values: ["Alex", "100"] });
    expect(card.title).toMatch(/row/i);
    expect(card.detail).toMatch(/Alex/);
  });
});
