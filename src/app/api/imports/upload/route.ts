import { z } from "zod";

import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { recordAuditEvent } from "@/lib/auth/audit-log";
import {
  handleImportRouteError,
  requireImportManageAccess,
} from "@/features/imports/services/import-access";
import { storeUploadedFile } from "@/features/imports/services/store-uploaded-file";

const importTypeSchema = z.enum(["installments", "sold_units", "available_units"]);

export async function POST(request: Request) {
  try {
    const sessionUser = await getRequiredSessionUser();
    requireImportManageAccess(sessionUser);

    const formData = await request.formData();
    const file = formData.get("file");
    const importType = importTypeSchema.parse(formData.get("importType"));

    if (!isFileLike(file)) {
      throw new Error("يجب إرفاق ملف Excel صالح");
    }

    const payload = await storeUploadedFile({
      actorId: sessionUser.id,
      file: file as File,
      importType,
    });

    recordAuditEvent({
      action: "import.upload",
      actorId: sessionUser.id,
      entityId: payload.batchId,
      entityType: "import_batch",
      metadata: {
        fileName: payload.fileName,
        importType,
      },
    });

    return Response.json(payload, { status: 201 });
  } catch (error) {
    recordAuditEvent({
      action: "import.upload_failed",
      severity: "warn",
      metadata: {
        error: error instanceof Error ? error.message : "unknown_error",
      },
    });
    return handleImportRouteError(error);
  }
}

function isFileLike(value: FormDataEntryValue | null): value is File {
  return Boolean(
    value &&
      typeof value === "object" &&
      "name" in value,
  );
}
