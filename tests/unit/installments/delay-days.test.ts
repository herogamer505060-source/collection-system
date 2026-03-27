import { describe, expect, it } from "vitest";

import { deriveDelayDays } from "@/features/installments/derive-delay-days";

describe("deriveDelayDays", () => {
  it("returns zero when installment is fully paid", () => {
    expect(
      deriveDelayDays({
        amountCollected: 1000,
        amountOutstanding: 0,
        dueDate: "2026-03-01",
        today: "2026-03-24",
      }),
    ).toBe(0);
  });

  it("returns zero when due date has not passed", () => {
    expect(
      deriveDelayDays({
        amountCollected: 0,
        amountOutstanding: 1000,
        dueDate: "2026-03-25",
        today: "2026-03-24",
      }),
    ).toBe(0);
  });

  it("returns calendar day difference for overdue installments", () => {
    expect(
      deriveDelayDays({
        amountCollected: 0,
        amountOutstanding: 1000,
        dueDate: "2026-03-10",
        today: "2026-03-24",
      }),
    ).toBe(14);
  });
});
