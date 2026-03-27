import { z } from "zod";

import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { recordAuditEvent } from "@/lib/auth/audit-log";
import {
  handleImportRouteError,
  requireImportManageAccess,
} from "@/features/imports/services/import-access";
import { rejectImportBatch } from "@/server/repositories/import-batch-staging-repository";

const rejectImportSchema = z.object({
  reason: z.string().trim().min(1).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ batchId: string }> },
) {
  try {
    const sessionUser = await getRequiredSessionUser();
    requireImportManageAccess(sessionUser);
    const { batchId } = await context.params;
    const payload = rejectImportSchema.parse(await request.json().catch(() => ({})));
    const batch = await rejectImportBatch({ batchId, reason: payload.reason });

    recordAuditEvent({
      action: "import.reject",
      actorId: sessionUser.id,
      entityId: batchId,
      entityType: "import_batch",
      metadata: {
        reason: payload.reason ?? null,
        status: batch.status,
      },
    });

    return Response.json({ batchId: batch.id, status: batch.status });
  } catch (error) {
    recordAuditEvent({
      action: "import.reject_failed",
      severity: "warn",
      metadata: {
        error: error instanceof Error ? error.message : "unknown_error",
      },
    });
    return handleImportRouteError(error);
  }
}
