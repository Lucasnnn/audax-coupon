import { describe, expect, it } from "vitest";
import { isExpirationNotBeforeToday } from "./expiration-guard";

describe("expiration guard", () => {
  it("rejects expiration dates before today in UTC calendar days", () => {
    const now = new Date("2026-07-16T15:00:00.000Z");

    expect(isExpirationNotBeforeToday("2026-07-15T23:00:00.000Z", now)).toBe(
      false,
    );
    expect(isExpirationNotBeforeToday("2026-07-16T00:00:00.000Z", now)).toBe(
      true,
    );
    expect(isExpirationNotBeforeToday("2026-07-17T00:00:00.000Z", now)).toBe(
      true,
    );
  });

  it("aligns with API when local wall-clock day differs from UTC day", () => {
    // 02:00 UTC on Jul 17 — still Jul 16 evening in UTC−3.
    const now = new Date("2026-07-17T02:00:00.000Z");

    expect(isExpirationNotBeforeToday("2026-07-16T23:00:00.000Z", now)).toBe(
      false,
    );
    expect(isExpirationNotBeforeToday("2026-07-17T00:00:00.000Z", now)).toBe(
      true,
    );
  });
});
