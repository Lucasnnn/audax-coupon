import { describe, expect, it } from "vitest";
import { isCouponExpired } from "./coupon-expiration";

describe("isCouponExpired", () => {
  it("returns true when expiration date is in the past", () => {
    expect(
      isCouponExpired(
        "2020-01-01T00:00:00.000Z",
        Date.parse("2020-01-02T00:00:00.000Z"),
      ),
    ).toBe(true);
  });
});
