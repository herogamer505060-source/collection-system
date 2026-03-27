import { describe, expect, it } from "vitest";

import { getContractDetail } from "@/server/queries/contracts/get-contract-detail";
import { getContractsList } from "@/server/queries/contracts/get-contracts-list";
import { getCustomerProfile } from "@/server/queries/customers/get-customer-profile";
import { getCustomersList } from "@/server/queries/customers/get-customers-list";
import { getInstallmentsList } from "@/server/queries/installments/get-installments-list";

import { createRoleAssignment, createSessionUser } from "../../helpers/session-user";
import { createReadModelFixture } from "../../helpers/read-model-fixture";

describe("customer profile flow integration", () => {
  it("supports Arabic search and profile drill-down across customer, contract, and installment views", async () => {
    const sessionUser = createSessionUser({ roles: [createRoleAssignment("manager")] });
    const fixture = createReadModelFixture();
    const dependencies = {
      loadReadModelData: async () => fixture,
    };

    const customers = await getCustomersList(
      {
        search: "احمد",
        sessionUser,
      },
      dependencies,
    );

    expect(customers.totalCount).toBe(1);
    expect(customers.items[0]).toMatchObject({
      customerId: "customer-ahmed",
      paymentStatus: "has_overdue",
    });

    const profile = await getCustomerProfile(
      {
        customerId: customers.items[0].customerId,
        sessionUser,
      },
      dependencies,
    );

    expect(profile?.contracts).toHaveLength(2);
    expect(profile?.followUps).toHaveLength(2);
    expect(profile?.totals.amountOutstanding).toBe(1500);

    const contracts = await getContractsList(
      {
        search: "F7",
        sessionUser,
      },
      dependencies,
    );

    expect(contracts.totalCount).toBe(1);
    expect(contracts.items[0]).toMatchObject({
      contractId: "contract-ahmed-centro",
      contractStatus: "partial",
      unitCodes: ["F7"],
    });

    const contractDetail = await getContractDetail(
      {
        contractId: contracts.items[0].contractId,
        sessionUser,
      },
      dependencies,
    );

    expect(contractDetail?.contract.customer.customerName).toBe("أحمد علي");
    expect(contractDetail?.units).toHaveLength(1);
    expect(contractDetail?.installments[0]).toMatchObject({
      installmentCode: "INST-2",
      paymentStatus: "partial",
    });

    const installments = await getInstallmentsList(
      {
        customerId: "customer-ahmed",
        paymentStatus: "overdue",
        sessionUser,
      },
      dependencies,
    );

    expect(installments.totalCount).toBe(1);
    expect(installments.items[0]).toMatchObject({
      customerName: "أحمد علي",
      installmentCode: "INST-1",
      paymentStatus: "overdue",
    });
    expect(installments.summary).toEqual({
      amountCollected: 0,
      amountDue: 1000,
      amountOutstanding: 1000,
      penaltyAmount: 25,
    });
  });
});
