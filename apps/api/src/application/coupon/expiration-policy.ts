import { CouponErrors } from "../../domain/coupon/coupon-errors.js";

export function assertExpirationNotBeforeToday(
  expiresAt: Date,
  now = new Date(),
): void {
  const expirationDay = startOfUtcDay(expiresAt);
  const today = startOfUtcDay(now);

  if (expirationDay < today) {
    throw new Error(CouponErrors.expirationBeforeToday);
  }

  if (expiresAt.getTime() <= now.getTime()) {
    throw new Error(CouponErrors.expirationNotInFuture);
  }
}

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}
