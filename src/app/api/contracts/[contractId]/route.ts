import { recordAuditEvent } from "@/lib/auth/audit-log";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import {
  handleContractServiceError,
  updateContract,
} from "@/server/services/contracts-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ contractId: string }> },
) {
  try {
    const sessionUser = await getRequiredSessionUser();
    const payload = await request.json();
    const { contractId } = await context.params;
    const contract = await updateContract({ contractId, payload, sessionUser });

    recordAuditEvent({
      action: "contract.update",
      actorId: sessionUser.id,
      entityId: contract.id,
      entityType: "contract",
      metadata: {
        fields: Object.keys(payload),
      },
    });

    return Response.json(contract);
  } catch (error) {
    recordAuditEvent({
      action: "contract.update_failed",
      severity: "warn",
      metadata: {
        error: error instanceof Error ? error.message : "unknown_error",
      },
    });

    return handleContractServiceError(error);
  }
}
