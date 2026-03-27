import { buildContractKey, matchContractByKey } from "@/features/imports/matching/match-contract";
import {
  buildCustomerImportKey,
  matchCustomerByImportKey,
} from "@/features/imports/matching/match-customer";
import { buildUnitKey, matchUnitByKey } from "@/features/imports/matching/match-unit";
import { normalizeImportRow } from "@/features/imports/normalization/normalize-import-row";
import { normalizeText } from "@/features/imports/normalization/normalize-text";
import type {
  ChangeSummary,
  ImportMatchingContext,
  ImportPreviewPayload,
  MappedImportIssue,
  ParsedInstallmentRow,
  ParsedUnitRow,
  ParsedWorksheet,
  PreviewCounts,
  PreviewSampleRow,
  ProjectMatch,
  StagedImportRow,
  StagedInstallmentRow,
  StagedUnitRow,
} from "@/features/imports/types";
import { mapImportIssue } from "@/features/imports/validators/map-import-issue";
import { validateImportRow } from "@/features/imports/validators/validate-import-row";

const BLOCKING_ISSUE_TYPES = new Set([
  "duplicate_unit_status",
  "invalid_customer_name",
  "invalid_date",
  "invalid_installment_code",
  "invalid_money",
  "invalid_number",
  "invalid_unit_code",
  "missing_required_field",
  "unknown_project",
]);

export type StageImportRowsInput =
  | {
      batchType: "installments";
      matchingContext: ImportMatchingContext;
      parsedWorksheet: ParsedWorksheet<ParsedInstallmentRow>;
    }
  | {
      batchType: "sold_units" | "available_units";
      matchingContext: ImportMatchingContext;
      parsedWorksheet: ParsedWorksheet<ParsedUnitRow>;
    };

export type StageImportRowsResult = {
  changeSummary: ChangeSummary;
  counts: PreviewCounts;
  issues: MappedImportIssue[];
  sampleRows: PreviewSampleRow[];
  stagedRows: StagedImportRow[];
};

type MutableChangeSummary = ChangeSummary;

type StageAccumulator = {
  customerCreates: Set<string>;
  customerMatches: Set<string>;
  installmentCreates: Set<string>;
  installmentUpdates: Set<string>;
  linkCreates: Set<string>;
  seenRowKeys: Set<string>;
  stagedRows: StagedImportRow[];
  unitCreates: Set<string>;
  unitUpdates: Set<string>;
  contractCreates: Set<string>;
  contractUpdates: Set<string>;
};

type MatchingMaps = {
  contractUnitLinks: Set<string>;
  projectsByCode: Map<string, ProjectMatch>;
};

export function stageImportRows(input: StageImportRowsInput): StageImportRowsResult {
  const matchingMaps = buildMatchingMaps(input.matchingContext);
  const accumulator: StageAccumulator = {
    contractCreates: new Set(),
    contractUpdates: new Set(),
    customerCreates: new Set(),
    customerMatches: new Set(),
    installmentCreates: new Set(),
    installmentUpdates: new Set(),
    linkCreates: new Set(),
    seenRowKeys: new Set(),
    stagedRows: [],
    unitCreates: new Set(),
    unitUpdates: new Set(),
  };

  if (input.batchType === "installments") {
    for (const row of input.parsedWorksheet.rows) {
      accumulator.stagedRows.push(stageInstallmentRow(row, input, matchingMaps, accumulator));
    }
  } else {
    for (const row of input.parsedWorksheet.rows) {
      accumulator.stagedRows.push(stageUnitRow(row, input, matchingMaps, accumulator));
    }
  }

  const issues = accumulator.stagedRows.flatMap((row) => row.issues);
  const issueRows = new Set(
    accumulator.stagedRows.filter((row) => row.issues.length > 0).map((row) => row.sourceRowNumber),
  ).size;
  const counts: PreviewCounts = {
    blockedRows: accumulator.stagedRows.filter((row) => row.hasBlockingIssues).length,
    issueRows,
    skippedRows: input.parsedWorksheet.skippedRowCount,
    totalRows: input.parsedWorksheet.rows.length,
    validRows: accumulator.stagedRows.filter((row) => row.canApply).length,
  };

  return {
    changeSummary: buildChangeSummary(accumulator),
    counts,
    issues,
    sampleRows: accumulator.stagedRows.slice(0, 5).map(buildPreviewSampleRow),
    stagedRows: accumulator.stagedRows,
  };
}

export function buildPreviewPayload(input: {
  batchId: string;
  changeSummary: ChangeSummary;
  counts: PreviewCounts;
  detectedColumns: string[];
  issues: Array<MappedImportIssue & { id: string }>;
  sampleRows: PreviewSampleRow[];
}): ImportPreviewPayload {
  return {
    batchId: input.batchId,
    changeSummary: input.changeSummary,
    counts: {
      issueRows: input.counts.issueRows,
      skippedRows: input.counts.skippedRows,
      totalRows: input.counts.totalRows,
      validRows: input.counts.validRows,
    },
    detectedColumns: input.detectedColumns,
    issues: input.issues,
    sampleRows: input.sampleRows,
    status: "ready_for_review",
  };
}

function stageInstallmentRow(
  parsedRow: ParsedInstallmentRow,
  input: Extract<StageImportRowsInput, { batchType: "installments" }>,
  matchingMaps: MatchingMaps,
  accumulator: StageAccumulator,
): StagedInstallmentRow {
  const normalizedRow = normalizeImportRow(parsedRow);
  const issues = [...validateImportRow(normalizedRow, { importType: "installments" }).issues];
  const project = normalizedRow.projectCode
    ? matchingMaps.projectsByCode.get(normalizedRow.projectCode)
    : undefined;

  if (normalizedRow.projectCode && !project) {
    issues.push(
      mapImportIssue({
        issueType: "unknown_project",
        rawValue: normalizedRow.projectNameRaw,
        sourceRowNumber: parsedRow.sourceRowNumber,
      }),
    );
  }

  const projectCode = normalizedRow.projectCode ?? "parco";
  const projectId = project?.id ?? "";
  const projectName = normalizedRow.projectName ?? String(normalizedRow.projectNameRaw ?? "");
  const customerName = normalizedRow.customerName ?? "";
  const normalizedCustomerName = normalizedRow.normalizedCustomerName ?? "";
  const customerImportKey =
    normalizedRow.projectCode && normalizedCustomerName
      ? buildCustomerImportKey(normalizedRow.projectCode, normalizedCustomerName)
      : "";
  const customerMatch =
    normalizedRow.projectCode && normalizedCustomerName
      ? matchCustomerByImportKey(
          input.matchingContext.customerIdentities,
          normalizedRow.projectCode,
          normalizedCustomerName,
        )
      : null;
  const contractInput = {
    customerImportKey,
    unitCodes: normalizedRow.unitCodes ?? [],
  };
  const contractMatch = customerImportKey
    ? matchContractByKey(input.matchingContext.contracts, contractInput)
    : null;
  const contractKey = customerImportKey ? buildContractKey(contractInput) : "";
  const installment = buildInstallmentReference({
    contractKey,
    dueDate: normalizedRow.dueDate,
    installmentCode: parsedRow.installmentCode,
    installmentType: normalizedRow.installmentType,
    existingInstallments: input.matchingContext.installments,
    sourceRowNumber: parsedRow.sourceRowNumber,
  });

  const isDuplicateInBatch = installment.installmentKey
    ? checkAndMarkDuplicate(accumulator.seenRowKeys, installment.installmentKey)
    : false;

  const matchedUnits = (normalizedRow.unitCodes ?? [])
    .map((unitCode) => ({
      unitCode,
      unitMatch: normalizedRow.projectCode
        ? matchUnitByKey(input.matchingContext.units, normalizedRow.projectCode, unitCode)
        : null,
      unitKey: normalizedRow.projectCode ? buildUnitKey(normalizedRow.projectCode, unitCode) : "",
    }))
    .filter((unit) => unit.unitCode.length > 0);

  for (const unit of matchedUnits) {
    if (unit.unitMatch) {
      continue;
    }

    issues.push({
      ...mapImportIssue({
        issueType: "unmatched_unit",
        rawValue: unit.unitCode,
        severity: "medium",
        sourceRowNumber: parsedRow.sourceRowNumber,
      }),
      payload: {
        contractKey,
        unitKey: unit.unitKey,
      },
    });
  }

  const hasBlockingIssues = issues.some((issue) => BLOCKING_ISSUE_TYPES.has(issue.issueType));
  const canApply = !hasBlockingIssues && !isDuplicateInBatch;

  if (canApply) {
    if (customerMatch) {
      accumulator.customerMatches.add(customerImportKey);
    } else if (customerImportKey) {
      accumulator.customerCreates.add(customerImportKey);
    }

    if (contractMatch) {
      accumulator.contractUpdates.add(contractKey);
    } else if (contractKey) {
      accumulator.contractCreates.add(contractKey);
    }

    if (installment.installmentId) {
      accumulator.installmentUpdates.add(installment.installmentKey);
    } else if (installment.installmentKey) {
      accumulator.installmentCreates.add(installment.installmentKey);
    }

    for (const unit of matchedUnits) {
      if (!unit.unitMatch) {
        continue;
      }

      const linkKey = `${contractKey}::${unit.unitKey}`;

      if (
        (!contractMatch || !matchingMaps.contractUnitLinks.has(`${contractMatch.id}::${unit.unitMatch.id}`)) &&
        !accumulator.linkCreates.has(linkKey)
      ) {
        accumulator.linkCreates.add(linkKey);
      }
    }
  }

  return {
    amountCollected: normalizedRow.amountCollected ?? 0,
    amountDue: normalizedRow.amountDue ?? 0,
    amountOutstanding: Math.max(
      normalizedRow.amountOutstanding ?? ((normalizedRow.amountDue ?? 0) - (normalizedRow.amountCollected ?? 0)),
      0,
    ),
    canApply,
    commercialPaper: normalizeText(parsedRow.commercialPaper) ?? undefined,
    contract: {
      contractId: contractMatch?.id,
      contractKey,
    },
    customer: {
      customerId: customerMatch?.customer_id,
      customerImportKey,
      customerName,
      normalizedName: normalizedCustomerName,
    },
    dueDate: normalizedRow.dueDate ?? "",
    hasBlockingIssues,
    installment,
    installmentCode: normalizeText(parsedRow.installmentCode) ?? undefined,
    installmentType: normalizeText(parsedRow.installmentType) ?? "",
    issues,
    kind: "installment",
    matchedUnitIds: matchedUnits.flatMap((unit) => (unit.unitMatch ? [unit.unitMatch.id] : [])),
    missingUnitCodes: matchedUnits.flatMap((unit) => (unit.unitMatch ? [] : [unit.unitCode])),
    netAmount: normalizedRow.netAmount,
    paymentDate: normalizedRow.paymentDate,
    penaltyAmount: normalizedRow.penaltyAmount ?? 0,
    projectCode,
    projectId,
    projectName,
    sourceRowNumber: parsedRow.sourceRowNumber,
    sourceType: parsedRow.sourceType,
    unitCodes: normalizedRow.unitCodes ?? [],
  };
}

function stageUnitRow(
  parsedRow: ParsedUnitRow,
  input: Extract<StageImportRowsInput, { batchType: "sold_units" | "available_units" }>,
  matchingMaps: MatchingMaps,
  accumulator: StageAccumulator,
): StagedUnitRow {
  const normalizedRow = normalizeImportRow(parsedRow);
  const issues = [...validateImportRow(normalizedRow, { importType: input.batchType }).issues];
  const project = normalizedRow.projectCode
    ? matchingMaps.projectsByCode.get(normalizedRow.projectCode)
    : undefined;

  if (normalizedRow.projectCode && !project) {
    issues.push(
      mapImportIssue({
        issueType: "unknown_project",
        rawValue: normalizedRow.projectNameRaw,
        sourceRowNumber: parsedRow.sourceRowNumber,
      }),
    );
  }

  const unitCode = normalizedRow.unitCodes?.[0] ?? "";
  const projectCode = normalizedRow.projectCode ?? "parco";
  const unitKey = normalizedRow.projectCode && unitCode ? buildUnitKey(normalizedRow.projectCode, unitCode) : "";
  const existingUnit = normalizedRow.projectCode && unitCode
    ? matchUnitByKey(input.matchingContext.units, normalizedRow.projectCode, unitCode)
    : null;

  const isDuplicateInBatch = unitKey
    ? checkAndMarkDuplicate(accumulator.seenRowKeys, unitKey)
    : false;

  const statusConflict = Boolean(
    existingUnit &&
      ((parsedRow.unitStatus === "sold" && existingUnit.source_available) ||
        (parsedRow.unitStatus === "available" && existingUnit.source_sold)),
  );

  if (statusConflict) {
    issues.push(
      mapImportIssue({
        issueType: "duplicate_unit_status",
        rawValue: unitCode,
        sourceRowNumber: parsedRow.sourceRowNumber,
      }),
    );
  }

  const hasBlockingIssues = issues.some((issue) => BLOCKING_ISSUE_TYPES.has(issue.issueType));
  const canApply = !hasBlockingIssues && !isDuplicateInBatch;

  if (canApply && unitKey) {
    if (existingUnit) {
      accumulator.unitUpdates.add(unitKey);
    } else {
      accumulator.unitCreates.add(unitKey);
    }
  }

  return {
    builtUpArea: normalizedRow.builtUpArea,
    canApply,
    contractPrice: normalizedRow.contractPrice,
    floorName: normalizeText(parsedRow.floorName) ?? undefined,
    gardenArea: normalizedRow.gardenArea,
    hasBlockingIssues,
    issues,
    kind: "unit",
    listPrice: normalizedRow.listPrice,
    projectCode,
    projectId: project?.id ?? "",
    projectName: normalizedRow.projectName ?? String(normalizedRow.projectNameRaw ?? ""),
    sourceRowNumber: parsedRow.sourceRowNumber,
    sourceType: parsedRow.sourceType,
    unit: {
      existingUnitId: existingUnit?.id,
      statusConflict,
      unitCode,
      unitKey,
    },
    unitStatus: parsedRow.unitStatus,
  };
}

function buildMatchingMaps(context: ImportMatchingContext): MatchingMaps {
  return {
    contractUnitLinks: new Set(context.contractUnits.map((link) => `${link.contract_id}::${link.unit_id}`)),
    projectsByCode: new Map(context.projects.map((project) => [project.project_code, project])),
  };
}

function buildChangeSummary(accumulator: StageAccumulator): MutableChangeSummary {
  return {
    contractsToCreate: accumulator.contractCreates.size,
    contractsToUpdate: accumulator.contractUpdates.size,
    customersToCreate: accumulator.customerCreates.size,
    customersToMatch: accumulator.customerMatches.size,
    installmentsToCreate: accumulator.installmentCreates.size,
    installmentsToUpdate: accumulator.installmentUpdates.size,
    linksToCreate: accumulator.linkCreates.size,
    unitsToCreate: accumulator.unitCreates.size,
    unitsToUpdate: accumulator.unitUpdates.size,
  };
}

function buildPreviewSampleRow(row: StagedImportRow): PreviewSampleRow {
  if (row.kind === "installment") {
    return {
      amountDue: row.amountDue,
      customerName: row.customer.customerName,
      project: row.projectName,
      sourceRowNumber: row.sourceRowNumber,
      unitCode: row.unitCodes.join("+"),
    };
  }

  return {
    project: row.projectName,
    sourceRowNumber: row.sourceRowNumber,
    unitCode: row.unit.unitCode,
  };
}

function buildInstallmentReference(input: {
  contractKey: string;
  dueDate?: string;
  existingInstallments: ImportMatchingContext["installments"];
  installmentCode: unknown;
  installmentType?: unknown;
  sourceRowNumber: number;
}): StagedInstallmentRow["installment"] {
  const sourceInstallmentCode = normalizeText(input.installmentCode)?.replace(/\s+/g, "");
  const keySource = sourceInstallmentCode ? "source" : "fallback";
  const installmentKey = sourceInstallmentCode
    ? `${input.contractKey}::${sourceInstallmentCode}`
    : `${input.contractKey}::${input.dueDate ?? "no-date"}::${normalizeText(input.installmentType) ?? "unknown"}::row-${input.sourceRowNumber}`;
  const installmentMatch = input.existingInstallments.find(
    (installment) => installment.installment_key.trim().toLowerCase() === installmentKey.trim().toLowerCase(),
  );

  return {
    installmentId: installmentMatch?.id,
    installmentKey,
    keySource,
  };
}

function checkAndMarkDuplicate(seenRowKeys: Set<string>, rowKey: string): boolean {
  const normalizedKey = rowKey.trim().toLowerCase();

  if (!normalizedKey) {
    return false;
  }

  if (!seenRowKeys.has(normalizedKey)) {
    seenRowKeys.add(normalizedKey);
    return false;
  }

  return true;
}

