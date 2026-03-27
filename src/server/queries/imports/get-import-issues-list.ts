import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { ImportBatchType, ImportIssueSeverity, ImportIssueType } from "@/features/imports/types";
import type { Tables } from "@/types/database";

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

export type ImportIssueListFilters = {
  batchId?: string;
  issueType?: string;
  severity?: string;
};

export type ImportIssueListItem = {
  batchId: string;
  batchStatus: string;
  batchType: ImportBatchType;
  fileName: string | null;
  id: string;
  issueType: ImportIssueType;
  messageAr: string;
  rawValue: string | null;
  severity: ImportIssueSeverity;
  sourceRowNumber: number | null;
};

export type ImportIssueListResult = {
  batchOptions: Array<{
    id: string;
    label: string;
    status: string;
    type: ImportBatchType;
  }>;
  filters: {
    batchId: string | null;
    issueType: string | null;
    severity: string | null;
  };
  issueTypeOptions: ImportIssueType[];
  issues: ImportIssueListItem[];
  severityOptions: ImportIssueSeverity[];
};

export async function getImportIssuesList(
  filters: ImportIssueListFilters = {},
  client: AdminClient = createAdminSupabaseClient(),
): Promise<ImportIssueListResult> {
  let issueQuery = client.from("import_issues").select("*").order("created_at", { ascending: false });

  if (filters.batchId) {
    issueQuery = issueQuery.eq("batch_id", filters.batchId);
  }

  if (filters.severity) {
    issueQuery = issueQuery.eq("severity", filters.severity);
  }

  if (filters.issueType) {
    issueQuery = issueQuery.eq("issue_type", filters.issueType);
  }

  const [{ data: filteredIssues, error: issuesError }, { data: allIssues, error: allIssuesError }, { data: batches, error: batchesError }, { data: files, error: filesError }] =
    await Promise.all([
      issueQuery,
      client.from("import_issues").select("issue_type"),
      client.from("import_batches").select("id, batch_type, status, started_at").order("started_at", { ascending: false }),
      client.from("import_files").select("batch_id, file_name, created_at").order("created_at", { ascending: false }),
    ]);

  if (issuesError || allIssuesError || batchesError || filesError) {
    throw new Error(
      issuesError?.message ?? allIssuesError?.message ?? batchesError?.message ?? filesError?.message ?? "Failed to load import issues.",
    );
  }

  const batchById = new Map((batches ?? []).map((batch) => [batch.id, batch]));
  const fileNameByBatchId = new Map<string, string>();

  for (const file of files ?? []) {
    if (!fileNameByBatchId.has(file.batch_id)) {
      fileNameByBatchId.set(file.batch_id, file.file_name);
    }
  }

  return {
    batchOptions: (batches ?? []).map((batch) => ({
      id: batch.id,
      label: `${getBatchTypeLabel(batch.batch_type)} - ${batch.id.slice(0, 8)}`,
      status: batch.status,
      type: batch.batch_type as ImportBatchType,
    })),
    filters: {
      batchId: filters.batchId ?? null,
      issueType: filters.issueType ?? null,
      severity: filters.severity ?? null,
    },
    issueTypeOptions: Array.from(new Set((allIssues ?? []).map((issue) => issue.issue_type as ImportIssueType))).sort(),
    issues: (filteredIssues ?? []).map((issue) => mapIssueRow(issue, batchById.get(issue.batch_id), fileNameByBatchId.get(issue.batch_id))),
    severityOptions: ["high", "medium", "low"],
  };
}

function mapIssueRow(
  issue: Tables<"import_issues">,
  batch: Pick<Tables<"import_batches">, "batch_type" | "status"> | undefined,
  fileName: string | undefined,
): ImportIssueListItem {
  return {
    batchId: issue.batch_id,
    batchStatus: batch?.status ?? "unknown",
    batchType: (batch?.batch_type ?? "installments") as ImportBatchType,
    fileName: fileName ?? null,
    id: issue.id,
    issueType: issue.issue_type as ImportIssueType,
    messageAr: issue.message_ar,
    rawValue: issue.raw_value,
    severity: issue.severity as ImportIssueSeverity,
    sourceRowNumber: issue.source_row_number,
  };
}

function getBatchTypeLabel(batchType: string): string {
  switch (batchType) {
    case "installments":
      return "ملف الأقساط";
    case "sold_units":
      return "الوحدات المباعة";
    case "available_units":
      return "الوحدات المتاحة";
    default:
      return batchType;
  }
}
