/** PostgreSQL INTEGER max — valores monetários em centavos. */
export const MAX_MONEY_CENTS = 2_147_483_647;

/** Teto de digitação na UI: R$ 21.474.836,00 */
export const MAX_REAIS_INPUT_CENTS = 2_147_483_600;

const MAX_MONEY_DIGITS = String(MAX_MONEY_CENTS).length;

export type FormattedReaisInput = {
  value: string;
  exceededMax: boolean;
};

export function formatReaisInput(raw: string): FormattedReaisInput {
  const digits = raw.replace(/\D/g, "");
  if (digits === "") {
    return { value: "", exceededMax: false };
  }

  const limitedDigits = digits.slice(0, MAX_MONEY_DIGITS);
  const asNumber = Number(limitedDigits);
  const exceededMax =
    digits.length > MAX_MONEY_DIGITS || asNumber > MAX_REAIS_INPUT_CENTS;

  return {
    value: centsToReais(Math.min(asNumber, MAX_REAIS_INPUT_CENTS)),
    exceededMax,
  };
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
  if (cents > MAX_REAIS_INPUT_CENTS) {
    throw new Error("O valor monetário ultrapassa o limite máximo permitido");
  }
}

export function centsToReais(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
