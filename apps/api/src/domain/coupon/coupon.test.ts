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

  it("deactivates an active coupon", () => {
    const coupon = Coupon.create({
      code: "SUMMER",
      discountType: "PERCENTAGE",
      discountValue: 20,
    });

    coupon.deactivate();

    expect(coupon.status).toBe("INACTIVE");
  });

  it("allows changing discount type and value while usage count is zero", () => {
    const coupon = Coupon.create({
      code: "FLEX",
      discountType: "PERCENTAGE",
      discountValue: 10,
    });

    coupon.changeDiscount({
      discountType: "FIXED",
      discountValue: 2000,
      minOrderAmount: 2000,
    });

    expect(coupon.discountType).toBe("FIXED");
    expect(coupon.discountValue).toBe(2000);
    expect(coupon.minOrderAmount).toBe(2000);
  });

  it("changeDiscount still applies when usage count is positive", () => {
    const coupon = Coupon.reconstitute({
      id: "11111111-1111-1111-1111-111111111111",
      code: "USED",
      discountType: "PERCENTAGE",
      discountValue: 10,
      status: "ACTIVE",
      usageCount: 1,
      minOrderAmount: undefined,
      expiresAt: undefined,
    });

    coupon.changeDiscount({
      discountType: "PERCENTAGE",
      discountValue: 20,
    });

    expect(coupon.discountValue).toBe(20);
  });

  it("marks a coupon as expired when expiration date is in the past", () => {
    const coupon = Coupon.reconstitute({
      id: "11111111-1111-1111-1111-111111111111",
      code: "OLD",
      discountType: "PERCENTAGE",
      discountValue: 10,
      status: "ACTIVE",
      usageCount: 0,
      minOrderAmount: undefined,
      expiresAt: new Date("2020-01-01T00:00:00.000Z"),
    });

    expect(coupon.isExpired(new Date("2020-01-02T00:00:00.000Z"))).toBe(true);
  });

  it("is not expired when there is no expiration date", () => {
    const coupon = Coupon.create({
      code: "FOREVER",
      discountType: "PERCENTAGE",
      discountValue: 10,
    });

    expect(coupon.isExpired(new Date("2030-01-01T00:00:00.000Z"))).toBe(false);
  });

  it("changes the expiration date", () => {
    const coupon = Coupon.create({
      code: "EXTEND",
      discountType: "PERCENTAGE",
      discountValue: 10,
      expiresAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const next = new Date("2027-06-01T12:00:00.000Z");
    coupon.changeExpiration(next);

    expect(coupon.expiresAt).toEqual(next);
  });
});
