export function sanitizePositiveIntegerInput(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function sanitizePositiveDecimalInput(raw: string): string {
  let cleaned = "";
  let separator: "," | "." | null = null;
  let fractionalDigits = 0;

  for (const char of raw.replace(/-/g, "")) {
    if (char >= "0" && char <= "9") {
      if (separator !== null) {
        if (fractionalDigits >= 2) {
          continue;
        }
        fractionalDigits += 1;
      }
      cleaned += char;
      continue;
    }

    if (
      (char === "," || char === ".") &&
      separator === null &&
      cleaned.length > 0
    ) {
      separator = char;
      cleaned += char;
    }
  }

  return cleaned;
}
