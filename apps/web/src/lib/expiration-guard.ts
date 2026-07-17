export function isExpirationNotBeforeToday(
  value: string,
  now = new Date(),
): boolean {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return startOfLocalDay(date) >= startOfLocalDay(now);
}

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}
