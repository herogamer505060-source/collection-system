import { z } from "zod";

import { recordAuditEvent } from "@/lib/auth/audit-log";
import { getRequiredSessionUser, type SessionUser } from "@/lib/auth/get-session-user";
import { AuthorizationError, FORBIDDEN_MESSAGE } from "@/lib/auth/permissions";
import { apiErrorResponse, badRequest, toApiError } from "@/lib/errors/api-error";
import { parseUUIDParam } from "@/lib/validation/uuid";
import {
  createDocumentRecord,
  deleteDocumentFromStorage,
  uploadDocumentToStorage,
} from "@/server/repositories/document-repository";
import { requireReadableContract } from "@/server/queries/contracts/get-contract-documents";

const documentTypeSchema = z.enum(["contract", "amendment", "receipt", "other"]);
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

export async function POST(
  request: Request,
  context: { params: Promise<{ contractId: string }> },
) {
  try {
    const sessionUser = await getRequiredSessionUser();
    requireAdminOrManager(sessionUser);

    const { contractId: rawContractId } = await context.params;
    const contractId = parseUUIDParam(rawContractId, "contractId");
    await requireReadableContract({ contractId, sessionUser });

    const formData = await request.formData();
    const file = formData.get("file");
    const documentType = documentTypeSchema.parse(formData.get("documentType") ?? "contract");
    const notes = normalizeOptionalText(formData.get("notes"));

    if (!isFileLike(file)) {
      throw badRequest("يجب إرفاق ملف PDF صالح");
    }

    if (file.size <= 0) {
      throw badRequest("الملف المرفوع فارغ");
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw badRequest("الحد الأقصى لحجم الملف هو 20 ميجابايت");
    }

    if (!(file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))) {
      throw badRequest("يُسمح فقط برفع ملفات PDF");
    }

    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const { storagePath } = await uploadDocumentToStorage({
      contentType: file.type || "application/pdf",
      contractId,
      fileBytes,
      fileName: file.name,
    });

    try {
      const document = await createDocumentRecord({
        contentType: file.type || "application/pdf",
        contractId,
        documentType,
        fileName: file.name,
        fileSizeBytes: file.size,
        notes: notes ?? undefined,
        storagePath,
        uploadedBy: sessionUser.id,
      });

      recordAuditEvent({
        action: "contract_document.upload",
        actorId: sessionUser.id,
        entityId: document.id,
        entityType: "contract_document",
        metadata: {
          contractId,
          documentType,
          fileName: file.name,
        },
      });

      return Response.json(
        {
          createdAt: document.created_at,
          documentId: document.id,
          documentType: document.document_type,
          fileName: document.file_name,
        },
        { status: 201 },
      );
    } catch (error) {
      await deleteDocumentFromStorage(storagePath).catch(() => null);
      throw error;
    }
  } catch (error) {
    recordAuditEvent({
      action: "contract_document.upload_failed",
      severity: "warn",
      metadata: {
        error: error instanceof Error ? error.message : "unknown_error",
      },
    });

    if (isInvalidParamError(error)) {
      return Response.json({ error: { code: "invalid_param", message: "معرّف العقد غير صالح" } }, { status: 400 });
    }

    return apiErrorResponse(toApiError(error));
  }
}

function requireAdminOrManager(sessionUser: SessionUser): void {
  const isAllowed = sessionUser.roles.some(
    (assignment) => assignment.role === "admin" || assignment.role === "manager",
  );

  if (!isAllowed) {
    throw new AuthorizationError("forbidden", FORBIDDEN_MESSAGE, 403);
  }
}

function isFileLike(value: FormDataEntryValue | null): value is File {
  return Boolean(value && typeof value === "object" && "name" in value);
}

function isInvalidParamError(error: unknown): error is Error & { code: string } {
  return Boolean(error instanceof Error && (error as Error & { code?: string }).code === "INVALID_PARAM");
}

function normalizeOptionalText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}
