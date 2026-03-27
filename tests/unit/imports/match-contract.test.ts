import { describe, expect, it } from "vitest";

import { buildContractKey, matchContractByKey } from "@/features/imports/matching/match-contract";

describe("matchContractByKey", () => {
  it("builds a deterministic fallback contract key from customer identity and sorted units", () => {
    expect(
      buildContractKey({
        customerImportKey: "parco::ahmed ali",
        unitCodes: ["B29", "B28", "B28"],
      }),
    ).toBe("parco::ahmed ali::B28+B29");
  });

  it("matches an existing contract by the deterministic key", () => {
    const match = matchContractByKey(
      [
        {
          collector_user_id: null,
          contract_code: null,
          contract_key: "parco::ahmed ali::B28+B29",
          customer_id: "customer-1",
          id: "contract-1",
          project_id: "project-parco",
        },
      ],
      {
        customerImportKey: "parco::ahmed ali",
        unitCodes: ["B28", "B29"],
      },
    );

    expect(match?.id).toBe("contract-1");
  });
});
