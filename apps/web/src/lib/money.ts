export function reaisToCents(value: string): number {
  const normalized = value.trim().replace(",", ".");
  if (normalized === "") {
    throw new Error("O valor monetário deve ser um número");
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount)) {
    throw new Error("O valor monetário deve ser um número");
  }

  return Math.round(amount * 100);
}

export function centsToReais(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
