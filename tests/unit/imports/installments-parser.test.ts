import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseInstallmentsWorkbook } from "@/features/imports/parsers/installments-parser";

describe("parseInstallmentsWorkbook", () => {
  it("parses the source workbook and skips summary rows", async () => {
    const workbook = await readFile(
      path.join(process.cwd(), "excel raw data", "Rep_REI006 (5).xlsx"),
    );

    const parsed = await parseInstallmentsWorkbook(workbook);

    expect(parsed.headerRowNumber).toBe(1);
    expect(parsed.detectedColumns).toContain("كود القسط");
    expect(parsed.detectedColumns).toContain("Customer");
    expect(parsed.rows).toHaveLength(2130);
    expect(parsed.rows[0]).toMatchObject({
      amountDue: 175500,
      installmentCode: "2024123101",
      projectName: "IL Centro",
      sourceRowNumber: 2,
      sourceType: "installments_report",
      unitCode: "IL Centro-B21",
    });
    expect(parsed.rows.at(-1)).toMatchObject({
      installmentCode: "2026030932",
      sourceRowNumber: 2131,
    });
    expect(parsed.rows.some((row) => row.installmentCode === "المشروع")).toBe(false);
  });
});
