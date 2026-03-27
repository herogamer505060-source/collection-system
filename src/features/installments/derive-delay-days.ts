import { differenceInEgyptCalendarDays, isPastEgyptDate } from "@/lib/dates/egypt";

import { derivePaymentStatus, type DerivePaymentStatusInput } from "./derive-payment-status";

type DeriveDelayDaysInput = DerivePaymentStatusInput;

export function deriveDelayDays(input: DeriveDelayDaysInput): number {
  const paymentStatus = derivePaymentStatus(input);

  if (paymentStatus === "paid" || !isPastEgyptDate(input.dueDate, input.today)) {
    return 0;
  }

  return differenceInEgyptCalendarDays(input.today ?? new Date(), input.dueDate);
}
