import { describe, expect, it } from "vitest";
import {
  sanitizePositiveDecimalInput,
  sanitizePositiveIntegerInput,
} from "./numeric-input";

describe("sanitizePositiveIntegerInput", () => {
  it("mantém apenas dígitos", () => {
    expect(sanitizePositiveIntegerInput("10")).toBe("10");
    expect(sanitizePositiveIntegerInput("10abc")).toBe("10");
    expect(sanitizePositiveIntegerInput("abc")).toBe("");
  });

  it("remove sinal negativo e separadores decimais", () => {
    expect(sanitizePositiveIntegerInput("-5")).toBe("5");
    expect(sanitizePositiveIntegerInput("12,5")).toBe("125");
    expect(sanitizePositiveIntegerInput("12.5")).toBe("125");
  });
});

describe("sanitizePositiveDecimalInput", () => {
  it("mantém números positivos com vírgula ou ponto", () => {
    expect(sanitizePositiveDecimalInput("15")).toBe("15");
    expect(sanitizePositiveDecimalInput("15,50")).toBe("15,50");
    expect(sanitizePositiveDecimalInput("15.50")).toBe("15.50");
    expect(sanitizePositiveDecimalInput("0,01")).toBe("0,01");
  });

  it("rejeita texto e valores negativos", () => {
    expect(sanitizePositiveDecimalInput("abc")).toBe("");
    expect(sanitizePositiveDecimalInput("-10,00")).toBe("10,00");
    expect(sanitizePositiveDecimalInput("R$ 25,00")).toBe("25,00");
  });

  it("permite apenas um separador decimal e no máximo duas casas", () => {
    expect(sanitizePositiveDecimalInput("1.2.3")).toBe("1.23");
    expect(sanitizePositiveDecimalInput("1,234")).toBe("1,23");
    expect(sanitizePositiveDecimalInput(",50")).toBe("50");
  });
});
