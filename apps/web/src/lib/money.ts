/** PostgreSQL INTEGER max — valores monetários em centavos. */
export const MAX_MONEY_CENTS = 2_147_483_647;

const MAX_MONEY_DIGITS = String(MAX_MONEY_CENTS).length;

export function formatReaisInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, MAX_MONEY_DIGITS);
  if (digits === "") {
    return "";
  }

  return centsToReais(Number(digits));
}

export function reaisToCents(value: string): number {
  const trimmed = value.trim();
  if (trimmed === "") {
    throw new Error("O valor monetário deve ser um número");
  }

  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed;

  const amount = Number(normalized);

  if (!Number.isFinite(amount)) {
    throw new Error("O valor monetário deve ser um número");
  }

  return Math.round(amount * 100);
}

export function assertMoneyCentsWithinLimit(cents: number): void {
  if (cents > MAX_MONEY_CENTS) {
    throw new Error("O valor monetário ultrapassa o limite máximo permitido");
  }
}

export function centsToReais(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
