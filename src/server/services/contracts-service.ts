import { z } from "zod";

import {
  updateContractSchema,
  type UpdateContractInput,
} from "@/features/contracts/schemas/contract-form";
import type { SessionUser } from "@/lib/auth/get-session-user";
import {
  AuthorizationError,
  FORBIDDEN_MESSAGE,
  requirePermission,
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

type UpdateContractDependencies = {
  getContractById: typeof getContractById;
  updateContractRow: typeof updateContractRow;
};

export async function updateContract(
  input: {
    contractId: string;
    payload: UpdateContractInput;
    sessionUser: SessionUser;
  },
  dependencies: UpdateContractDependencies = {
    getContractById,
    updateContractRow,
  },
): Promise<Tables<"contracts">> {
  requireAdminOrManager(input.sessionUser);
  requirePermission(input.sessionUser, "contracts.read");

  const parsed = updateContractSchema.parse(input.payload);
  const existing = await dependencies.getContractById(input.contractId);

  if (!existing) {
    throw notFound("تعذر العثور على العقد المطلوب");
  }

  const updatePayload: TablesUpdate<"contracts"> = {};

  if (parsed.collectorUserId !== undefined) {
    updatePayload.collector_user_id = parsed.collectorUserId;
  }

  if (parsed.contractNotes !== undefined) {
    updatePayload.contract_notes = parsed.contractNotes;
  }

  if (parsed.contractStatus !== undefined) {
    updatePayload.contract_status = parsed.contractStatus;
  }

  if (parsed.deliveryDate !== undefined) {
    updatePayload.delivery_date = parsed.deliveryDate;
  }

  if (Object.keys(updatePayload).length === 0) {
    return existing;
  }

  return dependencies.updateContractRow(input.contractId, updatePayload);
}

export function handleContractServiceError(error: unknown): Response {
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

async function getContractById(
  contractId: string,
  client: AdminClient = createAdminSupabaseClient(),
): Promise<Tables<"contracts"> | null> {
  const { data, error } = await client.from("contracts").select("*").eq("id", contractId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function updateContractRow(
  contractId: string,
  payload: TablesUpdate<"contracts">,
  client: AdminClient = createAdminSupabaseClient(),
): Promise<Tables<"contracts">> {
  const { data, error } = await client
    .from("contracts")
    .update(payload)
    .eq("id", contractId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "تعذر تحديث بيانات العقد");
  }

  return data;
}
