import { describe, expect, it } from "vitest";

import { createFollowUp } from "@/server/services/follow-ups-service";
import { getCustomerProfile } from "@/server/queries/customers/get-customer-profile";
import { getFollowUpsList } from "@/server/queries/follow-ups/get-follow-ups-list";
import { getPromisesDue } from "@/server/queries/follow-ups/get-promises-due";
import type { Tables, TablesInsert } from "@/types/database";

import { createReadModelFixture } from "../../helpers/read-model-fixture";
import { createRoleAssignment, createSessionUser } from "../../helpers/session-user";

describe("follow-up management integration", () => {
  it("creates a follow-up and surfaces it in customer profile, follow-up list, and promises due", async () => {
    const store = structuredClone(createReadModelFixture());
    const sessionUser = createSessionUser({ roles: [createRoleAssignment("manager")] });

    const created = await createFollowUp(
      {
        payload: {
          contactType: "call",
          contractId: "contract-ahmed-parco",
          customerId: "customer-ahmed",
          customerResponse: "سيتم السداد غدا",
          followUpDate: "2026-03-26T09:00:00Z",
          nextActionDate: "2026-03-28",
          note: "متابعة جديدة قبل الوعد",
          promiseDate: "2026-03-27",
          promisedToPay: true,
        },
        sessionUser,
      },
      createFollowUpDependencies(store),
    );

    expect(created).toMatchObject({
      contractId: "contract-ahmed-parco",
      customerId: "customer-ahmed",
      followUpStatus: "open",
      note: "متابعة جديدة قبل الوعد",
    });

    const loadReadModelData = async () => store;
    const followUpsList = await getFollowUpsList(
      {
        promisedToPayOnly: true,
        sessionUser,
      },
      { loadReadModelData },
    );

    expect(followUpsList.items[0]).toMatchObject({
      contractId: "contract-ahmed-parco",
      customerName: "أحمد علي",
      note: "متابعة جديدة قبل الوعد",
      promiseDate: "2026-03-27",
      promisedToPay: true,
    });

    const profile = await getCustomerProfile(
      {
        customerId: "customer-ahmed",
        sessionUser,
      },
      { loadReadModelData },
    );

    expect(profile?.followUps[0]).toMatchObject({
      note: "متابعة جديدة قبل الوعد",
      promiseDate: "2026-03-27",
      promisedToPay: true,
    });

    const promisesDue = await getPromisesDue(
      {
        asOfDate: "2026-03-26",
        sessionUser,
      },
      { loadReadModelData },
    );

    expect(promisesDue.items).toContainEqual(
      expect.objectContaining({
        contractCode: "PAR-001",
        customerId: "customer-ahmed",
        customerName: "أحمد علي",
        note: "متابعة جديدة قبل الوعد",
        outstandingAmount: 1000,
        promiseDate: "2026-03-27",
      }),
    );
  });
});

function createFollowUpDependencies(store: ReturnType<typeof createReadModelFixture>) {
  return {
    async getContractById(contractId: string) {
      return store.contracts.find((contract) => contract.id === contractId) ?? null;
    },
    async getCustomerById(customerId: string) {
      return store.customers.find((customer) => customer.id === customerId) ?? null;
    },
    async insertFollowUp(payload: TablesInsert<"follow_ups">) {
      const row: Tables<"follow_ups"> = {
        collector_user_id: payload.collector_user_id ?? null,
        contact_type: payload.contact_type,
        contract_id: payload.contract_id ?? null,
        created_at: "2026-03-26T09:00:00Z",
        created_by: payload.created_by,
        customer_id: payload.customer_id,
        customer_response: payload.customer_response ?? null,
        follow_up_date: payload.follow_up_date,
        follow_up_status: payload.follow_up_status ?? "open",
        id: `follow-up-${store.followUps.length + 1}`,
        next_action_date: payload.next_action_date ?? null,
        note: payload.note,
        promise_date: payload.promise_date ?? null,
        promised_to_pay: payload.promised_to_pay ?? false,
        updated_at: "2026-03-26T09:00:00Z",
      };

      store.followUps.unshift(row);

      return row;
    },
    async listContractsByCustomerId(customerId: string) {
      return store.contracts.filter((contract) => contract.customer_id === customerId);
    },
  };
}
