import type { SessionUser } from "@/lib/auth/get-session-user";
import {
  AuthorizationError,
  FORBIDDEN_MESSAGE,
  requirePermission,
} from "@/lib/auth/permissions";
import { canAccessContract } from "@/lib/auth/role-scopes";
import { notFound } from "@/lib/errors/api-error";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  getDocumentsByContractId,
} from "@/server/repositories/document-repository";
import type { Tables } from "@/types/database";

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

export type ContractDocumentListItem = {
  createdAt: string;
  documentId: string;
  documentType: string;
  fileName: string;
  fileSizeBytes: number;
  notes: string | null;
  uploadedByName: string;
};

export async function requireReadableContract(
  input: { contractId: string; sessionUser: SessionUser },
  client: AdminClient = createAdminSupabaseClient(),
): Promise<Tables<"contracts">> {
  requirePermission(input.sessionUser, "contracts.read");

  const { data, error } = await client
    .from("contracts")
    .select("*")
    .eq("id", input.contractId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw notFound("تعذر العثور على العقد المطلوب");
  }

  if (
    !canAccessContract(input.sessionUser, {
      collectorUserId: data.collector_user_id,
      projectId: data.project_id,
    })
  ) {
    throw new AuthorizationError("forbidden", FORBIDDEN_MESSAGE, 403);
  }

  return data;
}

export async function getContractDocuments(
  input: { contractId: string; sessionUser: SessionUser },
  client: AdminClient = createAdminSupabaseClient(),
): Promise<ContractDocumentListItem[]> {
  await requireReadableContract(input, client);

  const documents = await getDocumentsByContractId(input.contractId, client);

  if (documents.length === 0) {
    return [];
  }

  const uploadedByIds = [...new Set(documents.map((document) => document.uploaded_by))];
  const { data: profiles, error } = await client
    .from("profiles")
    .select("id, full_name")
    .in("id", uploadedByIds);

  if (error) {
    throw new Error(error.message);
  }

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));

  return documents.map((document) => ({
    createdAt: document.created_at,
    documentId: document.id,
    documentType: document.document_type,
    fileName: document.file_name,
    fileSizeBytes: document.file_size_bytes,
    notes: document.notes,
    uploadedByName: profileById.get(document.uploaded_by) ?? document.uploaded_by,
  }));
}
