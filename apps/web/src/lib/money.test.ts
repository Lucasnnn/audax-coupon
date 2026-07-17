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
    expect(formatReaisInput("")).toEqual({ value: "", exceededMax: false });
    expect(formatReaisInput("5")).toEqual({
      value: "0,05",
      exceededMax: false,
    });
    expect(formatReaisInput("50")).toEqual({
      value: "0,50",
      exceededMax: false,
    });
    expect(formatReaisInput("500")).toEqual({
      value: "5,00",
      exceededMax: false,
    });
    expect(formatReaisInput("123456")).toEqual({
      value: "1.234,56",
      exceededMax: false,
    });
    expect(formatReaisInput("abc1.234,56xyz")).toEqual({
      value: "1.234,56",
      exceededMax: false,
    });
  });

  it("caps masked input at R$ 21.474.836,00 and signals the limit", () => {
    expect(formatReaisInput("2147483600")).toEqual({
      value: "21.474.836,00",
      exceededMax: false,
    });
    expect(formatReaisInput("2147483647")).toEqual({
      value: "21.474.836,00",
      exceededMax: true,
    });
    expect(formatReaisInput("99999999999")).toEqual({
      value: "21.474.836,00",
      exceededMax: true,
    });
  });
});
