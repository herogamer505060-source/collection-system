import { performance } from "node:perf_hooks";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseInstallmentsWorkbook } from "@/features/imports/parsers/installments-parser";

describe("installments import performance", () => {
  it("parses the installments workbook within the agreed local threshold and reports stable summary metrics", async () => {
    const workbook = await readFile(
      path.join(process.cwd(), "excel raw data", "Rep_REI006 (5).xlsx"),
    );

    const start = performance.now();
    const parsed = await parseInstallmentsWorkbook(workbook);
    const durationMs = performance.now() - start;

    expect(parsed.detectedColumns.length).toBeGreaterThanOrEqual(11);
    expect(parsed.headerRowNumber).toBe(1);
    expect(parsed.rawRowCount).toBe(2131);
    expect(parsed.rows).toHaveLength(2130);
    expect(parsed.skippedRowCount).toBe(1);
    expect(durationMs).toBeLessThan(10_000);
  });
});
