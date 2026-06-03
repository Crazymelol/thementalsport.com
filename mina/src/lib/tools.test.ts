import { afterEach, describe, expect, it, vi } from "vitest";
import { getTool, isWrite } from "./tools";

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

describe("Memory tools", () => {
  function clearMemory() {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  }

  it("remember falls back to stub when memory not configured", async () => {
    clearMemory();
    const out = JSON.parse(await getTool("remember")!.run({ text: "Business is The Mental Sport" }));
    expect(out.remembered).toBe(true);
    expect(out.note).toMatch(/stub/i);
  });

  it("recall falls back to stub when memory not configured", async () => {
    clearMemory();
    const out = JSON.parse(await getTool("recall")!.run({ query: "business" }));
    expect(out.note).toMatch(/stub/i);
    expect(Array.isArray(out.memories)).toBe(true);
  });

  it("forget summarize produces an approval card", () => {
    const card = getTool("forget")!.summarize!({ id: "m_abc123" });
    expect(card.title).toMatch(/forget/i);
    expect(card.detail).toMatch(/m_abc123/);
  });
});

describe("self-improvement tools", () => {
  it("registers all four tools", () => {
    expect(getTool("propose_prompt_improvement")).toBeDefined();
    expect(getTool("revert_prompt_improvement")).toBeDefined();
    expect(getTool("toggle_prompt_improvement")).toBeDefined();
    expect(getTool("list_prompt_improvements")).toBeDefined();
  });

  it("marks the three mutators as write-tier and the list as read", () => {
    expect(isWrite("propose_prompt_improvement")).toBe(true);
    expect(isWrite("revert_prompt_improvement")).toBe(true);
    expect(isWrite("toggle_prompt_improvement")).toBe(true);
    expect(isWrite("list_prompt_improvements")).toBe(false);
  });

  it("write tools provide an approval summary", () => {
    const s = getTool("propose_prompt_improvement")!.summarize!({
      target: "inbox",
      text: "always cc legal",
      rationale: "policy",
    });
    expect(s.title).toContain("inbox");
    expect(s.detail).toContain("always cc legal");
  });

  it("list_prompt_improvements runs read-only without a store and returns a shape", async () => {
    const out = await getTool("list_prompt_improvements")!.run({});
    expect(JSON.parse(out)).toHaveProperty("improvements");
  });
});

describe("finance / stripe tools", () => {
  it("registers all three finance tools with correct tiers", () => {
    expect(getTool("get_revenue_summary")?.tier).toBe("read");
    expect(getTool("list_recent_payments")?.tier).toBe("read");
    expect(isWrite("issue_refund")).toBe(true);
  });

  it("get_revenue_summary returns stub data when Stripe is not configured", async () => {
    const out = JSON.parse(await getTool("get_revenue_summary")!.run({ period: "this month" }));
    expect(out.note).toContain("STUB");
    expect(out).toHaveProperty("grossUSD");
  });

  it("issue_refund summary describes the charge and amount", () => {
    const s = getTool("issue_refund")!.summarize!({ chargeId: "ch_123", amountUSD: 49.5 });
    expect(s.detail).toContain("ch_123");
    expect(s.detail).toContain("$49.50");
  });
});
