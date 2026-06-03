// Exercises the full memory round-trip against a simulated Redis list, proving
// the orchestration (add → list → search → inject → delete) works — not just
// the pure helpers. The @upstash/redis client is mocked with an in-memory list
// that mimics lpush/lrange/del semantics (newest-first).

import { beforeEach, describe, expect, it, vi } from "vitest";

// In-memory stand-in for a Redis list (index 0 = newest).
const store: string[] = [];

vi.mock("@upstash/redis", () => ({
  Redis: class {
    async lpush(_key: string, value: string) {
      store.unshift(value);
      return store.length;
    }
    async lrange(_key: string, start: number, stop: number) {
      const end = stop === -1 ? store.length : stop + 1;
      return store.slice(start, end);
    }
    async del() {
      store.length = 0;
      return 1;
    }
  },
}));

import { addMemory, listMemories, searchMemories, memoryBlock, deleteMemory } from "./memory";

beforeEach(() => {
  store.length = 0;
  vi.stubEnv("KV_REST_API_URL", "https://fake.upstash.io");
  vi.stubEnv("KV_REST_API_TOKEN", "faketoken");
});

describe("memory round-trip", () => {
  it("saves facts and lists them newest-first", async () => {
    await addMemory("Business is The Mental Sport");
    await addMemory("Co-founder is Alex");
    const mems = await listMemories();
    expect(mems.map((m) => m.text)).toEqual([
      "Co-founder is Alex",
      "Business is The Mental Sport",
    ]);
  });

  it("recalls the right fact by keyword", async () => {
    await addMemory("Business is The Mental Sport");
    await addMemory("Prefers tea over coffee");
    const hits = await searchMemories("what is my business");
    expect(hits[0].text).toBe("Business is The Mental Sport");
  });

  it("injects saved memory into the prompt block", async () => {
    await addMemory("Prefers concise replies");
    const block = await memoryBlock();
    expect(block).toMatch(/durable memory/i);
    expect(block).toMatch(/Prefers concise replies/);
  });

  it("forgets a memory by id", async () => {
    const a = await addMemory("Keep this");
    const b = await addMemory("Delete this");
    const res = await deleteMemory(b.id);
    expect(res.deleted).toBe(true);
    const remaining = await listMemories();
    expect(remaining.map((m) => m.text)).toEqual([a.text]);
  });

  it("returns an empty block when there is nothing to remember", async () => {
    expect(await memoryBlock()).toBe("");
  });
});
