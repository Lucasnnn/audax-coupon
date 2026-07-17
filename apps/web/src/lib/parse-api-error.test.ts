import { describe, expect, it } from "vitest";
import { parseApiErrorMessage } from "./parse-api-error";

describe("parseApiErrorMessage", () => {
  it("extracts the message from a NestJS error body", () => {
    expect(
      parseApiErrorMessage(
        JSON.stringify({
          statusCode: 400,
          message: "Expiration date cannot be before today",
          error: "Bad Request",
        }),
      ),
    ).toBe("Expiration date cannot be before today");
  });

  it("falls back to the raw text when the body is not NestJS JSON", () => {
    expect(parseApiErrorMessage("boom")).toBe("boom");
  });

  it("joins array messages from NestJS validation errors", () => {
    expect(
      parseApiErrorMessage(
        JSON.stringify({
          statusCode: 400,
          message: ["code must be a string", "discountValue must be a number"],
        }),
      ),
    ).toBe("code must be a string; discountValue must be a number");
  });
});
