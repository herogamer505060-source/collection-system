import { z } from "zod";

import { EXPORT_TYPES } from "@/features/exports/column-definitions";
import { generateCsv } from "@/features/exports/csv-exporter";
import { generateExcel } from "@/features/exports/excel-exporter";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { requirePermission } from "@/lib/auth/permissions";
import { apiErrorResponse, invalidRequest, toApiError } from "@/lib/errors/api-error";
import { getExportDataset } from "@/server/queries/exports/get-export-dataset";

const exportRequestSchema = z.object({
  filters: z.record(z.string(), z.string()).optional(),
  format: z.enum(["xlsx", "csv"]),
  type: z.enum(EXPORT_TYPES),
});

export async function POST(request: Request) {
  try {
    const sessionUser = await getRequiredSessionUser();
    requirePermission(sessionUser, "reports.read");
    const payload = exportRequestSchema.parse(await request.json());
    const dataset = await getExportDataset({
      filters: payload.filters ?? {},
      sessionUser,
      type: payload.type,
    });
    const fileName = `${dataset.fileNameBase}.${payload.format}`;

    if (payload.format === "xlsx") {
      const buffer = await generateExcel(dataset.columns, dataset.rows, dataset.title);

      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    }

    const csv = generateCsv(dataset.columns, dataset.rows);

    return new Response(csv, {
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiErrorResponse(
        invalidRequest(error.issues[0]?.message ?? "بيانات التصدير غير صحيحة", error.flatten()),
      );
    }

    return apiErrorResponse(toApiError(error));
  }
}
