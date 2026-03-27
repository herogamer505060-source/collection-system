import { describe, expect, it } from "vitest";

import { getDashboardKpis } from "@/server/queries/dashboard/get-dashboard-kpis";
import { getRecentFollowUps } from "@/server/queries/dashboard/get-recent-follow-ups";
import { getTopOverdueCustomers } from "@/server/queries/dashboard/get-top-overdue-customers";

import { createReadModelFixture } from "../../helpers/read-model-fixture";
import { createRoleAssignment, createSessionUser } from "../../helpers/session-user";

describe("dashboard KPI integration", () => {
  it("filters dashboard aggregates and ranked results by project", async () => {
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

    const allProjects = await getDashboardKpis({ sessionUser }, dependencies);
    const parcoOnly = await getDashboardKpis(
      { projectId: "project-parco", sessionUser },
      dependencies,
    );
    const centroOnly = await getDashboardKpis(
      { projectId: "project-centro", sessionUser },
      dependencies,
    );

    expect(allProjects).toMatchObject({
      customersOverdue: 1,
      customersPaid: 1,
      customersUnpaid: 0,
      openPromises: 1,
      totalCollected: 1500,
      totalDue: 3000,
      totalOutstanding: 1500,
      totalOverdue: 1000,
    });
    expect(allProjects.topOverdueCustomers).toEqual([
      {
        customerId: "customer-ahmed",
        customerName: "أحمد علي",
        lastFollowUpDate: "2026-03-20",
        projectName: "إل باركو",
        totalOverdue: 1000,
      },
    ]);
    expect(allProjects.recentFollowUps).toHaveLength(2);

    expect(parcoOnly).toMatchObject({
      customersOverdue: 1,
      customersPaid: 1,
      customersUnpaid: 0,
      openPromises: 1,
      totalCollected: 1000,
      totalDue: 2000,
      totalOutstanding: 1000,
      totalOverdue: 1000,
      totalPenalties: 25,
    });
    expect(parcoOnly.topOverdueCustomers).toEqual([
      {
        customerId: "customer-ahmed",
        customerName: "أحمد علي",
        lastFollowUpDate: "2026-03-20",
        projectName: "إل باركو",
        totalOverdue: 1000,
      },
    ]);
    expect(parcoOnly.recentFollowUps).toEqual([
      {
        customerName: "أحمد علي",
        followUpDate: "2026-03-20",
        id: "follow-up-1",
        summary: "تم التواصل بخصوص قسط متأخر",
      },
    ]);

    expect(centroOnly).toMatchObject({
      customersOverdue: 0,
      customersPaid: 0,
      customersUnpaid: 1,
      openPromises: 0,
      totalCollected: 500,
      totalDue: 1000,
      totalOutstanding: 500,
      totalOverdue: 0,
      totalPenalties: 0,
    });
    expect(centroOnly.topOverdueCustomers).toEqual([]);
    expect(centroOnly.recentFollowUps).toEqual([
      {
        customerName: "أحمد علي",
        followUpDate: "2026-03-10",
        id: "follow-up-2",
        summary: "متابعة على عقد آخر",
      },
    ]);
  });
});
