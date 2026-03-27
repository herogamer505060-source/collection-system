import { z } from "zod";

import { deriveDelayBucket } from "@/features/installments/derive-delay-bucket";
import { deriveDelayDays } from "@/features/installments/derive-delay-days";
import { derivePaymentStatus } from "@/features/installments/derive-payment-status";
import {
  updateInstallmentSchema,
  type UpdateInstallmentInput,
} from "@/features/installments/schemas/installment-form";
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
import type { Tables, TablesUpdate } from "@/types/database";

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

type UpdateInstallmentDependencies = {
  getInstallmentById: typeof getInstallmentById;
  updateInstallmentRow: typeof updateInstallmentRow;
};

export async function updateInstallment(
  input: {
    installmentId: string;
    payload: UpdateInstallmentInput;
    sessionUser: SessionUser;
  },
  dependencies: UpdateInstallmentDependencies = {
    getInstallmentById,
    updateInstallmentRow,
  },
): Promise<Tables<"installments">> {
  requireAdminOrManager(input.sessionUser);

  const parsed = updateInstallmentSchema.parse(input.payload);
  const existing = await dependencies.getInstallmentById(input.installmentId);

  if (!existing) {
    throw notFound("تعذر العثور على القسط المطلوب");
  }

  const amountCollected = parsed.amountCollected ?? existing.amount_collected;
  const amountOutstanding = Math.max(0, existing.amount_due - amountCollected);
  const statusInput = {
    amountCollected,
    amountDue: existing.amount_due,
    amountOutstanding,
    dueDate: existing.due_date,
  };
  const paymentStatus = derivePaymentStatus(statusInput);
  const delayDays = deriveDelayDays(statusInput);
  const delayBucket = deriveDelayBucket(delayDays);

  const updatePayload: TablesUpdate<"installments"> = {
    amount_collected: amountCollected,
    amount_outstanding: amountOutstanding,
    delay_bucket: delayBucket,
    delay_days: delayDays,
    payment_date: parsed.paymentDate === undefined ? existing.payment_date : parsed.paymentDate,
    payment_status: paymentStatus,
    penalty_amount:
      parsed.penaltyAmount === undefined ? existing.penalty_amount : (parsed.penaltyAmount ?? 0),
    receipt_reference:
      parsed.receiptReference === undefined ? existing.receipt_reference : parsed.receiptReference,
  };

  return dependencies.updateInstallmentRow(input.installmentId, updatePayload);
}

export function handleInstallmentServiceError(error: unknown): Response {
  if (error instanceof z.ZodError) {
    return apiErrorResponse(
      invalidRequest(error.issues[0]?.message ?? "بيانات الطلب غير صحيحة", error.flatten()),
    );
  }

  return apiErrorResponse(toApiError(error));
}

function requireAdminOrManager(sessionUser: SessionUser): void {
  const isAllowed = sessionUser.roles.some(
    (assignment) => assignment.role === "admin" || assignment.role === "manager",
  );

  if (!isAllowed) {
    throw new AuthorizationError("forbidden", FORBIDDEN_MESSAGE, 403);
  }
}

async function getInstallmentById(
  installmentId: string,
  client: AdminClient = createAdminSupabaseClient(),
): Promise<Tables<"installments"> | null> {
  const { data, error } = await client.from("installments").select("*").eq("id", installmentId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function updateInstallmentRow(
  installmentId: string,
  payload: TablesUpdate<"installments">,
  client: AdminClient = createAdminSupabaseClient(),
): Promise<Tables<"installments">> {
  const { data, error } = await client
    .from("installments")
    .update(payload)
    .eq("id", installmentId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "تعذر تحديث بيانات القسط");
  }

  return data;
}
