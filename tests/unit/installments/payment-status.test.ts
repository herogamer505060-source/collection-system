import { describe, expect, it } from "vitest";

import { derivePaymentStatus } from "@/features/installments/derive-payment-status";

describe("derivePaymentStatus", () => {
  it("returns paid when outstanding amount is zero", () => {
    expect(
      derivePaymentStatus({ amountCollected: 1000, amountOutstanding: 0, dueDate: "2026-03-20", today: "2026-03-24" }),
    ).toBe("paid");
  });

  it("returns partial when some money is collected and balance remains but not yet due", () => {
    expect(
      derivePaymentStatus({
        amountCollected: 500,
        amountOutstanding: 500,
        dueDate: "2026-04-15",
        today: "2026-03-24",
      }),
    ).toBe("partial");
  });

  it("returns overdue when unpaid and due date is in the past", () => {
    expect(
      derivePaymentStatus({
        amountCollected: 0,
        amountOutstanding: 1000,
        dueDate: "2026-03-10",
        today: "2026-03-24",
      }),
    ).toBe("overdue");
  });

  it("returns unpaid when nothing is collected and the due date is today or later", () => {
    expect(
      derivePaymentStatus({
        amountCollected: 0,
        amountOutstanding: 1000,
        dueDate: "2026-03-24",
        today: "2026-03-24",
      }),
    ).toBe("unpaid");
  });

  it("returns overdue (not partial) when partially paid but due date has passed — FR-021 precedence", () => {
    expect(
      derivePaymentStatus({
        amountCollected: 500,
        amountOutstanding: 500,
        dueDate: "2026-03-10",
        today: "2026-03-24",
      }),
    ).toBe("overdue");
  });
});
