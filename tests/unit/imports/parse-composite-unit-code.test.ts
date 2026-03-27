import { describe, expect, it } from "vitest";

async function loadParseCompositeUnitCodeModule() {
  const modulePath = "../../../src/features/imports/normalization/parse-composite-unit-code.ts";
  return import(modulePath);
}

describe("parseCompositeUnitCode", () => {
  it("splits plus-separated unit codes into ordered tokens", async () => {
    const { parseCompositeUnitCode } = await loadParseCompositeUnitCodeModule();

    expect(parseCompositeUnitCode("B28+B29")).toEqual(["B28", "B29"]);
  });

  it("handles repeated prefixes joined by hyphens", async () => {
    const { parseCompositeUnitCode } = await loadParseCompositeUnitCodeModule();

    expect(parseCompositeUnitCode("T1-T2-T3-T4-T5-T6")).toEqual([
      "T1",
      "T2",
      "T3",
      "T4",
      "T5",
      "T6",
    ]);
  });

  it("normalizes mixed separators and surrounding whitespace", async () => {
    const { parseCompositeUnitCode } = await loadParseCompositeUnitCodeModule();

    expect(parseCompositeUnitCode(" G3 + G4 - G5 ")).toEqual(["G3", "G4", "G5"]);
  });
});
