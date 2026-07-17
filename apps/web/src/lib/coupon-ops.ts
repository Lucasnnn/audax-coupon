export function canDeleteCoupon(usageCount: number): boolean {
  return usageCount === 0;
}

export function canChangeDiscount(usageCount: number): boolean {
  return usageCount === 0;
}

export function canChangeExpiration(
  expiresAt: string | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (expiresAt == null) {
    return true;
  }

  return Date.parse(expiresAt) > nowMs;
}
