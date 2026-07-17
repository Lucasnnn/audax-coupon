import { describe, expect, it } from "vitest";
import {
  canChangeDiscount,
  canChangeExpiration,
  canDeleteCoupon,
} from "./coupon-ops";

describe("coupon ops", () => {
  it("blocks delete after the coupon was used", () => {
    expect(canDeleteCoupon(0)).toBe(true);
    expect(canDeleteCoupon(1)).toBe(false);
  });

  it("blocks discount changes after the coupon was used", () => {
    expect(canChangeDiscount(0)).toBe(true);
    expect(canChangeDiscount(1)).toBe(false);
  });

  it("blocks expiration changes when the coupon is already expired", () => {
    const now = Date.parse("2026-07-16T12:00:00.000Z");
    expect(canChangeExpiration(null, now)).toBe(true);
    expect(canChangeExpiration("2026-07-17T00:00:00.000Z", now)).toBe(true);
    expect(canChangeExpiration("2026-07-16T11:00:00.000Z", now)).toBe(false);
  });
});
