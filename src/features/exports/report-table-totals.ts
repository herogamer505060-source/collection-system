import type { ExportColumn } from "@/features/exports/column-definitions";

export function getNumericColumnTotals(
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
): Record<string, number | null> {
  return Object.fromEntries(
    columns.map((column) => {
      let sawNumericValue = false;
      let sum = 0;

      for (const row of rows) {
        const value = row[column.key];

        if (value === null || value === undefined || value === "") {
          continue;
        }

        if (typeof value !== "number" || !Number.isFinite(value)) {
          return [column.key, null] as const;
        }

        sawNumericValue = true;
        sum += value;
      }

      return [column.key, sawNumericValue ? sum : null] as const;
    }),
  );
}

export function hasAnyNumericTotals(totals: Record<string, number | null>): boolean {
  return Object.values(totals).some((value) => value !== null);
}

export function formatNumericTotal(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return Number.isInteger(value)
    ? new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)
    : new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}
