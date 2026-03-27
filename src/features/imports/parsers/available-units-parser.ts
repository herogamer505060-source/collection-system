import type { ParsedUnitRow, ParsedWorksheet } from "@/features/imports/types";

import {
  type HeaderRowMatch,
  findHeaderRow,
  hasMeaningfulValue,
  loadWorksheetFromSource,
  readRowValue,
  toCellText,
} from "@/features/imports/parsers/excel-parser-utils";

const REQUIRED_HEADERS = [
  "المشروع",
  "الكود",
  "الدور",
  "مساحة الوحدة",
  "المساحة الخارجية",
  "السعر بناءا علي قائمة الاسعار",
  "السعر بناءا علي عقد البيع",
];

export async function parseAvailableUnitsWorkbook(
  source: ArrayBuffer | Uint8Array,
): Promise<ParsedWorksheet<ParsedUnitRow>> {
  const worksheet = await loadWorksheetFromSource(source, "report");
  const headerRowMatch = findHeaderRow(worksheet, REQUIRED_HEADERS);

  if (!headerRowMatch) {
    throw new Error("Could not find the available units header row.");
  }

  const rows: ParsedUnitRow[] = [];

  for (let rowNumber = headerRowMatch.headerRowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);

    if (isBlankUnitRow(row, headerRowMatch.headerMap) || isUnitSummaryRow(row, headerRowMatch.headerMap)) {
      continue;
    }

    rows.push({
      sourceRowNumber: row.number,
      sourceType: "available_units_report",
      unitStatus: "available",
      projectName: readRowValue(row, headerRowMatch.headerMap, ["المشروع"]),
      unitCode: readRowValue(row, headerRowMatch.headerMap, ["الكود"]),
      floorName: readRowValue(row, headerRowMatch.headerMap, ["الدور"]),
      builtUpArea: readRowValue(row, headerRowMatch.headerMap, ["مساحة الوحدة"]),
      gardenArea: readRowValue(row, headerRowMatch.headerMap, ["المساحة الخارجية"]),
      listPrice: readRowValue(row, headerRowMatch.headerMap, ["السعر بناءا علي قائمة الاسعار"]),
      contractPrice: readRowValue(row, headerRowMatch.headerMap, ["السعر بناءا علي عقد البيع"]),
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

export const parseAvailableUnitsParser = parseAvailableUnitsWorkbook;

function isBlankUnitRow(row: Parameters<typeof readRowValue>[0], headerMap: HeaderRowMatch["headerMap"]): boolean {
  return ![
    readRowValue(row, headerMap, ["المشروع"]),
    readRowValue(row, headerMap, ["الكود"]),
  ].some(hasMeaningfulValue);
}

function isUnitSummaryRow(row: Parameters<typeof readRowValue>[0], headerMap: HeaderRowMatch["headerMap"]): boolean {
  const projectName = toCellText(readRowValue(row, headerMap, ["المشروع"]));
  const unitCode = toCellText(readRowValue(row, headerMap, ["الكود"]));
  const normalizedProjectName = projectName.toLowerCase();
  const normalizedUnitCode = unitCode.toLowerCase();

  if (isSummaryLabel(normalizedProjectName) || isSummaryLabel(normalizedUnitCode)) {
    return true;
  }

  return normalizedProjectName.length > 0 && normalizedProjectName === normalizedUnitCode && !/\d/.test(unitCode);
}

function isSummaryLabel(value: string): boolean {
  return value === "إجمالي" || value === "اجمالي" || value === "total";
}
