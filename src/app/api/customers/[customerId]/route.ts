import { recordAuditEvent } from "@/lib/auth/audit-log";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import {
  handleCustomerServiceError,
  updateCustomer,
} from "@/server/services/customers-service";
import { parseUUIDParam } from "@/lib/validation/uuid";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ customerId: string }> },
) {
  try {
    const sessionUser = await getRequiredSessionUser();
    const payload = await request.json();
    const { customerId: rawCustomerId } = await context.params;
    const customerId = parseUUIDParam(rawCustomerId, "customerId");
    const customer = await updateCustomer({ customerId, payload, sessionUser });

    recordAuditEvent({
      action: "customer.update",
      actorId: sessionUser.id,
      entityId: customerId,
      entityType: "customer",
      metadata: {
        fields: Object.keys(payload),
      },
    });

    return Response.json(customer);
  } catch (error) {
    if (error instanceof Error && (error as Error & { code?: string }).code === "INVALID_PARAM") {
      return Response.json({ error: { code: "invalid_param", message: "معرّف العميل غير صالح" } }, { status: 400 });
    }
    return handleCustomerServiceError(error);
  }
}
