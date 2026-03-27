import { NextResponse } from "next/server";
import { z } from "zod";

import { getRequiredSessionUser, type AppRole } from "@/lib/auth/get-session-user";
import {
  AuthorizationError,
  requirePermission,
} from "@/lib/auth/permissions";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const updateUserSchema = z
  .object({
    defaultProjectId: z.string().uuid().nullable().optional(),
    isActive: z.boolean(),
    role: z.enum(["admin", "manager", "collector", "viewer"]),
  })
  .superRefine((value, context) => {
    if (value.role !== "admin" && !value.defaultProjectId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "يجب تحديد مشروع افتراضي لهذا الدور",
        path: ["defaultProjectId"],
      });
    }
  });

function buildRoleRow(userId: string, role: AppRole, defaultProjectId: string | null | undefined) {
  return {
    project_id: role === "admin" ? null : defaultProjectId ?? null,
    role,
    user_id: userId,
  };
}

function jsonErrorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function handleRouteError(error: unknown) {
  if (error instanceof AuthorizationError) {
    return jsonErrorResponse(error.code, error.message, error.status);
  }

  if (error instanceof z.ZodError) {
    return jsonErrorResponse("invalid_request", error.issues[0]?.message ?? "بيانات الطلب غير صحيحة", 400);
  }

  return jsonErrorResponse("internal_error", "حدث خطأ غير متوقع", 500);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const sessionUser = await getRequiredSessionUser();
    requirePermission(sessionUser, "admin.users.manage");

    const payload = updateUserSchema.parse(await request.json());
    const { userId } = await context.params;
    const adminClient = createAdminSupabaseClient();

    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        default_project_id: payload.role === "admin" ? null : payload.defaultProjectId ?? null,
        is_active: payload.isActive,
      })
      .eq("id", userId);

    if (profileError) {
      return jsonErrorResponse("profile_update_failed", "تعذر تحديث بيانات المستخدم", 500);
    }

    const { error: deleteRolesError } = await adminClient.from("user_roles").delete().eq("user_id", userId);

    if (deleteRolesError) {
      return jsonErrorResponse("role_update_failed", "تعذر تحديث الصلاحيات الحالية", 500);
    }

    const { error: insertRoleError } = await adminClient
      .from("user_roles")
      .insert(buildRoleRow(userId, payload.role, payload.defaultProjectId));

    if (insertRoleError) {
      return jsonErrorResponse("role_update_failed", "تعذر حفظ الصلاحية الجديدة", 500);
    }

    return NextResponse.json({ isActive: payload.isActive, role: payload.role, userId });
  } catch (error) {
    return handleRouteError(error);
  }
}
