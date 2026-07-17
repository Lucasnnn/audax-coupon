import {
  Coupon,
  type CouponStatus,
  type DiscountType,
} from "../../../domain/coupon/coupon.js";
import type { CouponInsert, CouponRow } from "./schema.js";

export function couponToRow(coupon: Coupon): CouponInsert {
  return {
    id: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    status: coupon.status,
    usageCount: coupon.usageCount,
    minOrderAmount: coupon.minOrderAmount ?? null,
    expiresAt: coupon.expiresAt ?? null,
    createdAt: coupon.createdAt,
  };
}

export function couponFromRow(row: CouponRow): Coupon {
  return Coupon.reconstitute({
    id: row.id,
    code: row.code,
    discountType: row.discountType as DiscountType,
    discountValue: row.discountValue,
    status: row.status as CouponStatus,
    usageCount: row.usageCount,
    minOrderAmount: row.minOrderAmount ?? undefined,
    expiresAt: row.expiresAt ?? undefined,
    createdAt: row.createdAt,
  });
}
