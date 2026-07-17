import { describe, expect, it } from "vitest";
import { canDeleteCoupon } from "./coupon-ops";

describe("coupon ops", () => {
  it("blocks delete after the coupon was used", () => {
    expect(canDeleteCoupon(0)).toBe(true);
    expect(canDeleteCoupon(1)).toBe(false);
  });
});
