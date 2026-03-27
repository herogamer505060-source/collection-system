import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { recordAuditEvent } from "@/lib/auth/audit-log";
import { applyImportBatch } from "@/features/imports/services/apply-import-batch";
import {
  handleImportRouteError,
  requireImportManageAccess,
} from "@/features/imports/services/import-access";
import { parseUUIDParam, createParamError } from "@/lib/validation/uuid";

export async function POST(
  _request: Request,
  context: { params: Promise<{ batchId: string }> },
) {
  try {
    const sessionUser = await getRequiredSessionUser();
    requireImportManageAccess(sessionUser);
    
    const { batchId: rawBatchId } = await context.params;
    const batchId = parseUUIDParam(rawBatchId, "batchId");
    
    const result = await applyImportBatch({ actorId: sessionUser.id, batchId });

    recordAuditEvent({
      action: "import.approve",
      actorId: sessionUser.id,
      entityId: batchId,
      entityType: "import_batch",
      metadata: {
        status: result.status,
        summary: result.summary,
      },
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as { code: string }).code === "INVALID_PARAM") {
      recordAuditEvent({
        action: "import.approve_failed",
        severity: "warn",
        metadata: {
          error: error.message,
        },
      });
      return handleImportRouteError(createParamError("batchId", "Invalid batch ID format"));
    }

    recordAuditEvent({
      action: "import.approve_failed",
      severity: "warn",
      metadata: {
        error: error instanceof Error ? error.message : "unknown_error",
      },
    });
    return handleImportRouteError(error);
  }
}
