export function reaisToCents(value: string): number {
  const normalized = value.trim().replace(",", ".");
  const amount = Number(normalized);

  if (!Number.isFinite(amount)) {
    throw new Error("Monetary value must be a number");
  }

  return Math.round(amount * 100);
}

export function centsToReais(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
