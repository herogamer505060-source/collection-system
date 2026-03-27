import { describe, expect, it } from "vitest";

import { deriveDelayBucket } from "@/features/installments/derive-delay-bucket";
import { deriveDelayDays } from "@/features/installments/derive-delay-days";
import { derivePaymentStatus } from "@/features/installments/derive-payment-status";
import { updateInstallmentSchema } from "@/features/installments/schemas/installment-form";

describe("installment update recalculation", () => {
  it("recalculates partial payment values", () => {
    const amountCollected = 40000;
    const amountDue = 100000;
    const amountOutstanding = Math.max(0, amountDue - amountCollected);
    const input = {
      amountCollected,
      amountDue,
      amountOutstanding,
      dueDate: "2026-04-10",
      today: "2026-03-24",
    };

    expect(amountOutstanding).toBe(60000);
    expect(derivePaymentStatus(input)).toBe("partial");
  });

  it("marks a fully paid installment as paid with no delay", () => {
    const amountCollected = 100000;
    const amountDue = 100000;
    const amountOutstanding = Math.max(0, amountDue - amountCollected);
    const input = {
      amountCollected,
      amountDue,
      amountOutstanding,
      dueDate: "2026-03-10",
      today: "2026-03-24",
    };

    const delayDays = deriveDelayDays(input);

    expect(amountOutstanding).toBe(0);
    expect(derivePaymentStatus(input)).toBe("paid");
    expect(delayDays).toBe(0);
    expect(deriveDelayBucket(delayDays)).toBe("not_due");
  });

  it("clamps overpayment to zero outstanding", () => {
    const amountCollected = 120000;
    const amountDue = 100000;
    const amountOutstanding = Math.max(0, amountDue - amountCollected);
    const input = {
      amountCollected,
      amountDue,
      amountOutstanding,
      dueDate: "2026-03-10",
      today: "2026-03-24",
    };

    expect(amountOutstanding).toBe(0);
    expect(derivePaymentStatus(input)).toBe("paid");
  });

  it("resets overdue delay metadata after full payment", () => {
    const amountCollected = 100000;
    const amountDue = 100000;
    const amountOutstanding = Math.max(0, amountDue - amountCollected);
    const input = {
      amountCollected,
      amountDue,
      amountOutstanding,
      dueDate: "2026-02-01",
      today: "2026-03-24",
    };

    const delayDays = deriveDelayDays(input);

    expect(delayDays).toBe(0);
    expect(deriveDelayBucket(delayDays)).toBe("not_due");
  });

  it("rejects negative collected amounts", () => {
    expect(() => updateInstallmentSchema.parse({ amountCollected: -5000 })).toThrowError();
  });
});
