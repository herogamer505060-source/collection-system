import { parseAvailableUnitsWorkbook } from "@/features/imports/parsers/available-units-parser";
import { parseInstallmentsWorkbook } from "@/features/imports/parsers/installments-parser";
import { parseSoldUnitsWorkbook } from "@/features/imports/parsers/sold-units-parser";
import { normalizeImportRow } from "@/features/imports/normalization/normalize-import-row";
import {
  buildPreviewPayload,
  stageImportRows,
} from "@/features/imports/staging/stage-import-rows";
import type {
  ImportBatchStagingData,
  ImportBatchType,
  ImportIssueType,
  ImportPreviewPayload,
  ImportIssueSeverity,
  ParsedInstallmentRow,
  ParsedUnitRow,
  ParsedWorksheet,
} from "@/features/imports/types";
import {
  getImportBatchStaging,
  getImportBatchWithFiles,
  listImportIssuesByBatchId,
  loadImportMatchingContext,
  replaceImportIssues,
  saveImportBatchStaging,
  updateImportFilePreviewMetadata,
} from "@/server/repositories/import-batch-staging-repository";
import { downloadFileFromImportStorage } from "@/server/repositories/storage-repository";
import type { Tables } from "@/types/database";

type BuildImportPreviewDependencies = {
  downloadFileFromImportStorage: typeof downloadFileFromImportStorage;
  getImportBatchStaging: typeof getImportBatchStaging;
  getImportBatchWithFiles: typeof getImportBatchWithFiles;
  listImportIssuesByBatchId: typeof listImportIssuesByBatchId;
  loadImportMatchingContext: typeof loadImportMatchingContext;
  replaceImportIssues: typeof replaceImportIssues;
  saveImportBatchStaging: typeof saveImportBatchStaging;
  updateImportFilePreviewMetadata: typeof updateImportFilePreviewMetadata;
};

export async function buildImportPreview(
  input: { batchId: string },
  dependencies: BuildImportPreviewDependencies = {
    downloadFileFromImportStorage,
    getImportBatchStaging,
    getImportBatchWithFiles,
    listImportIssuesByBatchId,
    loadImportMatchingContext,
    replaceImportIssues,
    saveImportBatchStaging,
    updateImportFilePreviewMetadata,
  },
): Promise<ImportPreviewPayload> {
  const existingStaging = await dependencies.getImportBatchStaging(input.batchId);

  if (existingStaging?.stagingData) {
    const issues = await dependencies.listImportIssuesByBatchId(input.batchId);

    return buildPreviewPayload({
      batchId: input.batchId,
      changeSummary: existingStaging.stagingData.changeSummary,
      counts: existingStaging.stagingData.counts,
      detectedColumns: existingStaging.stagingData.detectedColumns,
      issues: issues.map(mapStoredIssue),
      sampleRows: existingStaging.stagingData.sampleRows,
    });
  }

  const batchWithFiles = await dependencies.getImportBatchWithFiles(input.batchId);

  if (!batchWithFiles) {
    throw new Error("Import batch was not found.");
  }

  const batchType = assertImportBatchType(batchWithFiles.batch.batch_type);
  const importFile = batchWithFiles.files.at(-1);

  if (!importFile) {
    throw new Error("Import batch does not have an uploaded file.");
  }

  const fileBytes = await dependencies.downloadFileFromImportStorage(importFile.storage_path);

  if (batchType === "installments") {
    const parsedWorksheet = await parseWorksheetByBatchType(batchType, fileBytes);
    const projectCodes = collectProjectCodes(parsedWorksheet.rows);
    const matchingContext = await dependencies.loadImportMatchingContext({ projectCodes });
    const staged = stageImportRows({ batchType, matchingContext, parsedWorksheet });

    return persistAndBuildPreview({
      batchId: input.batchId,
      batchType,
      dependencies,
      importFile,
      parsedWorksheet,
      staged,
    });
  }

  const parsedWorksheet = await parseWorksheetByBatchType(batchType, fileBytes);
  const projectCodes = collectProjectCodes(parsedWorksheet.rows);
  const matchingContext = await dependencies.loadImportMatchingContext({ projectCodes });
  const staged = stageImportRows({ batchType, matchingContext, parsedWorksheet });

  return persistAndBuildPreview({
    batchId: input.batchId,
    batchType,
    dependencies,
    importFile,
    parsedWorksheet,
    staged,
  });
}

async function persistAndBuildPreview(input: {
  batchId: string;
  batchType: ImportBatchType;
  dependencies: BuildImportPreviewDependencies;
  importFile: Tables<"import_files">;
  parsedWorksheet: ParsedWorksheet<ParsedInstallmentRow> | ParsedWorksheet<ParsedUnitRow>;
  staged: ReturnType<typeof stageImportRows>;
}): Promise<ImportPreviewPayload> {
  await input.dependencies.updateImportFilePreviewMetadata({
    detectedColumns: input.parsedWorksheet.detectedColumns,
    fileId: input.importFile.id,
    headerRowNumber: input.parsedWorksheet.headerRowNumber,
    rawRowsCount: input.parsedWorksheet.rawRowCount,
    rejectedRowsCount: input.staged.counts.blockedRows + input.parsedWorksheet.skippedRowCount,
    sheetName: input.parsedWorksheet.sheetName,
    validRowsCount: input.staged.counts.validRows,
  });

  const persistedIssues = await input.dependencies.replaceImportIssues({
    batchId: input.batchId,
    importFileId: input.importFile.id,
    issues: input.staged.issues,
  });
  const stagingData: ImportBatchStagingData = {
    batchType: input.batchType,
    changeSummary: input.staged.changeSummary,
    counts: input.staged.counts,
    detectedColumns: input.parsedWorksheet.detectedColumns,
    fileId: input.importFile.id,
    generatedInstallmentKeys: input.staged.stagedRows.filter(
      (row) => row.kind === "installment" && row.installment.keySource === "fallback",
    ).length,
    sampleRows: input.staged.sampleRows,
    sheetName: input.parsedWorksheet.sheetName,
    stagedAt: new Date().toISOString(),
    stagedRows: input.staged.stagedRows,
  };

  await input.dependencies.saveImportBatchStaging({
    batchId: input.batchId,
    issueCount: persistedIssues.length,
    stagingData,
  });

  return buildPreviewPayload({
    batchId: input.batchId,
    changeSummary: input.staged.changeSummary,
    counts: input.staged.counts,
    detectedColumns: input.parsedWorksheet.detectedColumns,
    issues: persistedIssues.map(mapStoredIssue),
    sampleRows: input.staged.sampleRows,
  });
}

async function parseWorksheetByBatchType(
  batchType: "installments",
  fileBytes: Uint8Array,
): Promise<ParsedWorksheet<ParsedInstallmentRow>>;
async function parseWorksheetByBatchType(
  batchType: "sold_units" | "available_units",
  fileBytes: Uint8Array,
): Promise<ParsedWorksheet<ParsedUnitRow>>;
async function parseWorksheetByBatchType(
  batchType: ImportBatchType,
  fileBytes: Uint8Array,
): Promise<ParsedWorksheet<ParsedInstallmentRow> | ParsedWorksheet<ParsedUnitRow>> {
  switch (batchType) {
    case "installments":
      return parseInstallmentsWorkbook(fileBytes);
    case "sold_units":
      return parseSoldUnitsWorkbook(fileBytes);
    case "available_units":
      return parseAvailableUnitsWorkbook(fileBytes);
  }
}

function collectProjectCodes(rows: Array<ParsedInstallmentRow | ParsedUnitRow>): string[] {
  const projectCodes = new Set<string>();

  for (const row of rows) {
    const normalizedRow = normalizeImportRow(row);

    if (normalizedRow.projectCode) {
      projectCodes.add(normalizedRow.projectCode);
    }
  }

  return Array.from(projectCodes);
}

function assertImportBatchType(batchType: string): ImportBatchType {
  if (batchType === "installments" || batchType === "sold_units" || batchType === "available_units") {
    return batchType;
  }

  throw new Error(`Unsupported import batch type: ${batchType}`);
}

function mapStoredIssue(issue: Tables<"import_issues">) {
  return {
    id: issue.id,
    issueType: issue.issue_type as ImportIssueType,
    messageAr: issue.message_ar,
    payload: issue.payload,
    rawValue: issue.raw_value,
    severity: issue.severity as ImportIssueSeverity,
    sourceRowNumber: issue.source_row_number,
  };
}
