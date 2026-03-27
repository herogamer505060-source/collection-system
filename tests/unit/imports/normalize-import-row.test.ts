import { describe, expect, it } from "vitest";

async function loadNormalizeImportRowModule() {
  const modulePath = "../../../src/features/imports/normalization/normalize-import-row.ts";
  return import(modulePath);
}

describe("normalizeImportRow", () => {
  it("normalizes project, money, date, and composite unit values", async () => {
    const { normalizeImportRow } = await loadNormalizeImportRowModule();

    const normalized = normalizeImportRow({
      amountDue: "50,000",
      dueDate: "23/03/2026",
      penaltyAmount: "",
      projectName: " IL Parco ",
      sourceRowNumber: 12,
      unitCode: "B28 + B29",
    });

    expect(normalized).toMatchObject({
      amountDue: 50000,
      dueDate: "2026-03-23",
      penaltyAmount: 0,
      projectCode: "parco",
      sourceRowNumber: 12,
      unitCodes: ["B28", "B29"],
    });
  });

  it("preserves raw values needed for issue reporting when normalization fails", async () => {
    const { normalizeImportRow } = await loadNormalizeImportRowModule();

    const normalized = normalizeImportRow({
      amountDue: "not-a-number",
      dueDate: "invalid-date",
      projectName: "IL Parko",
      sourceRowNumber: 45,
      unitCode: "B21",
    });

    expect(normalized).toMatchObject({
      projectNameRaw: "IL Parko",
      sourceRowNumber: 45,
      unitCodes: ["B21"],
    });
  });
});
