import { randomUUID } from "node:crypto";
import path from "node:path";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getServerEnv } from "@/lib/supabase/env";
import type { Tables, TablesInsert } from "@/types/database";

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

export async function uploadDocumentToStorage(
  input: {
    contentType: string;
    contractId: string;
    fileBytes: Uint8Array;
    fileName: string;
  },
  client: AdminClient = createAdminSupabaseClient(),
): Promise<{ storagePath: string }> {
  const env = getServerEnv();
  const extension = path.extname(input.fileName) || ".pdf";
  const storagePath = `${input.contractId}/${Date.now()}-${randomUUID()}${extension}`;
  const { error } = await client.storage.from(env.DOCUMENTS_BUCKET).upload(storagePath, input.fileBytes, {
    contentType: input.contentType,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { storagePath };
}

export async function createDocumentRecord(
  input: {
    contentType: string;
    contractId: string;
    documentType: string;
    fileName: string;
    fileSizeBytes: number;
    notes?: string;
    storagePath: string;
    uploadedBy: string;
  },
  client: AdminClient = createAdminSupabaseClient(),
): Promise<Tables<"contract_documents">> {
  const payload: TablesInsert<"contract_documents"> = {
    content_type: input.contentType,
    contract_id: input.contractId,
    document_type: input.documentType,
    file_name: input.fileName,
    file_size_bytes: input.fileSizeBytes,
    notes: input.notes ?? null,
    storage_path: input.storagePath,
    uploaded_by: input.uploadedBy,
  };
  const { data, error } = await client
    .from("contract_documents")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create document record.");
  }

  return data;
}

export async function getDocumentsByContractId(
  contractId: string,
  client: AdminClient = createAdminSupabaseClient(),
): Promise<Tables<"contract_documents">[]> {
  const { data, error } = await client
    .from("contract_documents")
    .select("*")
    .eq("contract_id", contractId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getDocumentById(
  input: { contractId?: string; documentId: string },
  client: AdminClient = createAdminSupabaseClient(),
): Promise<Tables<"contract_documents"> | null> {
  let query = client.from("contract_documents").select("*").eq("id", input.documentId);

  if (input.contractId) {
    query = query.eq("contract_id", input.contractId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getSignedDocumentUrl(
  storagePath: string,
  expiresIn = 300,
  client: AdminClient = createAdminSupabaseClient(),
): Promise<string> {
  const env = getServerEnv();
  const { data, error } = await client.storage
    .from(env.DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create signed URL.");
  }

  return data.signedUrl;
}

export async function deleteDocumentFromStorage(
  storagePath: string,
  client: AdminClient = createAdminSupabaseClient(),
): Promise<void> {
  const env = getServerEnv();
  const { error } = await client.storage.from(env.DOCUMENTS_BUCKET).remove([storagePath]);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteDocumentRecord(
  documentId: string,
  client: AdminClient = createAdminSupabaseClient(),
): Promise<void> {
  const { error } = await client.from("contract_documents").delete().eq("id", documentId);

  if (error) {
    throw new Error(error.message);
  }
}
