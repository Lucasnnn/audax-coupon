export function isExpirationNotBeforeToday(
  value: string,
  now = new Date(),
): boolean {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return startOfUtcDay(date) >= startOfUtcDay(now);
}

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}
