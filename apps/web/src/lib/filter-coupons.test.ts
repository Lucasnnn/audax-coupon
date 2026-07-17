import { describe, expect, it } from "vitest";
import type { CouponDto } from "@audax/contracts";
import { filterCoupons } from "./filter-coupons";

function coupon(
  partial: Partial<CouponDto> & Pick<CouponDto, "id" | "code">,
): CouponDto {
  return {
    discountType: "PERCENTAGE",
    discountValue: 10,
    status: "ACTIVE",
    usageCount: 0,
    minOrderAmount: null,
    expiresAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

const nowMs = Date.parse("2026-06-15T12:00:00.000Z");

const samples = [
  coupon({ id: "1", code: "ACTIVE1", status: "ACTIVE", expiresAt: null }),
  coupon({
    id: "2",
    code: "INACTIVE1",
    status: "INACTIVE",
    expiresAt: "2026-12-01T00:00:00.000Z",
  }),
  coupon({
    id: "3",
    code: "EXPIRED1",
    status: "ACTIVE",
    expiresAt: "2026-01-01T00:00:00.000Z",
  }),
  coupon({
    id: "4",
    code: "BLACKFRIDAY",
    status: "ACTIVE",
    expiresAt: "2026-12-01T00:00:00.000Z",
  }),
];

describe("filterCoupons", () => {
  it("filters by active or inactive status", () => {
    expect(
      filterCoupons(samples, {
        status: "ACTIVE",
        expiration: "ALL",
        codeQuery: "",
      }).map((item) => item.code),
    ).toEqual(["ACTIVE1", "EXPIRED1", "BLACKFRIDAY"]);

    expect(
      filterCoupons(samples, {
        status: "INACTIVE",
        expiration: "ALL",
        codeQuery: "",
      }).map((item) => item.code),
    ).toEqual(["INACTIVE1"]);
  });

  it("filters expired and coupons without expiration date", () => {
    expect(
      filterCoupons(
        samples,
        { status: "ALL", expiration: "EXPIRED", codeQuery: "" },
        nowMs,
      ).map((item) => item.code),
    ).toEqual(["EXPIRED1"]);

    expect(
      filterCoupons(
        samples,
        { status: "ALL", expiration: "NO_EXPIRATION", codeQuery: "" },
        nowMs,
      ).map((item) => item.code),
    ).toEqual(["ACTIVE1"]);
  });

  it("filters by coupon code query (case insensitive)", () => {
    expect(
      filterCoupons(samples, {
        status: "ALL",
        expiration: "ALL",
        codeQuery: "black",
      }).map((item) => item.code),
    ).toEqual(["BLACKFRIDAY"]);
  });
});
