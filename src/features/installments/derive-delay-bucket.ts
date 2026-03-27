export type DelayBucket = "not_due" | "1_30" | "31_60" | "61_90" | "90_plus";

export function deriveDelayBucket(delayDays: number): DelayBucket {
  if (delayDays <= 0) {
    return "not_due";
  }

  if (delayDays <= 30) {
    return "1_30";
  }

  if (delayDays <= 60) {
    return "31_60";
  }

  if (delayDays <= 90) {
    return "61_90";
  }

  return "90_plus";
}
