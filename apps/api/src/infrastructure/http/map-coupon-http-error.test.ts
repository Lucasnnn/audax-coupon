import { describe, expect, it } from "vitest";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { CouponErrors } from "../../domain/coupon/coupon-errors.js";
import { mapCouponHttpError } from "./map-coupon-http-error.js";

describe("mapCouponHttpError", () => {
  it("maps notFound to NotFoundException", () => {
    expect(() => mapCouponHttpError(new Error(CouponErrors.notFound))).toThrow(
      NotFoundException,
    );
  });

  it("maps domain validation errors to BadRequestException, not NotFound", () => {
    expect(() =>
      mapCouponHttpError(new Error(CouponErrors.percentageRange)),
    ).toThrow(BadRequestException);

    try {
      mapCouponHttpError(new Error("falha inesperada do repositório"));
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error).not.toBeInstanceOf(NotFoundException);
    }
  });

  it("maps usedCannotDelete to ConflictException", () => {
    expect(() =>
      mapCouponHttpError(new Error(CouponErrors.usedCannotDelete)),
    ).toThrow(ConflictException);
  });
});
