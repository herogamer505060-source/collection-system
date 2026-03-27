import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import {
  handleImportRouteError,
  requireImportReadAccess,
} from "@/features/imports/services/import-access";
import { getImportBatchDetail } from "@/server/queries/imports/get-import-batch-detail";

export async function GET(
  _request: Request,
  context: { params: Promise<{ batchId: string }> },
) {
  try {
    const sessionUser = await getRequiredSessionUser();
    requireImportReadAccess(sessionUser);
    const { batchId } = await context.params;
    const detail = await getImportBatchDetail({ batchId });

    return Response.json(detail);
  } catch (error) {
    return handleImportRouteError(error);
  }
}
