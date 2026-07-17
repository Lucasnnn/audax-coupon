import { describe, expect, it } from "vitest";
import { Coupon } from "../../../domain/coupon/coupon.js";
import { couponFromRow, couponToRow } from "./coupon-mapper.js";
import type { CouponRow } from "./schema.js";

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

    const row: CouponRow = {
      ...couponToRow(coupon),
      usageCount: coupon.usageCount,
      minOrderAmount: null,
      expiresAt: coupon.expiresAt ?? null,
    };
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

  it("round-trips a fixed coupon with min order amount", () => {
    const coupon = Coupon.reconstitute({
      id: "66666666-6666-6666-6666-666666666666",
      code: "SAVE15",
      discountType: "FIXED",
      discountValue: 1500,
      status: "INACTIVE",
      usageCount: 0,
      minOrderAmount: 5000,
      expiresAt: undefined,
    });

    const row: CouponRow = {
      ...couponToRow(coupon),
      usageCount: coupon.usageCount,
      minOrderAmount: coupon.minOrderAmount ?? null,
      expiresAt: coupon.expiresAt ?? null,
    };
    const restored = couponFromRow(row);

    expect(restored.discountType).toBe("FIXED");
    expect(restored.discountValue).toBe(1500);
    expect(restored.minOrderAmount).toBe(5000);
    expect(restored.status).toBe("INACTIVE");
    expect(restored.expiresAt).toBeUndefined();
  });
});
