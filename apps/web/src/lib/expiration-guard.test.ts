import { describe, expect, it } from "vitest";
import { isExpirationNotBeforeToday } from "./expiration-guard";

describe("expiration guard", () => {
  it("rejects expiration dates before today", () => {
    const now = new Date("2026-07-16T15:00:00.000Z");

    expect(isExpirationNotBeforeToday("2026-07-15T10:00", now)).toBe(false);
    expect(isExpirationNotBeforeToday("2026-07-16T08:00", now)).toBe(true);
    expect(isExpirationNotBeforeToday("2026-07-17T00:00", now)).toBe(true);
  });
});
