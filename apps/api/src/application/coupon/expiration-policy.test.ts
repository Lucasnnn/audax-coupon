import { describe, expect, it } from "vitest";
import { assertExpirationNotBeforeToday } from "./expiration-policy.js";

describe("assertExpirationNotBeforeToday", () => {
  it("rejects expiration earlier on the same UTC calendar day", () => {
    const now = new Date("2026-07-16T22:00:00.000Z");

    expect(() =>
      assertExpirationNotBeforeToday(new Date("2026-07-16T01:00:00.000Z"), now),
    ).toThrow(/instante futuro|anterior a hoje/i);
  });

  it("accepts expiration later on the same UTC calendar day", () => {
    const now = new Date("2026-07-16T22:00:00.000Z");

    expect(() =>
      assertExpirationNotBeforeToday(new Date("2026-07-16T23:00:00.000Z"), now),
    ).not.toThrow();
  });

  it("rejects expiration on the previous UTC calendar day", () => {
    const now = new Date("2026-07-16T02:00:00.000Z");

    expect(() =>
      assertExpirationNotBeforeToday(new Date("2026-07-15T23:00:00.000Z"), now),
    ).toThrow(/data de expiração não pode ser anterior a hoje/i);
  });
});
