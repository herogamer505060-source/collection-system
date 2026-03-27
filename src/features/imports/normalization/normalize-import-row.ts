import type { NormalizedImportRow, NormalizeImportRowInput } from "@/features/imports/types";

import {
  normalizeCustomerDisplayName,
  normalizeCustomerName,
} from "@/features/imports/normalization/normalize-customer-name";
import { normalizeDate } from "@/features/imports/normalization/normalize-date";
import { normalizeMoney } from "@/features/imports/normalization/normalize-money";
import { normalizeProject } from "@/features/imports/normalization/normalize-project";
import { parseCompositeUnitCode } from "@/features/imports/normalization/parse-composite-unit-code";

const MONEY_FIELDS = [
  "amountCollected",
  "amountDue",
  "amountOutstanding",
  "builtUpArea",
  "contractPrice",
  "gardenArea",
  "listPrice",
  "netAmount",
  "otherArea",
  "penaltyAmount",
] as const;

const DATE_FIELDS = ["actualDeliveryDate", "deliveryDate", "dueDate", "paymentDate"] as const;

function hasOwnProperty(value: object, property: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, property);
}

export function normalizeImportRow(input: NormalizeImportRowInput): NormalizedImportRow {
  const normalizedRow: Record<string, unknown> = { ...input };

  if (hasOwnProperty(input, "projectName")) {
    normalizedRow.projectNameRaw = input.projectName;

    const project = normalizeProject(input.projectName);

    if (project) {
      normalizedRow.projectCode = project.projectCode;
      normalizedRow.projectName = project.projectName;
    } else {
      normalizedRow.projectName = undefined;
    }
  }

  if (hasOwnProperty(input, "customerName")) {
    normalizedRow.customerNameRaw = input.customerName;
    normalizedRow.customerName = normalizeCustomerDisplayName(input.customerName) ?? undefined;
    normalizedRow.normalizedCustomerName = normalizeCustomerName(input.customerName) ?? undefined;
  }

  if (hasOwnProperty(input, "unitCode")) {
    normalizedRow.unitCodeRaw = input.unitCode;
    normalizedRow.unitCodes = parseCompositeUnitCode(input.unitCode);
  }

  for (const field of MONEY_FIELDS) {
    if (!hasOwnProperty(input, field)) {
      continue;
    }

    normalizedRow[`${field}Raw`] = input[field];

    const normalizedValue = normalizeMoney(input[field], {
      emptyAsZero: field === "penaltyAmount",
    });

    normalizedRow[field] = normalizedValue ?? undefined;
  }

  for (const field of DATE_FIELDS) {
    if (!hasOwnProperty(input, field)) {
      continue;
    }

    normalizedRow[`${field}Raw`] = input[field];
    normalizedRow[field] = normalizeDate(input[field]) ?? undefined;
  }

  return normalizedRow as NormalizedImportRow;
}
