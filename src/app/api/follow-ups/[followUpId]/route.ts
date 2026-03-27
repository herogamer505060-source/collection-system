import { recordAuditEvent } from "@/lib/auth/audit-log";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import {
  deleteFollowUp,
  handleFollowUpServiceError,
  updateFollowUp,
} from "@/server/services/follow-ups-service";
import { parseUUIDParam } from "@/lib/validation/uuid";

function isInvalidParam(error: unknown): boolean {
  return error instanceof Error && (error as Error & { code?: string }).code === "INVALID_PARAM";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ followUpId: string }> },
) {
  try {
    const sessionUser = await getRequiredSessionUser();
    const payload = await request.json();
    const { followUpId: rawFollowUpId } = await context.params;
    const followUpId = parseUUIDParam(rawFollowUpId, "followUpId");
    const followUp = await updateFollowUp({ followUpId, payload, sessionUser });

    recordAuditEvent({
      action: "follow_up.update",
      actorId: sessionUser.id,
      entityId: followUp.id,
      entityType: "follow_up",
      metadata: {
        followUpStatus: followUp.followUpStatus,
      },
    });

    return Response.json(followUp);
  } catch (error) {
    recordAuditEvent({
      action: "follow_up.update_failed",
      severity: "warn",
      metadata: {
        error: error instanceof Error ? error.message : "unknown_error",
      },
    });
    if (isInvalidParam(error)) {
      return Response.json({ error: { code: "invalid_param", message: "معرّف المتابعة غير صالح" } }, { status: 400 });
    }
    return handleFollowUpServiceError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ followUpId: string }> },
) {
  try {
    const sessionUser = await getRequiredSessionUser();
    const { followUpId: rawFollowUpId } = await context.params;
    const followUpId = parseUUIDParam(rawFollowUpId, "followUpId");
    const result = await deleteFollowUp({ followUpId, sessionUser });

    recordAuditEvent({
      action: "follow_up.deleted",
      actorId: sessionUser.id,
      entityId: result.id,
      entityType: "follow_up",
    });

    return Response.json({ success: true });
  } catch (error) {
    recordAuditEvent({
      action: "follow_up.delete_failed",
      severity: "warn",
      metadata: { error: error instanceof Error ? error.message : "unknown_error" },
    });
    if (isInvalidParam(error)) {
      return Response.json({ error: { code: "invalid_param", message: "معرّف المتابعة غير صالح" } }, { status: 400 });
    }
    return handleFollowUpServiceError(error);
  }
}
