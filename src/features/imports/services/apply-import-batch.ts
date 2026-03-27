import { upsertImportBatch } from "@/server/services/import-upsert-service";

export async function applyImportBatch(input: { actorId: string; batchId: string }) {
  return upsertImportBatch(input);
}
