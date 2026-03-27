import { describe, expect, it } from "vitest";

import { getUnitsList } from "@/server/queries/units/get-units-list";

import { createReadModelFixture } from "../helpers/read-model-fixture";
import { createRoleAssignment, createSessionUser } from "../helpers/session-user";

describe("units inventory query contract", () => {
  it("returns the documented units inventory payload shape", async () => {
    const result = await getUnitsList(
      {
        page: 1,
        pageSize: 50,
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
        projectId: null,
        search: null,
        status: null,
      },
      items: [
        {
          builtUpArea: 100,
          contractPrice: null,
          floorName: "Ground",
          gardenArea: 0,
          linkedContract: null,
          listPrice: 750000,
          projectId: "project-parco",
          projectName: "إل باركو",
          statusConflict: false,
          unitCode: "A10",
          unitId: "unit-a10",
          unitStatus: "available",
        },
        {
          builtUpArea: 100,
          contractPrice: 1000000,
          floorName: "Ground",
          gardenArea: 0,
          linkedContract: {
            contractCode: "PAR-001",
            contractId: "contract-ahmed-parco",
            customerId: "customer-ahmed",
            customerName: "أحمد علي",
          },
          listPrice: 1000000,
          projectId: "project-parco",
          projectName: "إل باركو",
          statusConflict: false,
          unitCode: "B28",
          unitId: "unit-b28",
          unitStatus: "sold",
        },
        {
          builtUpArea: 100,
          contractPrice: 1000000,
          floorName: "Ground",
          gardenArea: 0,
          linkedContract: {
            contractCode: "PAR-050",
            contractId: "contract-mona-parco",
            customerId: "customer-mona",
            customerName: "منى سمير",
          },
          listPrice: 1000000,
          projectId: "project-parco",
          projectName: "إل باركو",
          statusConflict: false,
          unitCode: "B30",
          unitId: "unit-b30",
          unitStatus: "sold",
        },
        {
          builtUpArea: 100,
          contractPrice: 1000000,
          floorName: "Ground",
          gardenArea: 0,
          linkedContract: {
            contractCode: "CEN-009",
            contractId: "contract-ahmed-centro",
            customerId: "customer-ahmed",
            customerName: "أحمد علي",
          },
          listPrice: 1000000,
          projectId: "project-centro",
          projectName: "إل سنترو",
          statusConflict: false,
          unitCode: "F7",
          unitId: "unit-f7",
          unitStatus: "sold",
        },
      ],
      page: 1,
      pageSize: 50,
      projectOptions: [
        { id: "project-parco", label: "إل باركو" },
        { id: "project-centro", label: "إل سنترو" },
      ],
      totalCount: 4,
    });
  });
});
