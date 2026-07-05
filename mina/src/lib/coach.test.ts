import { afterEach, describe, expect, it, vi } from "vitest";
import { coachTools, checkCoachAuth, COACH_SYSTEM_PROMPT } from "./coach";
import { TOOLS } from "./tools";

afterEach(() => vi.unstubAllEnvs());

const DEVICE = "123e4567-e89b-42d3-a456-426614174000";

describe("coach tool isolation (spec security invariant)", () => {
  const names = coachTools(DEVICE).map((t) => t.name).sort();
  it("exposes exactly the allowlist", () => {
    expect(names).toEqual(["forget", "get_day_lesson", "recall", "remember", "search_protocols"]);
  });
  it("exposes NO operator tools", () => {
    const operator = TOOLS.map((t) => t.name);
    for (const n of names.filter((x) => !["remember", "recall", "forget"].includes(x))) {
      expect(operator).not.toContain(n);
    }
    for (const forbidden of ["send_email", "issue_refund", "create_calendar_event", "create_skill", "propose_prompt_improvement", "browse_url"]) {
      expect(names).not.toContain(forbidden);
    }
  });
});

describe("checkCoachAuth", () => {
  const mk = (h: Record<string, string>) => new Headers(h);
  it("503 when server has no token", () => {
    vi.stubEnv("COACH_APP_TOKEN", "");
    expect(checkCoachAuth(mk({ "x-app-token": "x", "x-device-id": DEVICE }))).toMatchObject({ ok: false, status: 503 });
  });
  it("401 on wrong token", () => {
    vi.stubEnv("COACH_APP_TOKEN", "secret");
    expect(checkCoachAuth(mk({ "x-app-token": "wrong", "x-device-id": DEVICE }))).toMatchObject({ ok: false, status: 401 });
  });
  it("400 on bad device id", () => {
    vi.stubEnv("COACH_APP_TOKEN", "secret");
    expect(checkCoachAuth(mk({ "x-app-token": "secret", "x-device-id": "not-a-uuid" }))).toMatchObject({ ok: false, status: 400 });
  });
  it("ok on valid token + uuid", () => {
    vi.stubEnv("COACH_APP_TOKEN", "secret");
    expect(checkCoachAuth(mk({ "x-app-token": "secret", "x-device-id": DEVICE }))).toEqual({ ok: true, deviceId: DEVICE });
  });
});

describe("persona guardrails", () => {
  it("mentions the clinical boundary and crisis redirect", () => {
    expect(COACH_SYSTEM_PROMPT).toMatch(/not .*(therap|medical|clinical)/i);
    expect(COACH_SYSTEM_PROMPT).toMatch(/professional/i);
  });
});
