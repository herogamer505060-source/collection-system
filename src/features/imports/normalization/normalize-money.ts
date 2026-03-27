type NormalizeMoneyOptions = {
  emptyAsZero?: boolean;
};

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeArabicDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776));
}

export function normalizeMoney(value: unknown, options: NormalizeMoneyOptions = {}): number | null {
  if (value === null || value === undefined) {
    return options.emptyAsZero ? 0 : null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? roundToTwoDecimals(value) : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return options.emptyAsZero ? 0 : null;
  }

  const normalizedValue = normalizeArabicDigits(trimmedValue)
    .replace(/[٬،,]/g, "")
    .replace(/[٫]/g, ".")
    .replace(/[^0-9.-]/g, "");

  if (normalizedValue.length === 0 || normalizedValue === "-" || normalizedValue === ".") {
    return null;
  }

  const numericValue = Number(normalizedValue);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return roundToTwoDecimals(numericValue);
}
