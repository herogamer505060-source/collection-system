import { NextResponse } from "next/server";
import { z } from "zod";

import { getRequiredSessionUser, type AppRole } from "@/lib/auth/get-session-user";
import {
  AuthorizationError,
  requirePermission,
} from "@/lib/auth/permissions";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const roleSchema = z.enum(["admin", "manager", "collector", "viewer"]);

const createUserSchema = z
  .object({
    defaultProjectId: z.string().uuid().nullable().optional(),
    email: z.string().email(),
    fullName: z.string().min(1),
    role: roleSchema,
    temporaryPassword: z.string().min(8),
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

export async function POST(request: Request) {
  try {
    const sessionUser = await getRequiredSessionUser();
    requirePermission(sessionUser, "admin.users.manage");

    const payload = createUserSchema.parse(await request.json());
    const adminClient = createAdminSupabaseClient();
    const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser({
      email: payload.email,
      email_confirm: true,
      password: payload.temporaryPassword,
    });

    if (createUserError || !createdUser.user) {
      return jsonErrorResponse(
        "user_create_failed",
        createUserError?.message ?? "تعذر إنشاء المستخدم",
        400,
      );
    }

    const userId = createdUser.user.id;

    const { error: profileError } = await adminClient.from("profiles").upsert({
      default_project_id: payload.role === "admin" ? null : payload.defaultProjectId ?? null,
      email: payload.email,
      full_name: payload.fullName,
      id: userId,
      is_active: true,
    });

    if (profileError) {
      await adminClient.auth.admin.deleteUser(userId);
      return jsonErrorResponse("profile_create_failed", "تعذر حفظ ملف المستخدم", 500);
    }

    const { error: roleError } = await adminClient
      .from("user_roles")
      .insert(buildRoleRow(userId, payload.role, payload.defaultProjectId));

    if (roleError) {
      await adminClient.from("profiles").delete().eq("id", userId);
      await adminClient.auth.admin.deleteUser(userId);
      return jsonErrorResponse("role_create_failed", "تعذر حفظ صلاحية المستخدم", 500);
    }

    return NextResponse.json(
      {
        isActive: true,
        profileId: userId,
        role: payload.role,
        userId,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
