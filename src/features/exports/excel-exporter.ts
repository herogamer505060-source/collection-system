import ExcelJS from "exceljs";

import type { ExportColumn } from "./column-definitions";

export async function generateExcel(
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
  sheetName: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = columns.map((column) => ({
    header: column.header,
    key: column.key,
    width: column.width ?? 20,
  }));
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { horizontal: "right" };
  sheet.views = [{ rightToLeft: true }];
  rows.forEach((row) => sheet.addRow(row));

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
