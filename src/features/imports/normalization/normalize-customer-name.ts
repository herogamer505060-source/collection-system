function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function coerceText(value: unknown): string | null {
  if (typeof value === "string") {
    const text = collapseWhitespace(value);

    return text.length > 0 ? text : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

export function normalizeCustomerDisplayName(value: unknown): string | null {
  return coerceText(value);
}

export function normalizeCustomerName(value: unknown): string | null {
  const displayName = normalizeCustomerDisplayName(value);

  if (!displayName) {
    return null;
  }

  return displayName
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/[ؤ]/g, "و")
    .replace(/[ئ]/g, "ي")
    .replace(/[ى]/g, "ي")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/ـ/g, "");
}
