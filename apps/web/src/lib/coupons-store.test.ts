import { describe, expect, it, beforeEach } from "vitest";
import type { CouponDto } from "@audax/contracts";
import {
  couponsStore,
  paginateCoupons,
  sortCouponsByCode,
} from "./coupons-store";

function coupon(partial: Partial<CouponDto> & Pick<CouponDto, "id" | "code">): CouponDto {
  return {
    discountType: "PERCENTAGE",
    discountValue: 10,
    status: "ACTIVE",
    usageCount: 0,
    minOrderAmount: null,
    expiresAt: null,
    ...partial,
  };
}

describe("coupons store helpers", () => {
  beforeEach(() => {
    couponsStore._reset();
  });

  it("sorts coupons by code", () => {
    const sorted = sortCouponsByCode([
      coupon({ id: "2", code: "BETA" }),
      coupon({ id: "1", code: "ALPHA" }),
    ]);
    expect(sorted.map((item) => item.code)).toEqual(["ALPHA", "BETA"]);
  });

  it("paginates from in-memory items", () => {
    const items = [
      coupon({ id: "1", code: "A" }),
      coupon({ id: "2", code: "B" }),
      coupon({ id: "3", code: "C" }),
    ];
    expect(paginateCoupons(items, 2, 2).items.map((item) => item.code)).toEqual([
      "C",
    ]);
    expect(paginateCoupons(items, 1, 2).total).toBe(3);
  });

  it("updates local state on add replace and remove", () => {
    couponsStore.add(coupon({ id: "1", code: "KEEP" }));
    couponsStore.add(coupon({ id: "2", code: "GONE" }));
    expect(couponsStore.getSnapshot().items).toHaveLength(2);

    couponsStore.replace(
      coupon({ id: "1", code: "KEEP", status: "INACTIVE" }),
    );
    expect(
      couponsStore.getSnapshot().items.find((item) => item.id === "1")?.status,
    ).toBe("INACTIVE");

    couponsStore.remove("2");
    expect(couponsStore.getSnapshot().items.map((item) => item.id)).toEqual([
      "1",
    ]);
  });
});
