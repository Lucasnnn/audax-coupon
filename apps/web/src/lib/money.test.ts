import { describe, expect, it } from "vitest";
import { reaisToCents } from "./money";

describe("money", () => {
  it("converts reais to cents for the API", () => {
    expect(reaisToCents("15")).toBe(1500);
    expect(reaisToCents("15.50")).toBe(1550);
    expect(reaisToCents("15,50")).toBe(1550);
    expect(reaisToCents("0.01")).toBe(1);
  });
});
