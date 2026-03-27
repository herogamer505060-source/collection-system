import { describe, expect, it, vi } from "vitest";

import { storeUploadedFile } from "@/features/imports/services/store-uploaded-file";

describe("storeUploadedFile", () => {
  it("creates the batch, uploads bytes, and persists file metadata", async () => {
    const createImportBatchRecord = vi.fn().mockResolvedValue({ id: "batch-1" });
    const uploadFileToImportStorage = vi.fn().mockResolvedValue({ storagePath: "batch-1/file.xlsx" });
    const createImportFileRecord = vi.fn().mockResolvedValue({
      file_name: "report.xlsx",
      id: "file-1",
    });
    const file = {
      arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
      name: "report.xlsx",
      size: 3,
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    } as unknown as File;

    const result = await storeUploadedFile(
      {
        actorId: "manager-1",
        file,
        importType: "installments",
      },
      {
        createImportBatchRecord,
        createImportFileRecord,
        uploadFileToImportStorage,
      },
    );

    expect(createImportBatchRecord).toHaveBeenCalledWith({
      actorId: "manager-1",
      batchType: "installments",
    });
    expect(uploadFileToImportStorage).toHaveBeenCalledWith(
      expect.objectContaining({
        batchId: "batch-1",
        fileName: "report.xlsx",
      }),
    );
    expect(createImportFileRecord).toHaveBeenCalledWith({
      batchId: "batch-1",
      fileName: "report.xlsx",
      sourceType: "installments_report",
      storagePath: "batch-1/file.xlsx",
    });
    expect(result).toEqual({
      batchId: "batch-1",
      fileId: "file-1",
      fileName: "report.xlsx",
      importType: "installments",
      status: "uploaded",
    });
  });
});
