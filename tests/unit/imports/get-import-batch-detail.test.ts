import { describe, expect, it, vi } from "vitest";

import { getImportBatchDetail } from "@/server/queries/imports/get-import-batch-detail";

describe("getImportBatchDetail", () => {
  it("returns the detail payload shape for the batch details screen", async () => {
    const detail = await getImportBatchDetail(
      { batchId: "batch-1" },
      {
        getImportBatchStaging: vi.fn().mockResolvedValue({
          batch: { id: "batch-1" },
          stagingData: {
            changeSummary: { contractsToCreate: 1 },
            detectedColumns: ["المشروع", "كود القسط"],
          },
        }),
        getImportBatchWithFiles: vi.fn().mockResolvedValue({
          batch: {
            batch_type: "installments",
            id: "batch-1",
            issue_count: 2,
            rows_imported: 10,
            rows_skipped: 1,
            rows_total: 12,
            rows_updated: 4,
            rows_valid: 11,
            status: "approved_with_issues",
          },
          files: [
            {
              file_name: "report.xlsx",
              id: "file-1",
              sheet_name: "report",
            },
          ],
        }),
        listImportIssuesByBatchId: vi.fn().mockResolvedValue([
          {
            id: "issue-1",
            issue_type: "duplicate_unit_status",
            message_ar: "الوحدة B21 ظهرت كمباعة ومتاحة في نفس الوقت",
            severity: "high",
          },
        ]),
      },
    );

    expect(detail).toEqual({
      batchId: "batch-1",
      batchType: "installments",
      changeSummary: { contractsToCreate: 1 },
      counts: {
        issueCount: 2,
        rowsImported: 10,
        rowsSkipped: 1,
        rowsTotal: 12,
        rowsUpdated: 4,
        rowsValid: 11,
      },
      detectedColumns: ["المشروع", "كود القسط"],
      files: [{ fileId: "file-1", fileName: "report.xlsx", sheetName: "report" }],
      issues: [
        {
          id: "issue-1",
          issueType: "duplicate_unit_status",
          messageAr: "الوحدة B21 ظهرت كمباعة ومتاحة في نفس الوقت",
          severity: "high",
        },
      ],
      status: "approved_with_issues",
    });
  });
});
