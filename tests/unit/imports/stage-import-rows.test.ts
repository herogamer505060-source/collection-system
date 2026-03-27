import { describe, expect, it } from "vitest";

import { stageImportRows } from "@/features/imports/staging/stage-import-rows";

describe("stageImportRows", () => {
  it("keeps unmatched installment units as non-blocking preview issues", () => {
    const result = stageImportRows({
      batchType: "installments",
      matchingContext: {
        contractUnits: [],
        contracts: [],
        customerIdentities: [],
        installments: [],
        projects: [
          {
            id: "project-parco",
            name_ar: "إل باركو",
            name_en: "IL Parco",
            project_code: "parco",
          },
        ],
        units: [
          {
            contract_price: null,
            floor_name: null,
            garden_area: null,
            id: "unit-1",
            list_price: null,
            project_id: "project-parco",
            source_available: false,
            source_sold: true,
            status_conflict: false,
            unit_code: "B28",
            unit_key: "parco::B28",
            unit_status: "sold",
          },
        ],
      },
      parsedWorksheet: {
        detectedColumns: ["المشروع", "Customer", "كود الوحدة", "كود القسط"],
        headerRowNumber: 1,
        rawRowCount: 1,
        rows: [
          {
            amountCollected: "1000",
            amountDue: "1000",
            amountOutstanding: "0",
            commercialPaper: "123",
            customerName: "أحمد علي",
            dueDate: "01/03/2026",
            installmentCode: "INST-1",
            installmentType: "قسط",
            netAmount: "1000",
            projectName: "IL Parco",
            sourceRowNumber: 12,
            sourceType: "installments_report",
            unitCode: "B28+B29",
          },
        ],
        sheetName: "report",
        skippedRowCount: 0,
      },
    });

    expect(result.changeSummary).toMatchObject({
      contractsToCreate: 1,
      customersToCreate: 1,
      installmentsToCreate: 1,
      linksToCreate: 1,
    });
    expect(result.counts).toMatchObject({
      blockedRows: 0,
      issueRows: 1,
      totalRows: 1,
      validRows: 1,
    });
    expect(result.stagedRows[0]).toMatchObject({
      canApply: true,
      kind: "installment",
      missingUnitCodes: ["B29"],
      matchedUnitIds: ["unit-1"],
    });
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        issueType: "unmatched_unit",
        rawValue: "B29",
        severity: "medium",
        sourceRowNumber: 12,
      }),
    );
  });

  it("blocks sold-unit imports when an available record already exists", () => {
    const result = stageImportRows({
      batchType: "sold_units",
      matchingContext: {
        contractUnits: [],
        contracts: [],
        customerIdentities: [],
        installments: [],
        projects: [
          {
            id: "project-parco",
            name_ar: "إل باركو",
            name_en: "IL Parco",
            project_code: "parco",
          },
        ],
        units: [
          {
            contract_price: null,
            floor_name: null,
            garden_area: null,
            id: "unit-9",
            list_price: 500000,
            project_id: "project-parco",
            source_available: true,
            source_sold: false,
            status_conflict: false,
            unit_code: "B22",
            unit_key: "parco::B22",
            unit_status: "available",
          },
        ],
      },
      parsedWorksheet: {
        detectedColumns: ["المشروع", "الكود"],
        headerRowNumber: 1,
        rawRowCount: 1,
        rows: [
          {
            builtUpArea: "50",
            contractPrice: "600000",
            floorName: "Ground",
            gardenArea: "0",
            listPrice: null,
            projectName: "IL Parco",
            sourceRowNumber: 8,
            sourceType: "sold_units_report",
            unitCode: "B22",
            unitStatus: "sold",
          },
        ],
        sheetName: "report",
        skippedRowCount: 0,
      },
    });

    expect(result.counts).toMatchObject({
      blockedRows: 1,
      issueRows: 1,
      validRows: 0,
    });
    expect(result.stagedRows[0]).toMatchObject({
      canApply: false,
      hasBlockingIssues: true,
      kind: "unit",
    });
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        issueType: "duplicate_unit_status",
        rawValue: "B22",
        severity: "high",
        sourceRowNumber: 8,
      }),
    );
  });
});
