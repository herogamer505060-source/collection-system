import { describe, expect, it } from "vitest";

import { getDashboardKpis } from "@/server/queries/dashboard/get-dashboard-kpis";
import { getRecentFollowUps } from "@/server/queries/dashboard/get-recent-follow-ups";
import { getTopOverdueCustomers } from "@/server/queries/dashboard/get-top-overdue-customers";

import { createReadModelFixture } from "../../helpers/read-model-fixture";
import { createRoleAssignment, createSessionUser } from "../../helpers/session-user";

describe("dashboard reconciliation", () => {
  it("reconciles dashboard aggregates against the imported source fixture totals", async () => {
    const fixture = createReadModelFixture();
    const sessionUser = createSessionUser({ roles: [createRoleAssignment("manager")] });
    const dependencies = {
      getLastImportAt: async () => "2026-03-22T16:00:00Z",
      getRecentFollowUps: (input: Parameters<typeof getRecentFollowUps>[0]) =>
        getRecentFollowUps(input, { loadReadModelData: async () => fixture }),
      getTopOverdueCustomers: (input: Parameters<typeof getTopOverdueCustomers>[0]) =>
        getTopOverdueCustomers(input, { loadReadModelData: async () => fixture }),
      loadReadModelData: async () => fixture,
    };
    const result = await getDashboardKpis({ sessionUser }, dependencies);
    const expectedTotals = fixture.installments.reduce(
      (totals, installment) => ({
        collected: totals.collected + installment.amount_collected,
        due: totals.due + installment.amount_due,
        overdue: totals.overdue + (installment.payment_status === "overdue" ? installment.amount_outstanding : 0),
        outstanding: totals.outstanding + installment.amount_outstanding,
        penalties: totals.penalties + installment.penalty_amount,
      }),
      {
        collected: 0,
        due: 0,
        overdue: 0,
        outstanding: 0,
        penalties: 0,
      },
    );

    expect(result.totalDue).toBe(expectedTotals.due);
    expect(result.totalCollected).toBe(expectedTotals.collected);
    expect(result.totalOutstanding).toBe(expectedTotals.outstanding);
    expect(result.totalOverdue).toBe(expectedTotals.overdue);
    expect(result.totalPenalties).toBe(expectedTotals.penalties);
    expect(result.collectionPercentage).toBe(50);
    expect(result.customersPaid).toBe(1);
    expect(result.customersUnpaid).toBe(0);
    expect(result.customersOverdue).toBe(1);
    expect(result.openPromises).toBe(1);
    expect(result.topOverdueCustomers[0]).toMatchObject({
      customerId: "customer-ahmed",
      totalOverdue: 1000,
    });
    expect(result.recentFollowUps[0]).toMatchObject({
      customerName: "أحمد علي",
      id: "follow-up-1",
    });
  });
});
