import { describe, expect, it } from "vitest";
import { validateCreateCouponForm } from "./validate-create-coupon-form";

describe("validateCreateCouponForm", () => {
  it("rejects percentage outside 1..100", () => {
    expect(() =>
      validateCreateCouponForm({
        code: "PCT",
        discountType: "PERCENTAGE",
        discountValue: "101",
        minOrderAmount: "",
        expiresAt: "",
      }),
    ).toThrow(/inteiro entre 1 e 100/i);
  });

  it("rejects fixed when min order is below discount value", () => {
    expect(() =>
      validateCreateCouponForm({
        code: "FIX",
        discountType: "FIXED",
        discountValue: "20",
        minOrderAmount: "10",
        expiresAt: "",
      }),
    ).toThrow(/maior ou igual ao valor do desconto/i);
  });

  it("rejects min order amount above the maximum money amount", () => {
    expect(() =>
      validateCreateCouponForm({
        code: "HUGE",
        discountType: "PERCENTAGE",
        discountValue: "12",
        minOrderAmount: "1000000000",
        expiresAt: "",
      }),
    ).toThrow(/limite máximo/i);
  });

  it("accepts percentage 1..100 and fixed with min >= discount", () => {
    expect(
      validateCreateCouponForm({
        code: "OK",
        discountType: "PERCENTAGE",
        discountValue: "15",
        minOrderAmount: "",
        expiresAt: "",
      }),
    ).toEqual({
      code: "OK",
      discountType: "PERCENTAGE",
      discountValue: 15,
      minOrderAmount: undefined,
    });

    expect(
      validateCreateCouponForm({
        code: "FIXOK",
        discountType: "FIXED",
        discountValue: "10",
        minOrderAmount: "25",
        expiresAt: "",
      }),
    ).toEqual({
      code: "FIXOK",
      discountType: "FIXED",
      discountValue: 1000,
      minOrderAmount: 2500,
    });
  });
});
