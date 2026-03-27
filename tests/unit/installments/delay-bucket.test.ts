import { describe, expect, it } from "vitest";

import { deriveDelayBucket } from "@/features/installments/derive-delay-bucket";

describe("deriveDelayBucket", () => {
  it.each([
    { bucket: "not_due", value: 0 },
    { bucket: "1_30", value: 1 },
    { bucket: "1_30", value: 12 },
    { bucket: "1_30", value: 30 },
    { bucket: "31_60", value: 31 },
    { bucket: "31_60", value: 45 },
    { bucket: "31_60", value: 60 },
    { bucket: "61_90", value: 61 },
    { bucket: "61_90", value: 72 },
    { bucket: "61_90", value: 90 },
    { bucket: "90_plus", value: 91 },
    { bucket: "90_plus", value: 120 },
  ])("maps $value days to $bucket", ({ bucket, value }) => {
    expect(deriveDelayBucket(value)).toBe(bucket);
  });
});
