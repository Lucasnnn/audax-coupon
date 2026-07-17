import { describe, expect, it } from "vitest";
import { centsToReais, formatReaisInput, reaisToCents } from "./money";

describe("money", () => {
  it("converts reais to cents for the API", () => {
    expect(reaisToCents("15")).toBe(1500);
    expect(reaisToCents("15.50")).toBe(1550);
    expect(reaisToCents("15,50")).toBe(1550);
    expect(reaisToCents("0.01")).toBe(1);
    expect(reaisToCents("1.234,56")).toBe(123456);
  });

  it("formats cents as reais for the UI", () => {
    expect(centsToReais(1500)).toBe("15,00");
    expect(centsToReais(1550)).toBe("15,50");
    expect(centsToReais(1)).toBe("0,01");
  });

  it("rejects empty or invalid monetary input", () => {
    expect(() => reaisToCents("")).toThrow(/número/i);
    expect(() => reaisToCents("abc")).toThrow(/número/i);
  });

  it("masks digits as Brazilian reais while typing", () => {
    expect(formatReaisInput("")).toBe("");
    expect(formatReaisInput("5")).toBe("0,05");
    expect(formatReaisInput("50")).toBe("0,50");
    expect(formatReaisInput("500")).toBe("5,00");
    expect(formatReaisInput("123456")).toBe("1.234,56");
    expect(formatReaisInput("abc1.234,56xyz")).toBe("1.234,56");
  });
});
