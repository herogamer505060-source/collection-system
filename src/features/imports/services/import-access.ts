import type { SessionUser } from "@/lib/auth/get-session-user";
import { AuthorizationError, hasPermission, requirePermission } from "@/lib/auth/permissions";
import { ImportProcessingError } from "@/server/services/import-upsert-service";

export type ImportAccess = {
  canManage: boolean;
  canRead: boolean;
};

export function getImportAccess(sessionUser: SessionUser | null | undefined): ImportAccess {
  return {
    canManage: hasPermission(sessionUser, "imports.manage"),
    canRead: hasPermission(sessionUser, "imports.read"),
  };
}

export function requireImportReadAccess(sessionUser: SessionUser | null | undefined): ImportAccess {
  requirePermission(sessionUser, "imports.read");

  return getImportAccess(sessionUser);
}

export function requireImportManageAccess(sessionUser: SessionUser | null | undefined): ImportAccess {
  requirePermission(sessionUser, "imports.manage");

  return getImportAccess(sessionUser);
}

export function jsonImportErrorResponse(code: string, message: string, status: number): Response {
  return Response.json({ error: { code, message } }, { status });
}

export function handleImportRouteError(error: unknown): Response {
  if (isAuthorizationLikeError(error)) {
    return jsonImportErrorResponse(error.code, error.message, error.status);
  }

  if (error instanceof ImportProcessingError) {
    console.error("[import-processing-error]", error.code, error.message);
    return jsonImportErrorResponse(error.code, error.message, 400);
  }

  if (error instanceof Error && /not found/i.test(error.message)) {
    return jsonImportErrorResponse("not_found", "تعذر العثور على دفعة الاستيراد المطلوبة", 404);
  }

  if (error instanceof Error) {
    console.error("[import-route-error]", error.message);
    return jsonImportErrorResponse("import_failed", error.message, 400);
  }

  return jsonImportErrorResponse("internal_error", "حدث خطأ غير متوقع", 500);
}

function isAuthorizationLikeError(
  error: unknown,
): error is Pick<AuthorizationError, "code" | "message" | "status"> {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      "message" in error &&
      "status" in error &&
      (error as { code?: string }).code &&
      ((error as { code?: string }).code === "unauthenticated" ||
        (error as { code?: string }).code === "forbidden"),
  );
}
