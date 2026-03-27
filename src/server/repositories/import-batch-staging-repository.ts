import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type {
  ImportBatchStagingData,
  ImportMatchingContext,
  MappedImportIssue,
} from "@/features/imports/types";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

export async function getImportBatchById(
  batchId: string,
  client: AdminClient = createAdminSupabaseClient(),
): Promise<Tables<"import_batches"> | null> {
  const { data, error } = await client.from("import_batches").select("*").eq("id", batchId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getImportBatchWithFiles(
  batchId: string,
  client: AdminClient = createAdminSupabaseClient(),
): Promise<{ batch: Tables<"import_batches">; files: Tables<"import_files">[] } | null> {
  const batch = await getImportBatchById(batchId, client);

  if (!batch) {
    return null;
  }

  const { data: files, error: filesError } = await client
    .from("import_files")
    .select("*")
    .eq("batch_id", batchId)
    .order("created_at", { ascending: true });

  if (filesError) {
    throw new Error(filesError.message);
  }

  return {
    batch,
    files: files ?? [],
  };
}

export async function listRecentImportBatches(
  limit = 12,
  client: AdminClient = createAdminSupabaseClient(),
): Promise<Tables<"import_batches">[]> {
  const { data, error } = await client
    .from("import_batches")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function updateImportFilePreviewMetadata(
  input: {
    detectedColumns: string[];
    fileId: string;
    headerRowNumber: number;
    rawRowsCount: number;
    rejectedRowsCount: number;
    sheetName: string;
    validRowsCount: number;
  },
  client: AdminClient = createAdminSupabaseClient(),
): Promise<Tables<"import_files">> {
  const payload: TablesUpdate<"import_files"> = {
    detected_columns: input.detectedColumns,
    header_row_number: input.headerRowNumber,
    raw_rows_count: input.rawRowsCount,
    rejected_rows_count: input.rejectedRowsCount,
    sheet_name: input.sheetName,
    valid_rows_count: input.validRowsCount,
  };
  const { data, error } = await client
    .from("import_files")
    .update(payload)
    .eq("id", input.fileId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update import file metadata.");
  }

  return data;
}

export async function replaceImportIssues(
  input: {
    batchId: string;
    importFileId: string;
    issues: MappedImportIssue[];
  },
  client: AdminClient = createAdminSupabaseClient(),
): Promise<Tables<"import_issues">[]> {
  const { error: deleteError } = await client.from("import_issues").delete().eq("batch_id", input.batchId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (input.issues.length === 0) {
    return [];
  }

  const rows: TablesInsert<"import_issues">[] = input.issues.map((issue) => ({
    batch_id: input.batchId,
    import_file_id: input.importFileId,
    issue_type: issue.issueType,
    message_ar: issue.messageAr,
    payload: issue.payload ?? null,
    raw_value: issue.rawValue ?? null,
    severity: issue.severity,
    source_row_number: issue.sourceRowNumber ?? null,
  }));
  const { data, error } = await client.from("import_issues").insert(rows).select("*");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function saveImportBatchStaging(
  input: {
    batchId: string;
    issueCount: number;
    stagingData: ImportBatchStagingData;
  },
  client: AdminClient = createAdminSupabaseClient(),
): Promise<Tables<"import_batches">> {
  const payload: TablesUpdate<"import_batches"> = {
    issue_count: input.issueCount,
    previewed_at: new Date().toISOString(),
    rows_skipped: input.stagingData.counts.blockedRows + input.stagingData.counts.skippedRows,
    rows_total: input.stagingData.counts.totalRows,
    rows_valid: input.stagingData.counts.validRows,
    status: "ready_for_review",
    summary_json: input.stagingData,
  };
  const { data, error } = await client
    .from("import_batches")
    .update(payload)
    .eq("id", input.batchId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save import batch staging data.");
  }

  return data;
}

export async function getImportBatchStaging(
  batchId: string,
  client: AdminClient = createAdminSupabaseClient(),
): Promise<{ batch: Tables<"import_batches">; stagingData: ImportBatchStagingData | null } | null> {
  const batch = await getImportBatchById(batchId, client);

  if (!batch) {
    return null;
  }

  return {
    batch,
    stagingData: isImportBatchStagingData(batch.summary_json) ? batch.summary_json : null,
  };
}

export async function loadImportMatchingContext(
  input: {
    projectCodes: string[];
  },
  client: AdminClient = createAdminSupabaseClient(),
): Promise<ImportMatchingContext> {
  const projects = await selectWhereIn(client, "projects", "project_code", input.projectCodes);
  const projectIds = projects.map((project) => project.id);
  const [customerIdentities, contracts, units] = await Promise.all([
    selectWhereIn(client, "customer_project_identities", "project_id", projectIds),
    selectWhereIn(client, "contracts", "project_id", projectIds),
    selectWhereIn(client, "units", "project_id", projectIds),
  ]);
  const contractIds = contracts.map((contract) => contract.id);
  const installments = await selectWhereIn(client, "installments", "contract_id", contractIds);
  const contractUnits = await selectWhereIn(client, "contract_units", "contract_id", contractIds);

  return {
    contractUnits,
    contracts,
    customerIdentities,
    installments,
    projects,
    units,
  };
}

export async function listImportIssuesByBatchId(
  batchId: string,
  client: AdminClient = createAdminSupabaseClient(),
): Promise<Tables<"import_issues">[]> {
  const { data, error } = await client
    .from("import_issues")
    .select("*")
    .eq("batch_id", batchId)
    .order("source_row_number", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function rejectImportBatch(
  input: { batchId: string; reason?: string },
  client: AdminClient = createAdminSupabaseClient(),
): Promise<Tables<"import_batches">> {
  const payload: TablesUpdate<"import_batches"> = {
    error_log: input.reason ? { rejectionReason: input.reason } : null,
    finished_at: new Date().toISOString(),
    status: "rejected",
  };
  const { data, error } = await client
    .from("import_batches")
    .update(payload)
    .eq("id", input.batchId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to reject import batch.");
  }

  return data;
}

function isImportBatchStagingData(value: unknown): value is ImportBatchStagingData {
  return Boolean(value && typeof value === "object" && "stagedRows" in value && "counts" in value);
}

async function selectWhereIn<TableName extends keyof PickImportTables>(
  client: AdminClient,
  tableName: TableName,
  column: string,
  values: string[],
): Promise<PickImportTables[TableName][]> {
  if (values.length === 0) {
    return [];
  }

  const { data, error } = await client.from(tableName as never).select("*").in(column, values as never);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as PickImportTables[TableName][];
}

type PickImportTables = {
  contract_units: Tables<"contract_units">;
  contracts: Tables<"contracts">;
  customer_project_identities: Tables<"customer_project_identities">;
  installments: Tables<"installments">;
  projects: Tables<"projects">;
  units: Tables<"units">;
};
