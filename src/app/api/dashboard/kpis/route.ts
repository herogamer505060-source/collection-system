import { recordAuditEvent } from "@/lib/auth/audit-log";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { apiErrorResponse, toApiError } from "@/lib/errors/api-error";
import { getDashboardKpis } from "@/server/queries/dashboard/get-dashboard-kpis";

export async function GET(request: Request) {
  try {
    const sessionUser = await getRequiredSessionUser();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") ?? undefined;
    const payload = await getDashboardKpis({ projectId, sessionUser });

    return Response.json(payload);
  } catch (error) {
    const apiError = toApiError(error);

    recordAuditEvent({
      action: "dashboard.kpis_failed",
      severity: "warn",
      metadata: {
        code: apiError.code,
        message: apiError.message,
      },
    });

    return apiErrorResponse(apiError);
  }
}
