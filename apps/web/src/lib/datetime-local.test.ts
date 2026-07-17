import { describe, expect, it } from "vitest";
import { formatExpirationDisplay } from "./datetime-local";

describe("formatExpirationDisplay", () => {
  it("formats ISO as DD/MM/AAAA in local time", () => {
    const iso = "2025-12-31T23:59:59.000Z";
    const date = new Date(iso);
    const pad = (value: number) => String(value).padStart(2, "0");
    const expected = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;

    expect(formatExpirationDisplay(iso)).toBe(expected);
  });

  it("returns empty string for null", () => {
    expect(formatExpirationDisplay(null)).toBe("");
  });
});
