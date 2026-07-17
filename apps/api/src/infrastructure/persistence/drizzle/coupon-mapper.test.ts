import { describe, expect, it } from "vitest";
import { Coupon } from "../../../domain/coupon/coupon.js";
import { couponFromRow, couponToRow } from "./coupon-mapper.js";

describe("coupon drizzle mapper", () => {
  it("round-trips a coupon through row shape", () => {
    const coupon = Coupon.reconstitute({
      id: "11111111-1111-1111-1111-111111111111",
      code: "SAVE10",
      discountType: "PERCENTAGE",
      discountValue: 10,
      status: "ACTIVE",
      usageCount: 2,
      minOrderAmount: undefined,
      expiresAt: new Date("2027-01-01T00:00:00.000Z"),
    });

    const row = couponToRow(coupon);
    const restored = couponFromRow(row);

    expect(restored.id).toBe(coupon.id);
    expect(restored.code).toBe(coupon.code);
    expect(restored.discountType).toBe(coupon.discountType);
    expect(restored.discountValue).toBe(coupon.discountValue);
    expect(restored.status).toBe(coupon.status);
    expect(restored.usageCount).toBe(coupon.usageCount);
    expect(restored.minOrderAmount).toBeUndefined();
    expect(restored.expiresAt).toEqual(coupon.expiresAt);
  });
});
