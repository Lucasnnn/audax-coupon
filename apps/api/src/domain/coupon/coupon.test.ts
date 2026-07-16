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
});
