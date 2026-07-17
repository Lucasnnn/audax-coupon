import { describe, expect, it } from "vitest";
import { canChangeDiscount, canDeleteCoupon } from "./coupon-ops";

describe("coupon ops", () => {
  it("blocks delete after the coupon was used", () => {
    expect(canDeleteCoupon(0)).toBe(true);
    expect(canDeleteCoupon(1)).toBe(false);
  });

  it("blocks discount changes after the coupon was used", () => {
    expect(canChangeDiscount(0)).toBe(true);
    expect(canChangeDiscount(1)).toBe(false);
  });
});
