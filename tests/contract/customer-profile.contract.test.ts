import { describe, expect, it } from "vitest";

import { getCustomerProfile } from "@/server/queries/customers/get-customer-profile";

import { createRoleAssignment, createSessionUser } from "../helpers/session-user";
import { createReadModelFixture } from "../helpers/read-model-fixture";

describe("customer profile query contract", () => {
  it("returns the documented customer profile payload shape", async () => {
    const result = await getCustomerProfile(
      {
        customerId: "customer-ahmed",
        sessionUser: createSessionUser({ roles: [createRoleAssignment("manager")] }),
      },
      {
        loadReadModelData: async () => createReadModelFixture(),
      },
    );

    expect(result).toEqual({
      contracts: [
        {
          collectorName: "محصل أول",
          contractCode: "PAR-001",
          contractId: "contract-ahmed-parco",
          contractStatus: "overdue",
          projectId: "project-parco",
          projectName: "إل باركو",
          totals: {
            amountCollected: 0,
            amountDue: 1000,
            amountOutstanding: 1000,
            penaltyAmount: 25,
          },
          unitCodes: ["B28"],
        },
        {
          collectorName: "محصل أول",
          contractCode: "CEN-009",
          contractId: "contract-ahmed-centro",
          contractStatus: "partial",
          projectId: "project-centro",
          projectName: "إل سنترو",
          totals: {
            amountCollected: 500,
            amountDue: 1000,
            amountOutstanding: 500,
            penaltyAmount: 0,
          },
          unitCodes: ["F7"],
        },
      ],
      customer: {
        customerId: "customer-ahmed",
        customerName: "أحمد علي",
        customerNameRaw: "أحمد علي",
        email: null,
        mobile: null,
        nationalId: null,
        normalizedName: "احمد علي",
        notes: null,
      },
      followUps: [
        {
          collectorName: "محصل أول",
          collectorUserId: "collector-1",
          contactType: "call",
          contractId: "contract-ahmed-parco",
          followUpDate: "2026-03-20T10:00:00Z",
          followUpStatus: "open",
          id: "follow-up-1",
          nextActionDate: null,
          note: "تم التواصل بخصوص قسط متأخر",
          promiseDate: "2026-03-27",
          promisedToPay: true,
        },
        {
          collectorName: "محصل أول",
          collectorUserId: "collector-1",
          contactType: "call",
          contractId: "contract-ahmed-centro",
          followUpDate: "2026-03-10T10:00:00Z",
          followUpStatus: "open",
          id: "follow-up-2",
          nextActionDate: null,
          note: "متابعة على عقد آخر",
          promiseDate: null,
          promisedToPay: false,
        },
      ],
      installments: [
        {
          amountCollected: 500,
          amountDue: 1000,
          amountOutstanding: 500,
          contractCode: "CEN-009",
          contractId: "contract-ahmed-centro",
          delayDays: 0,
          dueDate: "2026-04-15",
          installmentCode: "INST-2",
          installmentId: "installment-2",
          installmentType: "قسط",
          paymentStatus: "partial",
          penaltyAmount: 0,
          projectId: "project-centro",
          projectName: "إل سنترو",
          unitCodes: ["F7"],
        },
        {
          amountCollected: 0,
          amountDue: 1000,
          amountOutstanding: 1000,
          contractCode: "PAR-001",
          contractId: "contract-ahmed-parco",
          delayDays: 10,
          dueDate: "2026-03-01",
          installmentCode: "INST-1",
          installmentId: "installment-1",
          installmentType: "قسط",
          paymentStatus: "overdue",
          penaltyAmount: 25,
          projectId: "project-parco",
          projectName: "إل باركو",
          unitCodes: ["B28"],
        },
      ],
      totals: {
        amountCollected: 500,
        amountDue: 2000,
        amountOutstanding: 1500,
        contractCount: 2,
        followUpCount: 2,
        overdueInstallments: 1,
        penaltyAmount: 25,
      },
    });
  });
});
