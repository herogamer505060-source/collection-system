import { describe, expect, it } from "vitest";

import { getCustomersList } from "@/server/queries/customers/get-customers-list";

import { createRoleAssignment, createSessionUser } from "../helpers/session-user";
import { createReadModelFixture } from "../helpers/read-model-fixture";

describe("customers list query contract", () => {
  it("returns the documented customer list payload shape", async () => {
    const result = await getCustomersList(
      {
        page: 1,
        pageSize: 50,
        paymentStatus: "all",
        sessionUser: createSessionUser({ roles: [createRoleAssignment("manager")] }),
      },
      {
        loadReadModelData: async () => createReadModelFixture(),
      },
    );

    expect(result).toEqual({
      filters: {
        page: 1,
        pageSize: 50,
        paymentStatus: "all",
        projectId: null,
        search: null,
      },
      items: [
        {
          contractCount: 2,
          customerId: "customer-ahmed",
          customerName: "أحمد علي",
          email: null,
          mobile: null,
          paymentStatus: "has_overdue",
          projectIds: ["project-parco", "project-centro"],
          projectNames: ["إل باركو", "إل سنترو"],
          totals: {
            amountCollected: 500,
            amountDue: 2000,
            amountOutstanding: 1500,
            penaltyAmount: 25,
          },
        },
        {
          contractCount: 1,
          customerId: "customer-mona",
          customerName: "منى سمير",
          email: null,
          mobile: null,
          paymentStatus: "all_paid",
          projectIds: ["project-parco"],
          projectNames: ["إل باركو"],
          totals: {
            amountCollected: 1000,
            amountDue: 1000,
            amountOutstanding: 0,
            penaltyAmount: 0,
          },
        },
      ],
      page: 1,
      pageSize: 50,
      projectOptions: [
        { id: "project-parco", label: "إل باركو" },
        { id: "project-centro", label: "إل سنترو" },
      ],
      totalCount: 2,
    });
  });
});
