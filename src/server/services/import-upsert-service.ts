import { deriveDelayBucket } from "@/features/installments/derive-delay-bucket";
import { deriveDelayDays } from "@/features/installments/derive-delay-days";
import { derivePaymentStatus } from "@/features/installments/derive-payment-status";
import type {
  ImportBatchStagingData,
  StagedInstallmentRow,
  StagedUnitRow,
} from "@/features/imports/types";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { uuidSchema } from "@/lib/validation/uuid";
import {
  getImportBatchStaging,
  listImportIssuesByBatchId,
} from "@/server/repositories/import-batch-staging-repository";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

export class ImportProcessingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly isRecoverable: boolean = false,
  ) {
    super(message);
    this.name = "ImportProcessingError";
  }
}

type ImportUpsertDependencies = {
  createContract: typeof createContract;
  createCustomer: typeof createCustomer;
  createInstallment: typeof createInstallment;
  createUnit: typeof createUnit;
  ensureContractUnit: typeof ensureContractUnit;
  finalizeImportBatch: typeof finalizeImportBatch;
  flagUnitConflict: typeof flagUnitConflict;
  getImportBatchStaging: typeof getImportBatchStaging;
  listImportIssuesByBatchId: typeof listImportIssuesByBatchId;
  processImportBatch?: typeof processImportBatch;
  touchContract: typeof touchContract;
  updateInstallment: typeof updateInstallment;
  updateUnit: typeof updateUnit;
  upsertCustomerIdentity: typeof upsertCustomerIdentity;
};

export async function upsertImportBatch(
  input: { actorId: string; batchId: string },
  dependencies: ImportUpsertDependencies = {
    createContract,
    createCustomer,
    createInstallment,
    createUnit,
    ensureContractUnit,
    finalizeImportBatch,
    flagUnitConflict,
    getImportBatchStaging,
    listImportIssuesByBatchId,
    processImportBatch,
    touchContract,
    updateInstallment,
    updateUnit,
    upsertCustomerIdentity,
  },
): Promise<{
  approvedAt: string;
  batchId: string;
  status: "approved" | "approved_with_issues";
  summary: {
    created: number;
    issues: number;
    skipped: number;
    updated: number;
  };
}> {
  validateInput(input);

  if (dependencies.processImportBatch) {
    return dependencies.processImportBatch(input);
  }

  if (!canUseNonTransactionalFallback()) {
    throw new ImportProcessingError(
      "Transactional import processing is required outside automated tests.",
      "TRANSACTION_REQUIRED",
    );
  }

  const stagingResult = await dependencies.getImportBatchStaging(input.batchId);

  if (!stagingResult?.stagingData) {
    throw new ImportProcessingError(
      "Import batch must be previewed before approval.",
      "NO_PREVIEW",
    );
  }

  if (stagingResult.batch.status !== "ready_for_review") {
    throw new ImportProcessingError(
      `Import batch cannot be approved in "${stagingResult.batch.status}" status.`,
      "INVALID_STATUS",
    );
  }

  const issues = await dependencies.listImportIssuesByBatchId(input.batchId);
  const approvedAt = new Date().toISOString();
  const state = createApplyState(stagingResult.stagingData);

  try {
    for (const row of stagingResult.stagingData.stagedRows) {
      if (!row.canApply) {
        state.summary.skipped += 1;

        if (row.kind === "unit" && row.unit.statusConflict && row.unit.existingUnitId) {
          await dependencies.flagUnitConflict({
            batchId: input.batchId,
            unitId: row.unit.existingUnitId,
            unitStatus: row.unitStatus,
          });
        }

        continue;
      }

      if (row.kind === "unit") {
        await applyUnitRow(row, input.batchId, state, dependencies);
        continue;
      }

      await applyInstallmentRow(row, input.batchId, state, dependencies);
    }

    const status = issues.length > 0 ? "approved_with_issues" : "approved";

    await dependencies.finalizeImportBatch({
      actorId: input.actorId,
      approvedAt,
      batchId: input.batchId,
      created: state.summary.created,
      issues: issues.length,
      rowsImported: state.appliedRows,
      rowsSkipped: state.summary.skipped,
      rowsUpdated: state.summary.updated,
      stagingData: stagingResult.stagingData,
      status,
      updated: state.summary.updated,
    });

    return {
      approvedAt,
      batchId: input.batchId,
      status,
      summary: {
        created: state.summary.created,
        issues: issues.length,
        skipped: state.summary.skipped,
        updated: state.summary.updated,
      },
    };
  } catch (error) {
    if (error instanceof ImportProcessingError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown error during import processing";
    throw new ImportProcessingError(
      `Import processing failed: ${message}`,
      "PROCESSING_ERROR",
      true,
    );
  }
}

function validateInput(input: { actorId: string; batchId: string }): void {
  if (!input.batchId || !input.batchId.trim()) {
    throw new ImportProcessingError("batchId is required", "MISSING_BATCH_ID");
  }

  const batchIdResult = uuidSchema.safeParse(input.batchId);
  if (!batchIdResult.success) {
    throw new ImportProcessingError("batchId must be a valid UUID", "INVALID_BATCH_ID");
  }

  if (!input.actorId || !input.actorId.trim()) {
    throw new ImportProcessingError("actorId is required", "MISSING_ACTOR_ID");
  }

  const actorIdResult = uuidSchema.safeParse(input.actorId);
  if (!actorIdResult.success) {
    throw new ImportProcessingError("actorId must be a valid UUID", "INVALID_ACTOR_ID");
  }
}

function canUseNonTransactionalFallback(): boolean {
  return process.env.NODE_ENV === "test";
}

type ImportBatchResult = {
  approvedAt: string;
  batchId: string;
  status: "approved" | "approved_with_issues";
  summary: {
    created: number;
    issues: number;
    skipped: number;
    updated: number;
  };
};

async function processImportBatch(
  input: { actorId: string; batchId: string },
  client: AdminClient = createAdminSupabaseClient(),
): Promise<ImportBatchResult> {
  const { data, error } = await client.rpc("process_import_batch", {
    target_actor_id: input.actorId,
    target_batch_id: input.batchId,
  });

  if (error) {
    throw new ImportProcessingError(error.message, error.code ?? "PROCESSING_ERROR", true);
  }

  if (!isImportBatchResult(data)) {
    throw new ImportProcessingError(
      "process_import_batch returned an invalid payload.",
      "INVALID_PROCESS_RESULT",
    );
  }

  return data;
}

function isImportBatchResult(value: unknown): value is ImportBatchResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const result = value as {
    approvedAt?: unknown;
    batchId?: unknown;
    status?: unknown;
    summary?: {
      created?: unknown;
      issues?: unknown;
      skipped?: unknown;
      updated?: unknown;
    };
  };

  return (
    typeof result.approvedAt === "string" &&
    typeof result.batchId === "string" &&
    (result.status === "approved" || result.status === "approved_with_issues") &&
    typeof result.summary?.created === "number" &&
    typeof result.summary?.issues === "number" &&
    typeof result.summary?.skipped === "number" &&
    typeof result.summary?.updated === "number"
  );
}

async function applyInstallmentRow(
  row: StagedInstallmentRow,
  batchId: string,
  state: ApplyState,
  dependencies: ImportUpsertDependencies,
): Promise<void> {
  const customerId = await ensureCustomer(row, state, dependencies);
  const contractId = await ensureContract(row, batchId, customerId, state, dependencies);

  for (const unitId of row.matchedUnitIds) {
    const createdLink = await dependencies.ensureContractUnit({ contractId, unitId });

    if (createdLink) {
      state.summary.created += 1;
    }
  }

  const installmentPayload = buildInstallmentPayload(row, batchId, contractId);

  if (row.installment.installmentId) {
    await dependencies.updateInstallment({
      installmentId: row.installment.installmentId,
      payload: installmentPayload,
    });
    state.summary.updated += 1;
  } else {
    await dependencies.createInstallment(installmentPayload);
    state.summary.created += 1;
  }

  state.appliedRows += 1;
}

async function applyUnitRow(
  row: StagedUnitRow,
  batchId: string,
  state: ApplyState,
  dependencies: ImportUpsertDependencies,
): Promise<void> {
  if (row.unit.existingUnitId) {
    await dependencies.updateUnit({
      batchId,
      payload: buildUnitPayload(row, batchId),
      unitId: row.unit.existingUnitId,
      unitStatus: row.unitStatus,
    });
    state.summary.updated += 1;
  } else {
    await dependencies.createUnit(buildUnitPayload(row, batchId));
    state.summary.created += 1;
  }

  state.appliedRows += 1;
}

async function ensureCustomer(
  row: StagedInstallmentRow,
  state: ApplyState,
  dependencies: ImportUpsertDependencies,
): Promise<string> {
  const cachedCustomerId = state.customerIds.get(row.customer.customerImportKey);

  if (cachedCustomerId) {
    return cachedCustomerId;
  }

  if (row.customer.customerId) {
    await dependencies.upsertCustomerIdentity({
      customerId: row.customer.customerId,
      customerImportKey: row.customer.customerImportKey,
      customerNameRaw: row.customer.customerName,
      normalizedName: row.customer.normalizedName,
      projectId: row.projectId,
    });
    state.customerIds.set(row.customer.customerImportKey, row.customer.customerId);

    return row.customer.customerId;
  }

  const customer = await dependencies.createCustomer({
    customerKey: row.customer.customerImportKey,
    customerName: row.customer.customerName,
    customerNameRaw: row.customer.customerName,
    normalizedName: row.customer.normalizedName,
  });

  await dependencies.upsertCustomerIdentity({
    customerId: customer.id,
    customerImportKey: row.customer.customerImportKey,
    customerNameRaw: row.customer.customerName,
    normalizedName: row.customer.normalizedName,
    projectId: row.projectId,
  });
  state.customerIds.set(row.customer.customerImportKey, customer.id);
  state.summary.created += 1;

  return customer.id;
}

async function ensureContract(
  row: StagedInstallmentRow,
  batchId: string,
  customerId: string,
  state: ApplyState,
  dependencies: ImportUpsertDependencies,
): Promise<string> {
  const cachedContractId = state.contractIds.get(row.contract.contractKey);

  if (cachedContractId) {
    return cachedContractId;
  }

  if (row.contract.contractId) {
    if (!state.touchedContracts.has(row.contract.contractKey)) {
      await dependencies.touchContract({
        batchId,
        contractId: row.contract.contractId,
        customerId,
        projectId: row.projectId,
      });
      state.touchedContracts.add(row.contract.contractKey);
      state.summary.updated += 1;
    }

    state.contractIds.set(row.contract.contractKey, row.contract.contractId);

    return row.contract.contractId;
  }

  const contract = await dependencies.createContract({
    batchId,
    contractKey: row.contract.contractKey,
    customerId,
    projectId: row.projectId,
  });
  state.contractIds.set(row.contract.contractKey, contract.id);
  state.summary.created += 1;

  return contract.id;
}

function buildInstallmentPayload(
  row: StagedInstallmentRow,
  batchId: string,
  contractId: string,
): TablesInsert<"installments"> {
  const paymentStatus = derivePaymentStatus({
    amountCollected: row.amountCollected,
    amountDue: row.amountDue,
    amountOutstanding: row.amountOutstanding,
    dueDate: row.dueDate,
  });
  const delayDays = deriveDelayDays({
    amountCollected: row.amountCollected,
    amountDue: row.amountDue,
    amountOutstanding: row.amountOutstanding,
    dueDate: row.dueDate,
  });

  return {
    amount_collected: row.amountCollected,
    amount_due: row.amountDue,
    amount_outstanding: Math.max(row.amountOutstanding, 0),
    commercial_paper: row.commercialPaper ?? null,
    contract_id: contractId,
    delay_bucket: deriveDelayBucket(delayDays),
    delay_days: delayDays,
    due_date: row.dueDate,
    installment_code: row.installmentCode ?? null,
    installment_key: row.installment.installmentKey,
    installment_type: row.installmentType,
    net_amount: row.netAmount ?? null,
    payment_date: row.paymentDate ?? null,
    payment_status: paymentStatus,
    penalty_amount: row.penaltyAmount,
    source_batch_id: batchId,
  };
}

function buildUnitPayload(row: StagedUnitRow, batchId: string): TablesInsert<"units"> {
  return {
    built_up_area: row.builtUpArea ?? null,
    contract_price: row.contractPrice ?? null,
    floor_name: row.floorName ?? null,
    garden_area: row.gardenArea ?? null,
    list_price: row.listPrice ?? null,
    project_id: row.projectId,
    source_available: row.unitStatus === "available",
    source_batch_id: batchId,
    source_sold: row.unitStatus === "sold",
    status_conflict: false,
    unit_code: row.unit.unitCode,
    unit_key: row.unit.unitKey,
    unit_status: row.unitStatus,
  };
}

function createApplyState(stagingData: ImportBatchStagingData): ApplyState {
  const customerIds = new Map<string, string>();
  const contractIds = new Map<string, string>();

  for (const row of stagingData.stagedRows) {
    if (row.kind === "installment") {
      if (row.customer.customerId) {
        customerIds.set(row.customer.customerImportKey, row.customer.customerId);
      }

      if (row.contract.contractId) {
        contractIds.set(row.contract.contractKey, row.contract.contractId);
      }
    }
  }

  return {
    appliedRows: 0,
    contractIds,
    customerIds,
    summary: {
      created: 0,
      skipped: 0,
      updated: 0,
    },
    touchedContracts: new Set(),
  };
}

type ApplyState = {
  appliedRows: number;
  contractIds: Map<string, string>;
  customerIds: Map<string, string>;
  summary: {
    created: number;
    skipped: number;
    updated: number;
  };
  touchedContracts: Set<string>;
};

async function createCustomer(
  input: {
    customerKey: string;
    customerName: string;
    customerNameRaw: string;
    normalizedName: string;
  },
  client: AdminClient = createAdminSupabaseClient(),
): Promise<Tables<"customers">> {
  const payload: TablesInsert<"customers"> = {
    customer_key: input.customerKey,
    customer_name: input.customerName,
    customer_name_raw: input.customerNameRaw,
    normalized_name: input.normalizedName,
  };
  const { data, error } = await client.from("customers").upsert(payload, { onConflict: "customer_key" }).select("*").single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create customer.");
  }

  return data;
}

async function upsertCustomerIdentity(
  input: {
    customerId: string;
    customerImportKey: string;
    customerNameRaw: string;
    normalizedName: string;
    projectId: string;
  },
  client: AdminClient = createAdminSupabaseClient(),
): Promise<void> {
  const payload: TablesInsert<"customer_project_identities"> = {
    customer_id: input.customerId,
    customer_import_key: input.customerImportKey,
    customer_name_raw: input.customerNameRaw,
    normalized_name: input.normalizedName,
    project_id: input.projectId,
  };
  const { error } = await client
    .from("customer_project_identities")
    .upsert(payload, { onConflict: "customer_import_key" });

  if (error) {
    throw new Error(error.message);
  }
}

async function createContract(
  input: {
    batchId: string;
    contractKey: string;
    customerId: string;
    projectId: string;
  },
  client: AdminClient = createAdminSupabaseClient(),
): Promise<Tables<"contracts">> {
  const payload: TablesInsert<"contracts"> = {
    contract_key: input.contractKey,
    customer_id: input.customerId,
    project_id: input.projectId,
    source_batch_id: input.batchId,
  };
  const { data, error } = await client.from("contracts").upsert(payload, { onConflict: "contract_key" }).select("*").single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create contract.");
  }

  return data;
}

async function touchContract(
  input: {
    batchId: string;
    contractId: string;
    customerId: string;
    projectId: string;
  },
  client: AdminClient = createAdminSupabaseClient(),
): Promise<void> {
  const payload: TablesUpdate<"contracts"> = {
    customer_id: input.customerId,
    project_id: input.projectId,
    source_batch_id: input.batchId,
  };
  const { error } = await client.from("contracts").update(payload).eq("id", input.contractId);

  if (error) {
    throw new Error(error.message);
  }
}

async function ensureContractUnit(
  input: { contractId: string; unitId: string },
  client: AdminClient = createAdminSupabaseClient(),
): Promise<boolean> {
  const payload: TablesInsert<"contract_units"> = {
    contract_id: input.contractId,
    unit_id: input.unitId,
  };

  const { data, error } = await client
    .from("contract_units")
    .upsert(payload, { ignoreDuplicates: true, onConflict: "contract_id,unit_id" })
    .select("id")
    ;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).length > 0;
}

async function createInstallment(
  payload: TablesInsert<"installments">,
  client: AdminClient = createAdminSupabaseClient(),
): Promise<Tables<"installments">> {
  const { data, error } = await client
    .from("installments")
    .upsert(payload, { onConflict: "installment_key" })
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Failed to create or update installment");
  }

  return data;
}

async function updateInstallment(
  input: { installmentId: string; payload: TablesUpdate<"installments"> },
  client: AdminClient = createAdminSupabaseClient(),
): Promise<void> {
  const { error } = await client.from("installments").update(input.payload).eq("id", input.installmentId);

  if (error) {
    throw new Error(error.message);
  }
}

async function createUnit(
  payload: TablesInsert<"units">,
  client: AdminClient = createAdminSupabaseClient(),
): Promise<void> {
  const { error } = await client.from("units").insert(payload);

  if (error) {
    throw new Error(error.message);
  }
}

async function updateUnit(
  input: {
    batchId: string;
    payload: TablesUpdate<"units">;
    unitId: string;
    unitStatus: "available" | "sold";
  },
  client: AdminClient = createAdminSupabaseClient(),
): Promise<void> {
  const sourceFlags: TablesUpdate<"units"> =
    input.unitStatus === "sold"
      ? { source_batch_id: input.batchId, source_sold: true }
      : { source_available: true, source_batch_id: input.batchId };
  const { error } = await client
    .from("units")
    .update({ ...input.payload, ...sourceFlags, status_conflict: false })
    .eq("id", input.unitId);

  if (error) {
    throw new Error(error.message);
  }
}

async function flagUnitConflict(
  input: {
    batchId: string;
    unitId: string;
    unitStatus: "available" | "sold";
  },
  client: AdminClient = createAdminSupabaseClient(),
): Promise<void> {
  const payload: TablesUpdate<"units"> =
    input.unitStatus === "sold"
      ? { source_batch_id: input.batchId, source_sold: true, status_conflict: true }
      : { source_available: true, source_batch_id: input.batchId, status_conflict: true };
  const { error } = await client.from("units").update(payload).eq("id", input.unitId);

  if (error) {
    throw new Error(error.message);
  }
}

async function finalizeImportBatch(
  input: {
    actorId: string;
    approvedAt: string;
    batchId: string;
    created: number;
    issues: number;
    rowsImported: number;
    rowsSkipped: number;
    rowsUpdated: number;
    stagingData: ImportBatchStagingData;
    status: "approved" | "approved_with_issues";
    updated: number;
  },
  client: AdminClient = createAdminSupabaseClient(),
): Promise<void> {
  const payload: TablesUpdate<"import_batches"> = {
    finished_at: input.approvedAt,
    issue_count: input.issues,
    rows_imported: input.rowsImported,
    rows_skipped: input.rowsSkipped,
    rows_updated: input.rowsUpdated,
    status: input.status,
    summary_json: {
      ...input.stagingData,
      approvalSummary: {
        approvedAt: input.approvedAt,
        approvedBy: input.actorId,
        created: input.created,
        issues: input.issues,
        skipped: input.rowsSkipped,
        updated: input.updated,
      },
    },
  };
  const { error } = await client.from("import_batches").update(payload).eq("id", input.batchId);

  if (error) {
    throw new Error(error.message);
  }
}
