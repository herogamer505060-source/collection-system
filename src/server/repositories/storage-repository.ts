import { randomUUID } from "node:crypto";
import path from "node:path";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getServerEnv } from "@/lib/supabase/env";
import type { ImportBatchType, ImportSourceType } from "@/features/imports/types";
import type { Tables, TablesInsert } from "@/types/database";

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

export type CreateImportBatchRecordInput = {
  actorId: string;
  batchType: ImportBatchType;
};

export type CreateImportFileRecordInput = {
  batchId: string;
  fileName: string;
  sourceType: ImportSourceType;
  storagePath: string;
};

export async function createImportBatchRecord(
  input: CreateImportBatchRecordInput,
  client: AdminClient = createAdminSupabaseClient(),
): Promise<Tables<"import_batches">> {
  const payload: TablesInsert<"import_batches"> = {
    batch_type: input.batchType,
    created_by: input.actorId,
    status: "uploaded",
  };
  const { data, error } = await client.from("import_batches").insert(payload).select("*").single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create import batch record.");
  }

  return data;
}

export async function createImportFileRecord(
  input: CreateImportFileRecordInput,
  client: AdminClient = createAdminSupabaseClient(),
): Promise<Tables<"import_files">> {
  const payload: TablesInsert<"import_files"> = {
    batch_id: input.batchId,
    file_name: input.fileName,
    source_type: input.sourceType,
    storage_path: input.storagePath,
  };
  const { data, error } = await client.from("import_files").insert(payload).select("*").single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create import file record.");
  }

  return data;
}

export async function getImportFileByBatchId(
  batchId: string,
  client: AdminClient = createAdminSupabaseClient(),
): Promise<Tables<"import_files"> | null> {
  const { data, error } = await client
    .from("import_files")
    .select("*")
    .eq("batch_id", batchId)
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function uploadFileToImportStorage(
  input: {
    batchId: string;
    contentType: string;
    fileBytes: Uint8Array;
    fileName: string;
  },
  client: AdminClient = createAdminSupabaseClient(),
): Promise<{ storagePath: string }> {
  const env = getServerEnv();
  const extension = path.extname(input.fileName) || ".xlsx";
  const storagePath = `${input.batchId}/${Date.now()}-${randomUUID()}${extension}`;
  const { error } = await client.storage.from(env.IMPORTS_BUCKET).upload(storagePath, input.fileBytes, {
    contentType: input.contentType,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { storagePath };
}

export async function downloadFileFromImportStorage(
  storagePath: string,
  client: AdminClient = createAdminSupabaseClient(),
): Promise<Uint8Array> {
  const env = getServerEnv();
  const { data, error } = await client.storage.from(env.IMPORTS_BUCKET).download(storagePath);

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to download import file.");
  }

  return new Uint8Array(await data.arrayBuffer());
}

export function getSourceTypeForBatchType(batchType: ImportBatchType): ImportSourceType {
  switch (batchType) {
    case "installments":
      return "installments_report";
    case "sold_units":
      return "sold_units_report";
    case "available_units":
      return "available_units_report";
  }
}
