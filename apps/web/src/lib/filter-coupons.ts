import type { CouponDto, CouponStatus } from "@audax/contracts";
import { isCouponExpired } from "./coupon-expiration";

export type StatusFilter = "ALL" | CouponStatus;
export type ExpirationFilter = "ALL" | "EXPIRED" | "NO_EXPIRATION";

export type CouponListFilters = {
  status: StatusFilter;
  expiration: ExpirationFilter;
  codeQuery: string;
};

export const defaultCouponListFilters: CouponListFilters = {
  status: "ALL",
  expiration: "ALL",
  codeQuery: "",
};

export function filterCoupons(
  items: CouponDto[],
  filters: CouponListFilters,
  nowMs: number = Date.now(),
): CouponDto[] {
  const query = filters.codeQuery.trim().toUpperCase();

  return items.filter((coupon) => {
    if (filters.status !== "ALL" && coupon.status !== filters.status) {
      return false;
    }

    if (filters.expiration === "EXPIRED") {
      if (!isCouponExpired(coupon.expiresAt, nowMs)) {
        return false;
      }
    } else if (filters.expiration === "NO_EXPIRATION") {
      if (coupon.expiresAt != null) {
        return false;
      }
    }

    if (query !== "" && !coupon.code.includes(query)) {
      return false;
    }

    return true;
  });
}
