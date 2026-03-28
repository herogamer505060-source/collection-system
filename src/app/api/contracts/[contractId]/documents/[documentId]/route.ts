import { recordAuditEvent } from "@/lib/auth/audit-log";
import { getRequiredSessionUser, type SessionUser } from "@/lib/auth/get-session-user";
import { AuthorizationError, FORBIDDEN_MESSAGE } from "@/lib/auth/permissions";
import { apiErrorResponse, toApiError } from "@/lib/errors/api-error";
import { parseUUIDParam } from "@/lib/validation/uuid";
import {
  deleteDocumentFromStorage,
  deleteDocumentRecord,
  getDocumentById,
  getSignedDocumentUrl,
} from "@/server/repositories/document-repository";
import { requireReadableContract } from "@/server/queries/contracts/get-contract-documents";

export async function GET(
  _request: Request,
  context: { params: Promise<{ contractId: string; documentId: string }> },
) {
  try {
    const sessionUser = await getRequiredSessionUser();
    const { contractId: rawContractId, documentId: rawDocumentId } = await context.params;
    const contractId = parseUUIDParam(rawContractId, "contractId");
    const documentId = parseUUIDParam(rawDocumentId, "documentId");

    await requireReadableContract({ contractId, sessionUser });
    const document = await getDocumentById({ contractId, documentId });

    if (!document) {
      return Response.json({ error: { code: "not_found", message: "تعذر العثور على المستند المطلوب" } }, { status: 404 });
    }

    const signedUrl = await getSignedDocumentUrl(document.storage_path);

    recordAuditEvent({
      action: "contract_document.download",
      actorId: sessionUser.id,
      entityId: document.id,
      entityType: "contract_document",
      metadata: {
        contractId,
        fileName: document.file_name,
      },
    });

    return Response.json({ signedUrl });
  } catch (error) {
    if (isInvalidParamError(error)) {
      return Response.json({ error: { code: "invalid_param", message: "معرّفات المستند أو العقد غير صالحة" } }, { status: 400 });
    }

    return apiErrorResponse(toApiError(error));
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ contractId: string; documentId: string }> },
) {
  try {
    const sessionUser = await getRequiredSessionUser();
    requireAdminOrManager(sessionUser);

    const { contractId: rawContractId, documentId: rawDocumentId } = await context.params;
    const contractId = parseUUIDParam(rawContractId, "contractId");
    const documentId = parseUUIDParam(rawDocumentId, "documentId");

    await requireReadableContract({ contractId, sessionUser });
    const document = await getDocumentById({ contractId, documentId });

    if (!document) {
      return Response.json({ error: { code: "not_found", message: "تعذر العثور على المستند المطلوب" } }, { status: 404 });
    }

    await deleteDocumentFromStorage(document.storage_path);
    await deleteDocumentRecord(document.id);

    recordAuditEvent({
      action: "contract_document.delete",
      actorId: sessionUser.id,
      entityId: document.id,
      entityType: "contract_document",
      metadata: {
        contractId,
        fileName: document.file_name,
      },
    });

    return Response.json({ deleted: true });
  } catch (error) {
    recordAuditEvent({
      action: "contract_document.delete_failed",
      severity: "warn",
      metadata: {
        error: error instanceof Error ? error.message : "unknown_error",
      },
    });

    if (isInvalidParamError(error)) {
      return Response.json({ error: { code: "invalid_param", message: "معرّفات المستند أو العقد غير صالحة" } }, { status: 400 });
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

function isInvalidParamError(error: unknown): error is Error & { code: string } {
  return Boolean(error instanceof Error && (error as Error & { code?: string }).code === "INVALID_PARAM");
}
