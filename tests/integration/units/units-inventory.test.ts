import { describe, expect, it } from "vitest";

import { getUnitDetail } from "@/server/queries/units/get-unit-detail";
import { getUnitsList } from "@/server/queries/units/get-units-list";

import { createReadModelFixture } from "../../helpers/read-model-fixture";
import { createRoleAssignment, createSessionUser } from "../../helpers/session-user";

describe("units inventory integration", () => {
  it("filters units by project and status, then drills through sold units to linked contracts", async () => {
    const fixture = createReadModelFixture();
    const sessionUser = createSessionUser({ roles: [createRoleAssignment("manager")] });
    const dependencies = {
      loadReadModelData: async () => fixture,
    };

    const soldParcoUnits = await getUnitsList(
      {
        projectId: "project-parco",
        sessionUser,
        status: "sold",
      },
      dependencies,
    );

    expect(soldParcoUnits.totalCount).toBe(2);
    expect(soldParcoUnits.items).toEqual([
      expect.objectContaining({
        linkedContract: expect.objectContaining({ contractId: "contract-ahmed-parco" }),
        projectId: "project-parco",
        unitCode: "B28",
        unitStatus: "sold",
      }),
      expect.objectContaining({
        linkedContract: expect.objectContaining({ contractId: "contract-mona-parco" }),
        projectId: "project-parco",
        unitCode: "B30",
        unitStatus: "sold",
      }),
    ]);

    const soldUnitDetail = await getUnitDetail(
      {
        sessionUser,
        unitId: "unit-b28",
      },
      dependencies,
    );

    expect(soldUnitDetail).toEqual({
      linkedContract: {
        contractCode: "PAR-001",
        contractId: "contract-ahmed-parco",
        contractStatus: "active",
        customerId: "customer-ahmed",
        customerName: "أحمد علي",
      },
      unit: {
        builtUpArea: 100,
        contractPrice: 1000000,
        floorName: "Ground",
        gardenArea: 0,
        listPrice: 1000000,
        projectId: "project-parco",
        projectName: "IL Parco",
        sourceAvailable: false,
        sourceSold: true,
        statusConflict: false,
        unitCode: "B28",
        unitId: "unit-b28",
        unitStatus: "sold",
      },
    });

    const availableUnitDetail = await getUnitDetail(
      {
        sessionUser,
        unitId: "unit-a10",
      },
      dependencies,
    );

    expect(availableUnitDetail?.linkedContract).toBeNull();
    expect(availableUnitDetail?.unit).toMatchObject({
      projectId: "project-parco",
      unitCode: "A10",
      unitStatus: "available",
    });
  });
});
