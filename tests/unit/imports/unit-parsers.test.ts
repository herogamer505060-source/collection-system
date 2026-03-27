import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseAvailableUnitsWorkbook } from "@/features/imports/parsers/available-units-parser";
import { parseSoldUnitsWorkbook } from "@/features/imports/parsers/sold-units-parser";

describe("unit workbook parsers", () => {
  it("parses sold units and skips subtotal rows", async () => {
    const workbook = await readFile(
      path.join(process.cwd(), "excel raw data", "تم بيعها بالفعل.xlsx"),
    );

    const parsed = await parseSoldUnitsWorkbook(workbook);

    expect(parsed.headerRowNumber).toBe(1);
    expect(parsed.rows).toHaveLength(153);
    expect(parsed.rows[0]).toMatchObject({
      contractPrice: 2554871.0000008,
      projectName: "IL Centro",
      sourceRowNumber: 2,
      sourceType: "sold_units_report",
      unitCode: "IL Centro - B22",
      unitStatus: "sold",
    });
    expect(parsed.rows.some((row) => row.unitCode === "Caza")).toBe(false);
  });

  it("parses available units and skips subtotal rows", async () => {
    const workbook = await readFile(
      path.join(process.cwd(), "excel raw data", "متاحه لم تباع.xlsx"),
    );

    const parsed = await parseAvailableUnitsWorkbook(workbook);

    expect(parsed.headerRowNumber).toBe(1);
    expect(parsed.rows).toHaveLength(346);
    expect(parsed.rows[0]).toMatchObject({
      listPrice: 3336949,
      projectName: "IL Centro",
      sourceRowNumber: 2,
      sourceType: "available_units_report",
      unitCode: "IL Centro-B10",
      unitStatus: "available",
    });
    expect(parsed.rows.some((row) => row.unitCode === "إجمالي")).toBe(false);
  });
});
