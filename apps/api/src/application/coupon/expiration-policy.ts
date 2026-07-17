export function assertExpirationNotBeforeToday(
  expiresAt: Date,
  now = new Date(),
): void {
  const expirationDay = startOfUtcDay(expiresAt);
  const today = startOfUtcDay(now);

  if (expirationDay < today) {
    throw new Error("Expiration date cannot be before today");
  }
}

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}
