import { z } from "zod";

import { EXPORT_TYPES } from "@/features/exports/column-definitions";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { requirePermission } from "@/lib/auth/permissions";
import { apiErrorResponse, invalidRequest, toApiError } from "@/lib/errors/api-error";
import { getExportDataset } from "@/server/queries/exports/get-export-dataset";

const exportDataRequestSchema = z.object({
  filters: z.record(z.string(), z.string()).optional(),
  type: z.enum(EXPORT_TYPES),
});

export async function POST(request: Request) {
  try {
    const sessionUser = await getRequiredSessionUser();
    requirePermission(sessionUser, "reports.read");
    const payload = exportDataRequestSchema.parse(await request.json());
    const dataset = await getExportDataset({
      filters: payload.filters ?? {},
      sessionUser,
      type: payload.type,
    });

    return Response.json(dataset);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiErrorResponse(
        invalidRequest(error.issues[0]?.message ?? "بيانات التقرير غير صحيحة", error.flatten()),
      );
    }

    return apiErrorResponse(toApiError(error));
  }
}
