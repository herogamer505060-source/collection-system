import { recordAuditEvent } from "@/lib/auth/audit-log";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import {
  handleInstallmentServiceError,
  updateInstallment,
} from "@/server/services/installments-service";
import { parseUUIDParam } from "@/lib/validation/uuid";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ installmentId: string }> },
) {
  try {
    const sessionUser = await getRequiredSessionUser();
    const payload = await request.json();
    const { installmentId: rawInstallmentId } = await context.params;
    const installmentId = parseUUIDParam(rawInstallmentId, "installmentId");
    const result = await updateInstallment({ installmentId, payload, sessionUser });

    recordAuditEvent({
      action: "installment.update",
      actorId: sessionUser.id,
      entityId: result.id,
      entityType: "installment",
    });

    return Response.json(result);
  } catch (error) {
    recordAuditEvent({
      action: "installment.update_failed",
      severity: "warn",
      metadata: {
        error: error instanceof Error ? error.message : "unknown_error",
      },
    });

    if (error instanceof Error && (error as Error & { code?: string }).code === "INVALID_PARAM") {
      return Response.json({ error: { code: "invalid_param", message: "معرّف القسط غير صالح" } }, { status: 400 });
    }
    return handleInstallmentServiceError(error);
  }
}
