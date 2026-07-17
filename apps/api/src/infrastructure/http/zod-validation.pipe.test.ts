import { describe, expect, it } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { createCouponBodySchema } from "./coupon.schemas.js";
import { ZodValidationPipe } from "./zod-validation.pipe.js";

describe("ZodValidationPipe", () => {
  it("rejects invalid create payload before domain rules", () => {
    const pipe = new ZodValidationPipe(createCouponBodySchema);

    expect(() =>
      pipe.transform({
        code: "X",
        discountType: "PERCENTAGE",
        discountValue: "10",
      }),
    ).toThrow(BadRequestException);
  });

  it("accepts a valid create payload", () => {
    const pipe = new ZodValidationPipe(createCouponBodySchema);
    const parsed = pipe.transform({
      code: "OK",
      discountType: "PERCENTAGE",
      discountValue: 10,
    });

    expect(parsed).toEqual({
      code: "OK",
      discountType: "PERCENTAGE",
      discountValue: 10,
    });
  });
});
