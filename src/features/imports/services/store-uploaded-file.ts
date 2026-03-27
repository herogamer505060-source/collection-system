import type { ImportBatchType } from "@/features/imports/types";
import {
  createImportBatchRecord,
  createImportFileRecord,
  getSourceTypeForBatchType,
  uploadFileToImportStorage,
} from "@/server/repositories/storage-repository";

type StoreUploadedFileInput = {
  actorId: string;
  file: File;
  importType: ImportBatchType;
};

type StoreUploadedFileDependencies = {
  createImportBatchRecord: typeof createImportBatchRecord;
  createImportFileRecord: typeof createImportFileRecord;
  uploadFileToImportStorage: typeof uploadFileToImportStorage;
};

const DEFAULT_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function storeUploadedFile(
  input: StoreUploadedFileInput,
  dependencies: StoreUploadedFileDependencies = {
    createImportBatchRecord,
    createImportFileRecord,
    uploadFileToImportStorage,
  },
): Promise<{
  batchId: string;
  fileId: string;
  fileName: string;
  importType: ImportBatchType;
  status: "uploaded";
}> {
  assertValidWorkbookFile(input.file);

  const batch = await dependencies.createImportBatchRecord({
    actorId: input.actorId,
    batchType: input.importType,
  });
  const fileBytes = new Uint8Array(await input.file.arrayBuffer());
  const { storagePath } = await dependencies.uploadFileToImportStorage({
    batchId: batch.id,
    contentType: input.file.type || DEFAULT_CONTENT_TYPE,
    fileBytes,
    fileName: input.file.name,
  });
  const importFile = await dependencies.createImportFileRecord({
    batchId: batch.id,
    fileName: input.file.name,
    sourceType: getSourceTypeForBatchType(input.importType),
    storagePath,
  });

  return {
    batchId: batch.id,
    fileId: importFile.id,
    fileName: importFile.file_name,
    importType: input.importType,
    status: "uploaded",
  };
}

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

function assertValidWorkbookFile(file: File): void {
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    throw new Error("Only .xlsx files are supported.");
  }

  if (file.size <= 0) {
    throw new Error("The uploaded file is empty.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("File size exceeds the 50 MB limit.");
  }
}
