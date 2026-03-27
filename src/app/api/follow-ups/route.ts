import { recordAuditEvent } from "@/lib/auth/audit-log";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { createFollowUp, handleFollowUpServiceError } from "@/server/services/follow-ups-service";

export async function POST(request: Request) {
  try {
    const sessionUser = await getRequiredSessionUser();
    const payload = await request.json();
    const followUp = await createFollowUp({ payload, sessionUser });

    recordAuditEvent({
      action: "follow_up.create",
      actorId: sessionUser.id,
      entityId: followUp.id,
      entityType: "follow_up",
      metadata: {
        contractId: followUp.contractId,
        customerId: followUp.customerId,
      },
    });

    return Response.json(followUp, { status: 201 });
  } catch (error) {
    recordAuditEvent({
      action: "follow_up.create_failed",
      severity: "warn",
      metadata: {
        error: error instanceof Error ? error.message : "unknown_error",
      },
    });
    return handleFollowUpServiceError(error);
  }
}
