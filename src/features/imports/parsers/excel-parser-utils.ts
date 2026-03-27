import ExcelJS from "exceljs";

import type { ImportCellValue } from "@/features/imports/types";

const HEADER_SCAN_LIMIT = 20;

export type HeaderMap = Map<string, number[]>;

export type HeaderRowMatch = {
  detectedColumns: string[];
  headerMap: HeaderMap;
  headerRowNumber: number;
};

export async function loadWorksheetFromSource(
  source: ArrayBuffer | Uint8Array,
  preferredSheetName?: string,
): Promise<ExcelJS.Worksheet> {
  const workbook = new ExcelJS.Workbook();
  const bytes = source instanceof Uint8Array ? source : new Uint8Array(source);

  await workbook.xlsx.load(Buffer.from(bytes) as never);

  const worksheet = preferredSheetName
    ? workbook.getWorksheet(preferredSheetName) ?? workbook.worksheets[0]
    : workbook.worksheets[0];

  if (!worksheet) {
    throw new Error("The workbook does not contain any worksheets.");
  }

  return worksheet;
}

export function extractCellValue(value: unknown): ImportCellValue {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value !== "object") {
    return null;
  }

  if ("result" in value && value.result !== undefined) {
    return extractCellValue(value.result);
  }

  if ("richText" in value && Array.isArray(value.richText)) {
    const richTextValue = value.richText
      .map((fragment) => (fragment && typeof fragment === "object" && "text" in fragment ? fragment.text : ""))
      .join("")
      .trim();

    return richTextValue.length > 0 ? richTextValue : null;
  }

  if ("text" in value) {
    return extractCellValue(value.text);
  }

  return null;
}

export function hasMeaningfulValue(value: ImportCellValue): boolean {
  if (value === null) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return true;
}

export function toCellText(value: ImportCellValue): string {
  if (value === null) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value).trim();
}

export function normalizeHeaderName(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function findHeaderRow(
  worksheet: ExcelJS.Worksheet,
  requiredHeaders: string[],
): HeaderRowMatch | null {
  const normalizedRequiredHeaders = requiredHeaders.map(normalizeHeaderName);
  const lastRowNumberToScan = Math.min(worksheet.rowCount, HEADER_SCAN_LIMIT);

  for (let rowNumber = 1; rowNumber <= lastRowNumberToScan; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const { detectedColumns, headerMap } = extractHeaderMetadata(row);

    if (normalizedRequiredHeaders.every((header) => headerMap.has(header))) {
      return {
        detectedColumns,
        headerMap,
        headerRowNumber: rowNumber,
      };
    }
  }

  return null;
}

export function readRowValue(
  row: ExcelJS.Row,
  headerMap: HeaderMap,
  headers: string[],
): ImportCellValue {
  for (const header of headers) {
    const indexes = headerMap.get(normalizeHeaderName(header));

    if (!indexes) {
      continue;
    }

    for (const index of indexes) {
      const value = extractCellValue(row.getCell(index).value);

      if (hasMeaningfulValue(value)) {
        return value;
      }
    }
  }

  return null;
}

function extractHeaderMetadata(row: ExcelJS.Row): { detectedColumns: string[]; headerMap: HeaderMap } {
  const headerMap: HeaderMap = new Map();
  const detectedColumns: string[] = [];

  for (let cellIndex = 1; cellIndex <= row.cellCount; cellIndex += 1) {
    const value = extractCellValue(row.getCell(cellIndex).value);

    if (!hasMeaningfulValue(value)) {
      continue;
    }

    const cellText = toCellText(value);
    const normalizedHeader = normalizeHeaderName(cellText);

    if (!headerMap.has(normalizedHeader)) {
      detectedColumns.push(cellText);
      headerMap.set(normalizedHeader, []);
    }

    headerMap.get(normalizedHeader)?.push(cellIndex);
  }

  return { detectedColumns, headerMap };
}
