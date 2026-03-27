function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

export function derivePenaltyAmount(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const normalizedSource =
    typeof value === "number"
      ? value
      : value.trim().replace(/,/g, "").replace(/[^0-9.-]/g, "");

  if (typeof normalizedSource === "string" && normalizedSource.length === 0) {
    throw new TypeError("Penalty amount must be a valid number.");
  }

  const normalizedValue =
    typeof normalizedSource === "number" ? normalizedSource : Number(normalizedSource);

  if (!Number.isFinite(normalizedValue)) {
    throw new TypeError("Penalty amount must be a valid number.");
  }

  if (normalizedValue < 0) {
    throw new RangeError("Penalty amount cannot be negative.");
  }

  return roundToTwoDecimals(normalizedValue);
}
