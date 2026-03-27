import type { ImportBatchType, ImportIssueSeverity, ImportIssueType } from "@/features/imports/types";
import {
  getImportBatchStaging,
  getImportBatchWithFiles,
  listImportIssuesByBatchId,
} from "@/server/repositories/import-batch-staging-repository";

type GetImportBatchDetailDependencies = {
  getImportBatchStaging: typeof getImportBatchStaging;
  getImportBatchWithFiles: typeof getImportBatchWithFiles;
  listImportIssuesByBatchId: typeof listImportIssuesByBatchId;
};

export type ImportBatchDetail = {
  batchId: string;
  batchType: ImportBatchType;
  changeSummary?: unknown;
  counts: {
    issueCount: number;
    rowsImported: number;
    rowsSkipped: number;
    rowsTotal: number;
    rowsUpdated: number;
    rowsValid: number;
  };
  detectedColumns?: string[];
  files: Array<{ fileId: string; fileName: string; sheetName: string | null }>;
  issues: Array<{
    id: string;
    issueType: ImportIssueType;
    messageAr: string;
    rawValue?: string | null;
    severity: ImportIssueSeverity;
    sourceRowNumber?: number | null;
  }>;
  status: string;
};

export async function getImportBatchDetail(
  input: { batchId: string },
  dependencies: GetImportBatchDetailDependencies = {
    getImportBatchStaging,
    getImportBatchWithFiles,
    listImportIssuesByBatchId,
  },
): Promise<ImportBatchDetail> {
  const batchWithFiles = await dependencies.getImportBatchWithFiles(input.batchId);

  if (!batchWithFiles) {
    throw new Error("Import batch was not found.");
  }

  const [issues, staging] = await Promise.all([
    dependencies.listImportIssuesByBatchId(input.batchId),
    dependencies.getImportBatchStaging(input.batchId),
  ]);

  return {
    batchId: batchWithFiles.batch.id,
    batchType: assertImportBatchType(batchWithFiles.batch.batch_type),
    changeSummary: staging?.stagingData?.changeSummary,
    counts: {
      issueCount: batchWithFiles.batch.issue_count,
      rowsImported: batchWithFiles.batch.rows_imported,
      rowsSkipped: batchWithFiles.batch.rows_skipped,
      rowsTotal: batchWithFiles.batch.rows_total,
      rowsUpdated: batchWithFiles.batch.rows_updated,
      rowsValid: batchWithFiles.batch.rows_valid,
    },
    detectedColumns: staging?.stagingData?.detectedColumns,
    files: batchWithFiles.files.map((file) => ({
      fileId: file.id,
      fileName: file.file_name,
      sheetName: file.sheet_name,
    })),
    issues: issues.map((issue) => ({
      id: issue.id,
      issueType: issue.issue_type as ImportIssueType,
      messageAr: issue.message_ar,
      rawValue: issue.raw_value,
      severity: issue.severity as ImportIssueSeverity,
      sourceRowNumber: issue.source_row_number,
    })),
    status: batchWithFiles.batch.status,
  };
}

function assertImportBatchType(batchType: string): ImportBatchType {
  if (batchType === "installments" || batchType === "sold_units" || batchType === "available_units") {
    return batchType;
  }

  throw new Error(`Unsupported import batch type: ${batchType}`);
}
