import { describe, expect, it, vi } from "vitest";
import { buildRouterMessages, route } from "./router";

describe("buildRouterMessages", () => {
  it("includes the classification instruction in the system message", () => {
    const msgs = buildRouterMessages([{ role: "user", content: "check my email" }]);
    const system = msgs.find((m) => m.role === "system");
    expect(system?.content).toMatch(/inbox/);
    expect(system?.content).toMatch(/calendar/);
    expect(system?.content).toMatch(/workspace/);
    expect(system?.content).toMatch(/finance/);
    expect(system?.content).toMatch(/general/);
  });

  it("includes the last user message", () => {
    const msgs = buildRouterMessages([
      { role: "user", content: "check my email" },
    ]);
    const user = msgs.find((m) => m.role === "user");
    expect(user?.content).toBe("check my email");
  });

  it("uses only the last user message for routing (not full history)", () => {
    const msgs = buildRouterMessages([
      { role: "user", content: "first message" },
      { role: "assistant", content: "ok" },
      { role: "user", content: "now check my calendar" },
    ]);
    const userMsgs = msgs.filter((m) => m.role === "user");
    expect(userMsgs).toHaveLength(1);
    expect(userMsgs[0].content).toBe("now check my calendar");
  });
});

describe("route", () => {
  it("returns 'general' when GROQ_API_KEY is missing", async () => {
    vi.stubEnv("GROQ_API_KEY", "");
    const id = await route([{ role: "user", content: "hello" }]);
    expect(id).toBe("general");
    vi.unstubAllEnvs();
  });
});
