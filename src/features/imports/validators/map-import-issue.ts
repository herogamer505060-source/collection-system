import type {
  ImportIssueSeverity,
  ImportIssueType,
  MapImportIssueInput,
  MappedImportIssue,
} from "@/features/imports/types";

import { getImportIssueMessageAr } from "@/features/imports/validators/issue-messages.ar";

const DEFAULT_SEVERITY_BY_ISSUE_TYPE: Record<ImportIssueType, ImportIssueSeverity> = {
  unknown_project: "high",
  invalid_customer_name: "high",
  invalid_date: "high",
  invalid_installment_code: "high",
  invalid_money: "high",
  invalid_number: "medium",
  invalid_unit_code: "high",
  missing_required_field: "high",
  duplicate_business_key: "high",
  duplicate_unit_status: "high",
  unmatched_unit: "medium",
};

export function mapImportIssue(input: MapImportIssueInput): MappedImportIssue {
  const rawValue = formatRawValue(input.rawValue);

  return {
    fieldLabel: input.fieldLabel,
    issueType: input.issueType,
    messageAr: getImportIssueMessageAr({ ...input, rawValueText: rawValue }),
    payload: null,
    rawValue,
    severity: input.severity ?? DEFAULT_SEVERITY_BY_ISSUE_TYPE[input.issueType],
    sourceRowNumber: input.sourceRowNumber,
  };
}

function formatRawValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return null;
}
