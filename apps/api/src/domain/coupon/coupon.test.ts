import { describe, expect, it } from "vitest";
import { Coupon } from "./coupon.js";

describe("Coupon", () => {
  it("creates a percentage coupon with a normalized coupon code", () => {
    const coupon = Coupon.create({
      code: "  blackfriday10  ",
      discountType: "PERCENTAGE",
      discountValue: 10,
    });

    expect(coupon.code).toBe("BLACKFRIDAY10");
    expect(coupon.discountType).toBe("PERCENTAGE");
    expect(coupon.discountValue).toBe(10);
    expect(coupon.status).toBe("ACTIVE");
    expect(coupon.usageCount).toBe(0);
    expect(coupon.id).toBeTruthy();
  });

  it("rejects a percentage discount value outside 1..100", () => {
    expect(() =>
      Coupon.create({
        code: "OFF",
        discountType: "PERCENTAGE",
        discountValue: 0,
      }),
    ).toThrow(/percentage/i);
  });

  it("rejects a fixed coupon without a min order amount", () => {
    expect(() =>
      Coupon.create({
        code: "SAVE15",
        discountType: "FIXED",
        discountValue: 1500,
      }),
    ).toThrow(/min order amount/i);
  });

  it("rejects a fixed coupon when min order amount is below the discount value", () => {
    expect(() =>
      Coupon.create({
        code: "SAVE15",
        discountType: "FIXED",
        discountValue: 1500,
        minOrderAmount: 1499,
      }),
    ).toThrow(/min order amount/i);
  });

  it("rejects an empty coupon code", () => {
    expect(() =>
      Coupon.create({
        code: "   ",
        discountType: "PERCENTAGE",
        discountValue: 10,
      }),
    ).toThrow(/coupon code/i);
  });
});
