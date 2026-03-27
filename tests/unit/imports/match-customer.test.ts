import { describe, expect, it } from "vitest";

import {
  buildCustomerImportKey,
  matchCustomerByImportKey,
} from "@/features/imports/matching/match-customer";

describe("matchCustomerByImportKey", () => {
  it("builds stable project-scoped customer keys", () => {
    expect(buildCustomerImportKey(" Parco ", "  ahmed ali ")).toBe("parco::ahmed ali");
  });

  it("matches by project-scoped import key", () => {
    const match = matchCustomerByImportKey(
      [
        {
          customer_id: "customer-1",
          customer_import_key: "parco::ahmed ali",
          normalized_name: "ahmed ali",
          project_id: "project-parco",
        },
      ],
      "parco",
      "ahmed ali",
    );

    expect(match?.customer_id).toBe("customer-1");
  });

  it("does not match the same normalized name in another project", () => {
    const match = matchCustomerByImportKey(
      [
        {
          customer_id: "customer-1",
          customer_import_key: "centro::ahmed ali",
          normalized_name: "ahmed ali",
          project_id: "project-centro",
        },
      ],
      "parco",
      "ahmed ali",
    );

    expect(match).toBeNull();
  });
});
