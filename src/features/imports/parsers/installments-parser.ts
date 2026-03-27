import type { ParsedInstallmentRow, ParsedWorksheet } from "@/features/imports/types";

import {
  type HeaderMap,
  findHeaderRow,
  hasMeaningfulValue,
  loadWorksheetFromSource,
  readRowValue,
  toCellText,
} from "@/features/imports/parsers/excel-parser-utils";

const REQUIRED_HEADERS = [
  "الورقة التجارية",
  "المتبقي",
  "المحصل",
  "صافي القسط",
  "قيمة القسط",
  "تاريخ القسط",
  "كود القسط",
  "نوع القسط",
  "كود الوحدة",
  "المشروع",
  "Customer",
];

export async function parseInstallmentsWorkbook(
  source: ArrayBuffer | Uint8Array,
): Promise<ParsedWorksheet<ParsedInstallmentRow>> {
  const worksheet = await loadWorksheetFromSource(source, "report");
  const headerRowMatch = findHeaderRow(worksheet, REQUIRED_HEADERS);

  if (!headerRowMatch) {
    throw new Error("Could not find the installments header row.");
  }

  const rows: ParsedInstallmentRow[] = [];

  for (let rowNumber = headerRowMatch.headerRowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);

    if (isBlankInstallmentRow(row, headerRowMatch.headerMap) || isInstallmentSummaryRow(row, headerRowMatch.headerMap)) {
      continue;
    }

    rows.push({
      sourceRowNumber: row.number,
      sourceType: "installments_report",
      commercialPaper: readRowValue(row, headerRowMatch.headerMap, ["الورقة التجارية"]),
      amountOutstanding: readRowValue(row, headerRowMatch.headerMap, ["المتبقي"]),
      amountCollected: readRowValue(row, headerRowMatch.headerMap, ["المحصل"]),
      netAmount: readRowValue(row, headerRowMatch.headerMap, ["صافي القسط"]),
      amountDue: readRowValue(row, headerRowMatch.headerMap, ["قيمة القسط"]),
      dueDate: readRowValue(row, headerRowMatch.headerMap, ["تاريخ القسط"]),
      installmentCode: readRowValue(row, headerRowMatch.headerMap, ["كود القسط"]),
      installmentType: readRowValue(row, headerRowMatch.headerMap, ["نوع القسط"]),
      unitCode: readRowValue(row, headerRowMatch.headerMap, ["كود الوحدة"]),
      projectName: readRowValue(row, headerRowMatch.headerMap, ["المشروع"]),
      customerName: readRowValue(row, headerRowMatch.headerMap, ["Customer"]),
    });
  }

  return {
    detectedColumns: headerRowMatch.detectedColumns,
    headerRowNumber: headerRowMatch.headerRowNumber,
    rawRowCount: Math.max(worksheet.rowCount - headerRowMatch.headerRowNumber, 0),
    rows,
    sheetName: worksheet.name,
    skippedRowCount: Math.max(worksheet.rowCount - headerRowMatch.headerRowNumber - rows.length, 0),
  };
}

export const parseInstallmentsParser = parseInstallmentsWorkbook;

function isBlankInstallmentRow(row: Parameters<typeof readRowValue>[0], headerMap: HeaderMap): boolean {
  return ![
    readRowValue(row, headerMap, ["كود القسط"]),
    readRowValue(row, headerMap, ["كود الوحدة"]),
    readRowValue(row, headerMap, ["المشروع"]),
    readRowValue(row, headerMap, ["Customer"]),
  ].some(hasMeaningfulValue);
}

function isInstallmentSummaryRow(
  row: Parameters<typeof readRowValue>[0],
  headerMap: HeaderMap,
): boolean {
  const installmentCode = toCellText(readRowValue(row, headerMap, ["كود القسط"]));
  const unitCode = toCellText(readRowValue(row, headerMap, ["كود الوحدة"]));

  if (isSummaryLabel(installmentCode) || isSummaryLabel(unitCode)) {
    return true;
  }

  return !/\d/.test(installmentCode) && !/\d/.test(unitCode);
}

function isSummaryLabel(value: string): boolean {
  const normalizedValue = value.toLowerCase();

  return normalizedValue === "المشروع" || normalizedValue === "إجمالي" || normalizedValue === "اجمالي";
}
