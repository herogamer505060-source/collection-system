import { performance } from "node:perf_hooks";

import { describe, expect, it } from "vitest";

import { getCustomersList } from "@/server/queries/customers/get-customers-list";

import { createReadModelFixture } from "../../helpers/read-model-fixture";
import { createRoleAssignment, createSessionUser } from "../../helpers/session-user";

describe("customer search performance", () => {
  it("keeps Arabic customer search responsive while paginating after 50 rows", async () => {
    const fixture = createLargeCustomerFixture(180);
    const sessionUser = createSessionUser({ roles: [createRoleAssignment("manager")] });
    const loadReadModelData = async () => fixture;

    const start = performance.now();
    const firstPage = await getCustomersList(
      {
        page: 1,
        pageSize: 50,
        search: "عميل",
        sessionUser,
      },
      { loadReadModelData },
    );
    const secondWindow = await getCustomersList(
      {
        page: 4,
        pageSize: 50,
        search: "عميل",
        sessionUser,
      },
      { loadReadModelData },
    );
    const durationMs = performance.now() - start;

    expect(firstPage.totalCount).toBe(180);
    expect(firstPage.items).toHaveLength(50);
    expect(secondWindow.items).toHaveLength(30);
    expect(durationMs).toBeLessThan(500);
  });
});

function createLargeCustomerFixture(customerCount: number) {
  const fixture = createReadModelFixture();

  fixture.customers = [];
  fixture.contracts = [];
  fixture.contractUnits = [];
  fixture.installments = [];
  fixture.units = [];
  fixture.followUps = [];

  for (let index = 1; index <= customerCount; index += 1) {
    const customerId = `customer-load-${index}`;
    const contractId = `contract-load-${index}`;
    const unitId = `unit-load-${index}`;
    const installmentId = `installment-load-${index}`;
    const customerName = `عميل ${String(index).padStart(3, "0")}`;

    fixture.customers.push({
      created_at: "2026-03-01T00:00:00Z",
      customer_key: customerId,
      customer_name: customerName,
      customer_name_raw: customerName,
      email: null,
      id: customerId,
      mobile: null,
      national_id: null,
      normalized_name: customerName,
      notes: null,
      updated_at: "2026-03-01T00:00:00Z",
    });
    fixture.contracts.push({
      actual_delivery_date: null,
      collector_user_id: "collector-1",
      contract_code: `PAR-${String(index).padStart(3, "0")}`,
      contract_key: `parco::${customerId}`,
      contract_notes: null,
      contract_status: "active",
      created_at: "2026-03-01T00:00:00Z",
      customer_id: customerId,
      delivery_date: null,
      id: contractId,
      project_id: "project-parco",
      source_batch_id: null,
      updated_at: "2026-03-01T00:00:00Z",
    });
    fixture.units.push({
      built_up_area: 100,
      contract_price: 1000000,
      created_at: "2026-03-01T00:00:00Z",
      floor_name: "Ground",
      garden_area: 0,
      id: unitId,
      list_price: 1000000,
      other_area: null,
      project_id: "project-parco",
      source_available: false,
      source_batch_id: null,
      source_sold: true,
      status_conflict: false,
      unit_code: `L${index}`,
      unit_key: `parco::L${index}`,
      unit_status: "sold",
      updated_at: "2026-03-01T00:00:00Z",
    });
    fixture.contractUnits.push({
      contract_id: contractId,
      created_at: "2026-03-01T00:00:00Z",
      id: `link-load-${index}`,
      unit_id: unitId,
      unit_order: 1,
    });
    fixture.installments.push({
      amount_collected: 0,
      amount_due: 1000,
      amount_outstanding: 1000,
      commercial_paper: null,
      contract_id: contractId,
      created_at: "2026-03-01T00:00:00Z",
      delay_bucket: "1_30",
      delay_days: 3,
      due_date: "2026-03-01",
      id: installmentId,
      installment_code: `INST-L-${index}`,
      installment_key: `INST-L-${index}`,
      installment_type: "قسط",
      net_amount: null,
      payment_date: null,
      payment_status: "overdue",
      penalty_amount: 0,
      receipt_reference: null,
      source_batch_id: null,
      updated_at: "2026-03-01T00:00:00Z",
    });
  }

  return fixture;
}
