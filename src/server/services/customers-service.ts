import { z } from "zod";

import type { SessionUser } from "@/lib/auth/get-session-user";
import {
  AuthorizationError,
  FORBIDDEN_MESSAGE,
} from "@/lib/auth/permissions";
import {
  apiErrorResponse,
  invalidRequest,
  notFound,
  toApiError,
} from "@/lib/errors/api-error";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { normalizeCustomerName } from "@/features/imports/normalization/normalize-customer-name";
import {
  updateCustomerSchema,
  type UpdateCustomerInput,
} from "@/features/customers/schemas/customer-form";
import type { TablesUpdate } from "@/types/database";

export async function updateCustomer(input: {
  customerId: string;
  payload: UpdateCustomerInput;
  sessionUser: SessionUser;
}) {
  const isAdminOrManager = input.sessionUser.roles.some(
    (assignment) => assignment.role === "admin" || assignment.role === "manager",
  );

  if (!isAdminOrManager) {
    throw new AuthorizationError("forbidden", FORBIDDEN_MESSAGE, 403);
  }

  const parsed = updateCustomerSchema.parse(input.payload);
  const client = createAdminSupabaseClient();
  const { data: existing, error: existingError } = await client
    .from("customers")
    .select("*")
    .eq("id", input.customerId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (!existing) {
    throw notFound("تعذر العثور على العميل المطلوب");
  }

  const updatePayload: TablesUpdate<"customers"> = {};

  if (parsed.customerName !== undefined) {
    updatePayload.customer_name = parsed.customerName;
    updatePayload.normalized_name = normalizeCustomerName(parsed.customerName) ?? parsed.customerName;
  }

  if (parsed.mobile !== undefined) {
    updatePayload.mobile = parsed.mobile;
  }

  if (parsed.email !== undefined) {
    updatePayload.email = parsed.email;
  }

  if (parsed.nationalId !== undefined) {
    updatePayload.national_id = parsed.nationalId;
  }

  if (parsed.notes !== undefined) {
    updatePayload.notes = parsed.notes;
  }

  if (Object.keys(updatePayload).length === 0) {
    return existing;
  }

  const { data, error } = await client
    .from("customers")
    .update(updatePayload)
    .eq("id", input.customerId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "تعذر تحديث بيانات العميل");
  }

  return data;
}

export function handleCustomerServiceError(error: unknown): Response {
  if (error instanceof z.ZodError) {
    return apiErrorResponse(
      invalidRequest(error.issues[0]?.message ?? "بيانات غير صحيحة", error.flatten()),
    );
  }

  return apiErrorResponse(toApiError(error));
}
