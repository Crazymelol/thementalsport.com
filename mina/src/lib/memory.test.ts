import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  memoryConfigured,
  scoreMemory,
  addMemoryAt,
  listMemoriesAt,
  searchMemoriesAt,
  deleteMemoryAt,
  incrDailyCounter,
} from "./memory";

afterEach(() => vi.unstubAllEnvs());

describe("memoryConfigured", () => {
  it("is false when Redis env vars are missing", () => {
    vi.stubEnv("KV_REST_API_URL", "");
    vi.stubEnv("KV_REST_API_TOKEN", "");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    expect(memoryConfigured()).toBe(false);
  });
  it("is true when the KV-style vars are set", () => {
    vi.stubEnv("KV_REST_API_URL", "https://x.upstash.io");
    vi.stubEnv("KV_REST_API_TOKEN", "tok");
    expect(memoryConfigured()).toBe(true);
  });
  it("is true when the native Upstash vars are set", () => {
    vi.stubEnv("KV_REST_API_URL", "");
    vi.stubEnv("KV_REST_API_TOKEN", "");
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

describe("key-parameterized memory (coach namespacing)", () => {
  // Force the unconfigured path so nothing touches a real store.
  beforeEach(() => {
    vi.stubEnv("KV_REST_API_URL", "");
    vi.stubEnv("KV_REST_API_TOKEN", "");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  });

  it("addMemoryAt returns a Memory even when unconfigured", async () => {
    const m = await addMemoryAt("coach:mem:test-device", "prefers morning sessions");
    expect(m.text).toBe("prefers morning sessions");
    expect(m.id).toMatch(/^m_/);
  });
  it("listMemoriesAt returns [] when unconfigured", async () => {
    expect(await listMemoriesAt("coach:mem:test-device")).toEqual([]);
  });
  it("searchMemoriesAt returns [] when unconfigured", async () => {
    expect(await searchMemoriesAt("coach:mem:test-device", "sessions")).toEqual([]);
  });
  it("deleteMemoryAt reports not-deleted when unconfigured", async () => {
    expect((await deleteMemoryAt("coach:mem:test-device", "m_x")).deleted).toBe(false);
  });
  it("incrDailyCounter returns null when unconfigured", async () => {
    expect(await incrDailyCounter("coach:rl:test:2026-06-28")).toBeNull();
  });
});
