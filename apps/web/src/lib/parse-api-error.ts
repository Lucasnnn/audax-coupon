export function parseApiErrorMessage(body: string): string {
  const trimmed = body.trim();
  if (trimmed === "") {
  return "Falha na requisição";
}

  try {
    const parsed = JSON.parse(trimmed) as {
      message?: string | string[];
    };

    if (Array.isArray(parsed.message)) {
      return parsed.message.join("; ");
    }

    if (typeof parsed.message === "string" && parsed.message.trim() !== "") {
      return parsed.message;
    }
  } catch {
    // Not JSON — use the raw body.
  }

  return trimmed;
}
