import type { ExportColumn } from "./column-definitions";

export function generateCsv(columns: ExportColumn[], rows: Record<string, unknown>[]): string {
  const BOM = "\uFEFF";
  const headerLine = columns.map((column) => escapeCell(column.header)).join(",");
  const dataLines = rows.map((row) =>
    columns.map((column) => escapeCell(String(row[column.key] ?? ""))).join(","),
  );

  return BOM + [headerLine, ...dataLines].join("\n");
}

function escapeCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}
