import { describe, expect, it } from "vitest";

import { normalizeImportRow } from "@/features/imports/normalization/normalize-import-row";
import { validateImportRow } from "@/features/imports/validators/validate-import-row";

describe("validateImportRow", () => {
  it("returns Arabic blocking issues for invalid installment rows", () => {
    const normalizedRow = normalizeImportRow({
      amountDue: "not-a-number",
      customerName: "   ",
      dueDate: "32/13/2026",
      installmentCode: "",
      installmentType: "",
      projectName: "IL Parko",
      sourceRowNumber: 45,
      unitCode: "",
    });

    const result = validateImportRow(normalizedRow, { importType: "installments" });

    expect(result.isValid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          issueType: "unknown_project",
          messageAr: "اسم المشروع غير معروف: IL Parko",
          severity: "high",
          sourceRowNumber: 45,
        }),
        expect.objectContaining({
          fieldLabel: "قيمة القسط",
          issueType: "invalid_money",
        }),
        expect.objectContaining({
          fieldLabel: "تاريخ القسط",
          issueType: "invalid_date",
        }),
        expect.objectContaining({
          fieldLabel: "كود القسط",
          issueType: "missing_required_field",
        }),
      ]),
    );
  });

  it("rejects composite unit codes inside unit inventory rows", () => {
    const normalizedRow = normalizeImportRow({
      projectName: "IL Parco",
      sourceRowNumber: 12,
      unitCode: "B28+B29",
    });

    const result = validateImportRow(normalizedRow, { importType: "sold_units" });

    expect(result.isValid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        issueType: "invalid_unit_code",
        rawValue: "B28+B29",
        severity: "high",
        sourceRowNumber: 12,
      }),
    );
  });
});
