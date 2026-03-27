import type {
  ImportBatchType,
  MapImportIssueInput,
  MappedImportIssue,
  NormalizedImportRow,
} from "@/features/imports/types";

import { normalizeText } from "@/features/imports/normalization/normalize-text";
import { mapImportIssue } from "@/features/imports/validators/map-import-issue";

type ValidateImportRowOptions = {
  importType: ImportBatchType;
};

type ValidateImportRowResult = {
  isValid: boolean;
  issues: MappedImportIssue[];
};

export function validateImportRow(
  row: NormalizedImportRow,
  options: ValidateImportRowOptions,
): ValidateImportRowResult {
  const issues: MappedImportIssue[] = [];

  const pushIssue = (input: Omit<MapImportIssueInput, "sourceRowNumber">) => {
    issues.push(
      mapImportIssue({
        ...input,
        sourceRowNumber: row.sourceRowNumber,
      }),
    );
  };

  validateProject(row, pushIssue);

  if (options.importType === "installments") {
    validateInstallmentRow(row, pushIssue);
  } else {
    validateUnitRow(row, pushIssue);
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

function validateProject(
  row: NormalizedImportRow,
  pushIssue: (input: Omit<MapImportIssueInput, "sourceRowNumber">) => void,
): void {
  if (row.projectCode) {
    return;
  }

  if (hasProvidedValue(row.projectNameRaw)) {
    pushIssue({
      issueType: "unknown_project",
      rawValue: row.projectNameRaw,
    });

    return;
  }

  pushIssue({
    fieldLabel: "اسم المشروع",
    issueType: "missing_required_field",
  });
}

function validateInstallmentRow(
  row: NormalizedImportRow,
  pushIssue: (input: Omit<MapImportIssueInput, "sourceRowNumber">) => void,
): void {
  if (!row.normalizedCustomerName) {
    pushIssue(
      hasProvidedValue(row.customerNameRaw)
        ? { issueType: "invalid_customer_name", rawValue: row.customerNameRaw }
        : { fieldLabel: "اسم العميل", issueType: "missing_required_field" },
    );
  }

  validateUnitCodes(row, pushIssue, { allowMultipleUnits: true });
  validateInstallmentCode(row, pushIssue);
  validateRequiredDate(row, pushIssue, "dueDate", "dueDateRaw", "تاريخ القسط");
  validateRequiredMoney(row, pushIssue, "amountDue", "amountDueRaw", "قيمة القسط");
  validateRequiredText(row.installmentType, pushIssue, "نوع القسط");

  validateOptionalMoney(row.amountCollected, row.amountCollectedRaw, pushIssue, "المحصل");
  validateOptionalMoney(row.amountOutstanding, row.amountOutstandingRaw, pushIssue, "المتبقي");
  validateOptionalMoney(row.netAmount, row.netAmountRaw, pushIssue, "صافي القسط");
  validateOptionalDate(row.paymentDate, row.paymentDateRaw, pushIssue, "تاريخ الدفع");
}

function validateUnitRow(
  row: NormalizedImportRow,
  pushIssue: (input: Omit<MapImportIssueInput, "sourceRowNumber">) => void,
): void {
  validateUnitCodes(row, pushIssue, { allowMultipleUnits: false });
  validateOptionalNumber(row.builtUpArea, row.builtUpAreaRaw, pushIssue, "مساحة الوحدة");
  validateOptionalNumber(row.gardenArea, row.gardenAreaRaw, pushIssue, "المساحة الخارجية");
  validateOptionalMoney(row.listPrice, row.listPriceRaw, pushIssue, "السعر بناءا علي قائمة الاسعار");
  validateOptionalMoney(row.contractPrice, row.contractPriceRaw, pushIssue, "السعر بناءا علي عقد البيع");
}

function validateUnitCodes(
  row: NormalizedImportRow,
  pushIssue: (input: Omit<MapImportIssueInput, "sourceRowNumber">) => void,
  options: { allowMultipleUnits: boolean },
): void {
  const unitCodes = row.unitCodes ?? [];

  if (unitCodes.length === 0) {
    pushIssue(
      hasProvidedValue(row.unitCodeRaw)
        ? { issueType: "invalid_unit_code", rawValue: row.unitCodeRaw }
        : { fieldLabel: "كود الوحدة", issueType: "missing_required_field" },
    );

    return;
  }

  if (!options.allowMultipleUnits && unitCodes.length > 1) {
    pushIssue({
      issueType: "invalid_unit_code",
      rawValue: row.unitCodeRaw,
    });
  }
}

function validateInstallmentCode(
  row: NormalizedImportRow,
  pushIssue: (input: Omit<MapImportIssueInput, "sourceRowNumber">) => void,
): void {
  const installmentCode = normalizeText(row.installmentCode);

  if (!installmentCode) {
    pushIssue({
      fieldLabel: "كود القسط",
      issueType: "missing_required_field",
    });

    return;
  }

  if (!/\d/.test(installmentCode)) {
    pushIssue({
      issueType: "invalid_installment_code",
      rawValue: row.installmentCode,
    });
  }
}

function validateRequiredText(
  value: unknown,
  pushIssue: (input: Omit<MapImportIssueInput, "sourceRowNumber">) => void,
  fieldLabel: string,
): void {
  if (normalizeText(value)) {
    return;
  }

  pushIssue({
    fieldLabel,
    issueType: "missing_required_field",
  });
}

function validateRequiredDate(
  row: NormalizedImportRow,
  pushIssue: (input: Omit<MapImportIssueInput, "sourceRowNumber">) => void,
  valueField: "actualDeliveryDate" | "deliveryDate" | "dueDate" | "paymentDate",
  rawField: "actualDeliveryDateRaw" | "deliveryDateRaw" | "dueDateRaw" | "paymentDateRaw",
  fieldLabel: string,
): void {
  if (row[valueField]) {
    return;
  }

  pushIssue(
    hasProvidedValue(row[rawField])
      ? { fieldLabel, issueType: "invalid_date", rawValue: row[rawField] }
      : { fieldLabel, issueType: "missing_required_field" },
  );
}

function validateRequiredMoney(
  row: NormalizedImportRow,
  pushIssue: (input: Omit<MapImportIssueInput, "sourceRowNumber">) => void,
  valueField:
    | "amountCollected"
    | "amountDue"
    | "amountOutstanding"
    | "builtUpArea"
    | "contractPrice"
    | "gardenArea"
    | "listPrice"
    | "netAmount"
    | "otherArea"
    | "penaltyAmount",
  rawField:
    | "amountCollectedRaw"
    | "amountDueRaw"
    | "amountOutstandingRaw"
    | "builtUpAreaRaw"
    | "contractPriceRaw"
    | "gardenAreaRaw"
    | "listPriceRaw"
    | "netAmountRaw"
    | "otherAreaRaw"
    | "penaltyAmountRaw",
  fieldLabel: string,
): void {
  if (typeof row[valueField] === "number") {
    return;
  }

  pushIssue(
    hasProvidedValue(row[rawField])
      ? { fieldLabel, issueType: "invalid_money", rawValue: row[rawField] }
      : { fieldLabel, issueType: "missing_required_field" },
  );
}

function validateOptionalDate(
  value: string | undefined,
  rawValue: unknown,
  pushIssue: (input: Omit<MapImportIssueInput, "sourceRowNumber">) => void,
  fieldLabel: string,
): void {
  if (!hasProvidedValue(rawValue) || value) {
    return;
  }

  pushIssue({
    fieldLabel,
    issueType: "invalid_date",
    rawValue,
  });
}

function validateOptionalMoney(
  value: number | undefined,
  rawValue: unknown,
  pushIssue: (input: Omit<MapImportIssueInput, "sourceRowNumber">) => void,
  fieldLabel: string,
): void {
  if (!hasProvidedValue(rawValue) || typeof value === "number") {
    return;
  }

  pushIssue({
    fieldLabel,
    issueType: "invalid_money",
    rawValue,
  });
}

function validateOptionalNumber(
  value: number | undefined,
  rawValue: unknown,
  pushIssue: (input: Omit<MapImportIssueInput, "sourceRowNumber">) => void,
  fieldLabel: string,
): void {
  if (!hasProvidedValue(rawValue) || typeof value === "number") {
    return;
  }

  pushIssue({
    fieldLabel,
    issueType: "invalid_number",
    rawValue,
  });
}

function hasProvidedValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return true;
}

