import { describe, expect, it } from "vitest";

import { derivePenaltyAmount } from "@/features/installments/derive-penalty-amount";

describe("derivePenaltyAmount", () => {
  it("defaults empty values to zero", () => {
    expect(derivePenaltyAmount(undefined)).toBe(0);
    expect(derivePenaltyAmount("")).toBe(0);
  });

  it("normalizes formatted numeric strings", () => {
    expect(derivePenaltyAmount("1,250.50")).toBe(1250.5);
  });

  it("rejects negative values", () => {
    expect(() => derivePenaltyAmount(-10)).toThrow(RangeError);
  });

  it("rejects invalid values", () => {
    expect(() => derivePenaltyAmount("abc")).toThrow(TypeError);
  });
});
