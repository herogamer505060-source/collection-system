import { describe, expect, it, vi } from "vitest";

import { buildImportPreview } from "@/features/imports/services/build-import-preview";

describe("buildImportPreview", () => {
  it("reuses cached staging data when preview already exists", async () => {
    const downloadFileFromImportStorage = vi.fn();
    const preview = await buildImportPreview(
      { batchId: "batch-1" },
      {
        downloadFileFromImportStorage,
        getImportBatchStaging: vi.fn().mockResolvedValue({
          batch: { id: "batch-1" },
          stagingData: {
            batchType: "installments",
            changeSummary: {
              contractsToCreate: 1,
              contractsToUpdate: 0,
              customersToCreate: 1,
              customersToMatch: 0,
              installmentsToCreate: 2,
              installmentsToUpdate: 0,
              linksToCreate: 1,
            },
            counts: {
              blockedRows: 0,
              issueRows: 1,
              skippedRows: 0,
              totalRows: 2,
              validRows: 2,
            },
            detectedColumns: ["المشروع", "كود القسط"],
            fileId: "file-1",
            generatedInstallmentKeys: 0,
            sampleRows: [{ project: "IL Parco", sourceRowNumber: 12, unitCode: "B28" }],
            sheetName: "report",
            stagedAt: "2026-03-24T10:00:00Z",
            stagedRows: [],
          },
        }),
        getImportBatchWithFiles: vi.fn(),
        listImportIssuesByBatchId: vi.fn().mockResolvedValue([
          {
            batch_id: "batch-1",
            created_at: "2026-03-24T10:00:00Z",
            id: "issue-1",
            import_file_id: "file-1",
            issue_type: "unknown_project",
            message_ar: "اسم المشروع غير معروف: IL Parko",
            payload: null,
            raw_value: "IL Parko",
            resolved: false,
            resolved_at: null,
            resolved_by: null,
            severity: "high",
            source_row_number: 45,
          },
        ]),
        loadImportMatchingContext: vi.fn(),
        replaceImportIssues: vi.fn(),
        saveImportBatchStaging: vi.fn(),
        updateImportFilePreviewMetadata: vi.fn(),
      },
    );

    expect(downloadFileFromImportStorage).not.toHaveBeenCalled();
    expect(preview).toMatchObject({
      batchId: "batch-1",
      counts: {
        issueRows: 1,
        totalRows: 2,
        validRows: 2,
      },
      status: "ready_for_review",
    });
    expect(preview.issues).toContainEqual(
      expect.objectContaining({
        id: "issue-1",
        issueType: "unknown_project",
      }),
    );
  });
});
