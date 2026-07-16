export function isCouponExpired(
  expiresAt: string | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (expiresAt == null) {
    return false;
  }

  return Date.parse(expiresAt) <= nowMs;
}
