import { describe, expect, it } from "vitest";
import { parseApiErrorMessage } from "./parse-api-error";

describe("parseApiErrorMessage", () => {
  it("extracts the message from a NestJS error body", () => {
    expect(
      parseApiErrorMessage(
        JSON.stringify({
          statusCode: 400,
          message: "A data de expiração não pode ser anterior a hoje",
          error: "Bad Request",
        }),
      ),
    ).toBe("A data de expiração não pode ser anterior a hoje");
  });

  it("falls back to the raw text when the body is not NestJS JSON", () => {
    expect(parseApiErrorMessage("boom")).toBe("boom");
  });

  it("joins array messages from NestJS validation errors", () => {
    expect(
      parseApiErrorMessage(
        JSON.stringify({
          statusCode: 400,
          message: ["código inválido", "valor do desconto inválido"],
        }),
      ),
    ).toBe("código inválido; valor do desconto inválido");
  });
});
