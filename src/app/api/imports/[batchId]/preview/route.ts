import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { buildImportPreview } from "@/features/imports/services/build-import-preview";
import {
  handleImportRouteError,
  requireImportManageAccess,
} from "@/features/imports/services/import-access";

export async function POST(
  _request: Request,
  context: { params: Promise<{ batchId: string }> },
) {
  try {
    const sessionUser = await getRequiredSessionUser();
    requireImportManageAccess(sessionUser);
    const { batchId } = await context.params;
    const preview = await buildImportPreview({ batchId });

    return Response.json(preview);
  } catch (error) {
    return handleImportRouteError(error);
  }
}
