import { isPastEgyptDate } from "@/lib/dates/egypt";

export type PaymentStatus = "paid" | "partial" | "unpaid" | "overdue";

export type DerivePaymentStatusInput = {
  amountCollected?: number | null;
  amountDue?: number | null;
  amountOutstanding?: number | null;
  dueDate: Date | string;
  today?: Date | string;
};

function normalizeAmount(value: number | null | undefined): number {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 0;
  }

  return value;
}

export function derivePaymentStatus(input: DerivePaymentStatusInput): PaymentStatus {
  const amountCollected = normalizeAmount(input.amountCollected);
  const amountOutstanding =
    input.amountOutstanding === null || input.amountOutstanding === undefined
      ? Math.max(0, normalizeAmount(input.amountDue) - amountCollected)
      : Math.max(0, normalizeAmount(input.amountOutstanding));

  if (amountOutstanding <= 0) {
    return "paid";
  }

  if (isPastEgyptDate(input.dueDate, input.today)) {
    return "overdue";
  }

  if (amountCollected > 0) {
    return "partial";
  }

  return "unpaid";
}
