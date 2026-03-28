import { recordAuditEvent } from "@/lib/auth/audit-log";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import {
  deleteFollowUp,
  handleFollowUpServiceError,
  updateFollowUp,
} from "@/server/services/follow-ups-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ followUpId: string }> },
) {
  try {
    const sessionUser = await getRequiredSessionUser();
    const payload = await request.json();
    const { followUpId } = await context.params;

    if (!followUpId?.trim()) {
      return Response.json({ error: { code: "invalid_param", message: "معرّف المتابعة غير صالح" } }, { status: 400 });
    }

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
    return handleFollowUpServiceError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ followUpId: string }> },
) {
  try {
    const sessionUser = await getRequiredSessionUser();
    const { followUpId } = await context.params;

    if (!followUpId?.trim()) {
      return Response.json({ error: { code: "invalid_param", message: "معرّف المتابعة غير صالح" } }, { status: 400 });
    }

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
    return handleFollowUpServiceError(error);
  }
}
