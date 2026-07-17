import { describe, expect, it } from "vitest";
import { centsToReais, reaisToCents } from "./money";

describe("money", () => {
  it("converts reais to cents for the API", () => {
    expect(reaisToCents("15")).toBe(1500);
    expect(reaisToCents("15.50")).toBe(1550);
    expect(reaisToCents("15,50")).toBe(1550);
    expect(reaisToCents("0.01")).toBe(1);
  });

  it("formats cents as reais for the UI", () => {
    expect(centsToReais(1500)).toBe("15,00");
    expect(centsToReais(1550)).toBe("15,50");
    expect(centsToReais(1)).toBe("0,01");
  });
});
