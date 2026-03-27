import { z } from "zod";

import type { SessionUser } from "@/lib/auth/get-session-user";
import {
  apiErrorResponse,
  badRequest,
  invalidRequest,
  notFound,
  toApiError,
} from "@/lib/errors/api-error";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  type CreateFollowUpInput,
  createFollowUpSchema,
  type UpdateFollowUpInput,
  updateFollowUpSchema,
} from "@/features/follow-ups/schemas/follow-up-form";
import {
  assertCanCreateFollowUp,
  assertCanUpdateFollowUp,
} from "@/features/follow-ups/services/follow-up-permissions";
import { resolveFollowUpProjectId } from "@/server/queries/read-model-helpers";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

type CreateFollowUpDependencies = {
  getContractById: typeof getContractById;
  getCustomerById: typeof getCustomerById;
  insertFollowUp: typeof insertFollowUp;
  listContractsByCustomerId: typeof listContractsByCustomerId;
};

type UpdateFollowUpDependencies = {
  getFollowUpById: typeof getFollowUpById;
  listContractsByCustomerId: typeof listContractsByCustomerId;
  updateFollowUpRow: typeof updateFollowUpRow;
};

type DeleteFollowUpDependencies = {
  deleteFollowUpRow: typeof deleteFollowUpRow;
  getFollowUpById: typeof getFollowUpById;
  listContractsByCustomerId: typeof listContractsByCustomerId;
};

export async function createFollowUp(
  input: {
    payload: CreateFollowUpInput;
    sessionUser: SessionUser;
  },
  dependencies: CreateFollowUpDependencies = {
    getContractById,
    getCustomerById,
    insertFollowUp,
    listContractsByCustomerId,
  },
): Promise<{
  contactType: string;
  contractId: string | null;
  createdBy: string;
  customerId: string;
  followUpDate: string;
  followUpStatus: string;
  id: string;
  note: string;
}> {
  const payload = createFollowUpSchema.parse(input.payload);
  const customer = await dependencies.getCustomerById(payload.customerId);

  if (!customer) {
    throw notFound("تعذر العثور على العميل المطلوب");
  }

  const contract = payload.contractId ? await dependencies.getContractById(payload.contractId) : null;

  if (payload.contractId && !contract) {
    throw notFound("تعذر العثور على العقد المطلوب");
  }

  if (contract && contract.customer_id !== payload.customerId) {
    throw badRequest("العقد المختار غير مرتبط بهذا العميل");
  }

  const customerContracts = await dependencies.listContractsByCustomerId(payload.customerId);
  const projectId = resolveFollowUpProjectId(
    {
      contractId: contract?.id ?? null,
      customerId: payload.customerId,
      preferredProjectId: input.sessionUser.defaultProjectId,
    },
    { contracts: customerContracts },
  );

  if (!projectId && !isPrivilegedFollowUpWriter(input.sessionUser)) {
    throw badRequest("يجب اختيار عقد واضح عند إنشاء متابعة لهذا العميل");
  }

  assertCanCreateFollowUp(input.sessionUser, {
    collectorUserId: payload.collectorUserId ?? contract?.collector_user_id ?? null,
    customerId: payload.customerId,
    projectId,
  });

  const createdFollowUp = await dependencies.insertFollowUp({
    collector_user_id: payload.collectorUserId ?? contract?.collector_user_id ?? null,
    contact_type: payload.contactType,
    contract_id: contract?.id ?? null,
    created_by: input.sessionUser.id,
    customer_id: payload.customerId,
    customer_response: payload.customerResponse ?? null,
    follow_up_date: payload.followUpDate,
    next_action_date: payload.nextActionDate ?? null,
    note: payload.note,
    promise_date: payload.promisedToPay ? payload.promiseDate ?? null : null,
    promised_to_pay: payload.promisedToPay,
  });

  return {
    contactType: createdFollowUp.contact_type,
    contractId: createdFollowUp.contract_id,
    createdBy: createdFollowUp.created_by,
    customerId: createdFollowUp.customer_id,
    followUpDate: createdFollowUp.follow_up_date,
    followUpStatus: createdFollowUp.follow_up_status,
    id: createdFollowUp.id,
    note: createdFollowUp.note,
  };
}

export async function updateFollowUp(
  input: {
    followUpId: string;
    payload: UpdateFollowUpInput;
    sessionUser: SessionUser;
  },
  dependencies: UpdateFollowUpDependencies = {
    getFollowUpById,
    listContractsByCustomerId,
    updateFollowUpRow,
  },
): Promise<{
  followUpStatus: string;
  id: string;
  updatedAt: string;
}> {
  const payload = updateFollowUpSchema.parse(input.payload);
  const existingFollowUp = await dependencies.getFollowUpById(input.followUpId);

  if (!existingFollowUp) {
    throw notFound("تعذر العثور على المتابعة المطلوبة");
  }

  const customerContracts = await dependencies.listContractsByCustomerId(existingFollowUp.customer_id);
  const projectId = resolveFollowUpProjectId(
    {
      contractId: existingFollowUp.contract_id,
      customerId: existingFollowUp.customer_id,
      preferredProjectId: input.sessionUser.defaultProjectId,
    },
    { contracts: customerContracts },
  );

  assertCanUpdateFollowUp(input.sessionUser, {
    collectorUserId: payload.collectorUserId ?? existingFollowUp.collector_user_id,
    createdBy: existingFollowUp.created_by,
    customerId: existingFollowUp.customer_id,
    projectId,
  });

  const updatedFollowUp = await dependencies.updateFollowUpRow(input.followUpId, {
    collector_user_id: payload.collectorUserId ?? existingFollowUp.collector_user_id,
    customer_response:
      payload.customerResponse === undefined ? existingFollowUp.customer_response : payload.customerResponse,
    follow_up_status: payload.followUpStatus ?? existingFollowUp.follow_up_status,
    next_action_date:
      payload.nextActionDate === undefined ? existingFollowUp.next_action_date : payload.nextActionDate,
    note: payload.note ?? existingFollowUp.note,
    promise_date:
      payload.promisedToPay === false
        ? null
        : payload.promiseDate === undefined
          ? existingFollowUp.promise_date
          : payload.promiseDate,
    promised_to_pay: payload.promisedToPay ?? existingFollowUp.promised_to_pay,
  });

  return {
    followUpStatus: updatedFollowUp.follow_up_status,
    id: updatedFollowUp.id,
    updatedAt: updatedFollowUp.updated_at,
  };
}

export async function deleteFollowUp(
  input: {
    followUpId: string;
    sessionUser: SessionUser;
  },
  dependencies: DeleteFollowUpDependencies = {
    deleteFollowUpRow,
    getFollowUpById,
    listContractsByCustomerId,
  },
): Promise<{ id: string }> {
  const existingFollowUp = await dependencies.getFollowUpById(input.followUpId);

  if (!existingFollowUp) {
    throw notFound("تعذر العثور على المتابعة المطلوبة");
  }

  const customerContracts = await dependencies.listContractsByCustomerId(existingFollowUp.customer_id);
  const projectId = resolveFollowUpProjectId(
    {
      contractId: existingFollowUp.contract_id,
      customerId: existingFollowUp.customer_id,
      preferredProjectId: input.sessionUser.defaultProjectId,
    },
    { contracts: customerContracts },
  );

  assertCanUpdateFollowUp(input.sessionUser, {
    collectorUserId: existingFollowUp.collector_user_id,
    createdBy: existingFollowUp.created_by,
    customerId: existingFollowUp.customer_id,
    projectId,
  });

  await dependencies.deleteFollowUpRow(input.followUpId);

  return { id: input.followUpId };
}

export function handleFollowUpServiceError(error: unknown): Response {
  if (error instanceof z.ZodError) {
    return apiErrorResponse(
      invalidRequest(error.issues[0]?.message ?? "بيانات الطلب غير صحيحة", error.flatten()),
    );
  }

  return apiErrorResponse(toApiError(error));
}

function isPrivilegedFollowUpWriter(sessionUser: SessionUser): boolean {
  return sessionUser.roles.some((assignment) => assignment.role === "admin" || assignment.role === "manager");
}

async function getCustomerById(
  customerId: string,
  client: AdminClient = createAdminSupabaseClient(),
): Promise<Tables<"customers"> | null> {
  const { data, error } = await client.from("customers").select("*").eq("id", customerId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
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

async function listContractsByCustomerId(
  customerId: string,
  client: AdminClient = createAdminSupabaseClient(),
): Promise<Tables<"contracts">[]> {
  const { data, error } = await client.from("contracts").select("*").eq("customer_id", customerId);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function getFollowUpById(
  followUpId: string,
  client: AdminClient = createAdminSupabaseClient(),
): Promise<Tables<"follow_ups"> | null> {
  const { data, error } = await client.from("follow_ups").select("*").eq("id", followUpId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function insertFollowUp(
  payload: TablesInsert<"follow_ups">,
  client: AdminClient = createAdminSupabaseClient(),
): Promise<Tables<"follow_ups">> {
  const { data, error } = await client.from("follow_ups").insert(payload).select("*").single();

  if (error || !data) {
    throw new Error(error?.message ?? "تعذر حفظ المتابعة الجديدة");
  }

  return data;
}

async function updateFollowUpRow(
  followUpId: string,
  payload: TablesUpdate<"follow_ups">,
  client: AdminClient = createAdminSupabaseClient(),
): Promise<Tables<"follow_ups">> {
  const { data, error } = await client
    .from("follow_ups")
    .update(payload)
    .eq("id", followUpId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "تعذر تحديث المتابعة");
  }

  return data;
}

async function deleteFollowUpRow(
  followUpId: string,
  client: AdminClient = createAdminSupabaseClient(),
): Promise<void> {
  const { error } = await client.from("follow_ups").delete().eq("id", followUpId);

  if (error) {
    throw new Error(error.message);
  }
}
