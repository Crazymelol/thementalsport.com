import { afterEach, describe, expect, it, vi } from "vitest";
import { memoryConfigured, scoreMemory } from "./memory";

afterEach(() => vi.unstubAllEnvs());

describe("memoryConfigured", () => {
  it("is false when Upstash env vars are missing", () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    expect(memoryConfigured()).toBe(false);
  });
  it("is true only when both are set", () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://x.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "tok");
    expect(memoryConfigured()).toBe(true);
  });
});

describe("scoreMemory", () => {
  it("scores a whole-phrase hit highest", () => {
    expect(scoreMemory("My co-founder is Alex", "co-founder")).toBeGreaterThan(0);
  });
  it("ranks a relevant memory above an irrelevant one", () => {
    const relevant = scoreMemory("Business is The Mental Sport", "mental sport business");
    const irrelevant = scoreMemory("Prefers tea over coffee", "mental sport business");
    expect(relevant).toBeGreaterThan(irrelevant);
  });
  it("returns 0 for an empty query", () => {
    expect(scoreMemory("anything", "")).toBe(0);
  });
  it("ignores very short noise terms", () => {
    expect(scoreMemory("Alex is the co-founder", "is a to")).toBe(0);
  });
});
