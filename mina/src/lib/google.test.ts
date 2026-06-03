import { afterEach, describe, expect, it, vi } from "vitest";
import { googleConfigured, GOOGLE_SCOPES, isAuthError, GoogleAuthError, driveQuery } from "./google";

afterEach(() => vi.unstubAllEnvs());

describe("googleConfigured", () => {
  it("is false when env vars are missing", () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "");
    vi.stubEnv("GOOGLE_REFRESH_TOKEN", "");
    expect(googleConfigured()).toBe(false);
  });

  it("is true only when all three are set", () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "id");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "secret");
    vi.stubEnv("GOOGLE_REFRESH_TOKEN", "token");
    expect(googleConfigured()).toBe(true);
  });
});

describe("GOOGLE_SCOPES", () => {
  it("includes calendar, drive, docs, sheets, contacts", () => {
    expect(GOOGLE_SCOPES).toEqual([
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/documents",
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/contacts",
    ]);
  });
});

describe("driveQuery", () => {
  it("returns trashed=false filter when no search term", () => {
    expect(driveQuery()).toBe("trashed = false");
  });
  it("adds a name contains clause, escaping single quotes", () => {
    expect(driveQuery("Q1 report")).toBe(
      "trashed = false and name contains 'Q1 report'",
    );
    expect(driveQuery("o'brien")).toBe(
      "trashed = false and name contains 'o\\'brien'",
    );
  });
});

describe("isAuthError", () => {
  it("detects invalid_grant", () => {
    expect(isAuthError(new Error("invalid_grant: token expired"))).toBe(true);
  });
  it("ignores unrelated errors", () => {
    expect(isAuthError(new Error("event not found"))).toBe(false);
  });
  it("recognizes a GoogleAuthError instance", () => {
    expect(isAuthError(new GoogleAuthError())).toBe(true);
  });
});
