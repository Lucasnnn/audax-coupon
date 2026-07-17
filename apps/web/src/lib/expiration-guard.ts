export function isExpirationNotBeforeToday(
  value: string,
  now = new Date(),
): boolean {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  if (startOfUtcDay(date) < startOfUtcDay(now)) {
    return false;
  }

  return date.getTime() > now.getTime();
}

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}
