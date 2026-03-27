function normalizeArabicDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776));
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function toIsoDate(date: Date): string | null {
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function parseExcelSerialDate(value: number): Date {
  const epoch = Date.UTC(1899, 11, 30);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return new Date(epoch + value * millisecondsPerDay);
}

export function normalizeDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return toIsoDate(value);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return toIsoDate(parseExcelSerialDate(value));
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = normalizeArabicDigits(value.trim());

  if (normalizedValue.length === 0) {
    return null;
  }

  const dayFirstMatch = normalizedValue.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);

  if (dayFirstMatch) {
    const [, day, month, year] = dayFirstMatch;
    const numericDay = Number(day);
    const numericMonth = Number(month);
    const numericYear = Number(year);
    const date = new Date(Date.UTC(numericYear, numericMonth - 1, numericDay));

    if (
      date.getUTCFullYear() !== numericYear ||
      date.getUTCMonth() !== numericMonth - 1 ||
      date.getUTCDate() !== numericDay
    ) {
      return null;
    }

    return toIsoDate(date);
  }

  const parsedDate = new Date(normalizedValue);

  return toIsoDate(parsedDate);
}
