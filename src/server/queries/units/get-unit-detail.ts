import type { SessionUser } from "@/lib/auth/get-session-user";
import { requirePermission } from "@/lib/auth/permissions";
import { canAccessContract } from "@/lib/auth/role-scopes";

import {
  buildContractByUnitId,
  buildCustomerById,
  buildProjectById,
  filterUnitsByScope,
  loadReadModelData,
} from "@/server/queries/read-model-helpers";

export type UnitDetailResult = {
  linkedContract: null | {
    contractCode: string | null;
    contractId: string;
    contractStatus: string;
    customerId: string;
    customerName: string;
  };
  unit: {
    builtUpArea: number | null;
    contractPrice: number | null;
    floorName: string | null;
    gardenArea: number | null;
    listPrice: number | null;
    projectId: string;
    projectName: string;
    sourceAvailable: boolean;
    sourceSold: boolean;
    statusConflict: boolean;
    unitCode: string;
    unitId: string;
    unitStatus: string;
  };
};

type GetUnitDetailDependencies = {
  loadReadModelData: typeof loadReadModelData;
};

export async function getUnitDetail(
  input: { sessionUser: SessionUser; unitId: string },
  dependencies: GetUnitDetailDependencies = { loadReadModelData },
): Promise<UnitDetailResult | null> {
  requirePermission(input.sessionUser, "units.read");

  const data = await dependencies.loadReadModelData({ sessionUser: input.sessionUser });
  const unit = filterUnitsByScope(input.sessionUser, data.units).find((item) => item.id === input.unitId);

  if (!unit) {
    return null;
  }

  const contractByUnitId = buildContractByUnitId(data);
  const customerById = buildCustomerById(data.customers);
  const projectById = buildProjectById(data.projects);
  const contract = contractByUnitId.get(unit.id);
  const canReadLinkedContract = Boolean(
    contract &&
      canAccessContract(input.sessionUser, {
        collectorUserId: contract.collector_user_id,
        projectId: contract.project_id,
      }),
  );

  return {
    linkedContract: contract && canReadLinkedContract
      ? {
          contractCode: contract.contract_code,
          contractId: contract.id,
          contractStatus: contract.contract_status,
          customerId: contract.customer_id,
          customerName: customerById.get(contract.customer_id)?.customer_name ?? contract.customer_id,
        }
      : null,
    unit: {
      builtUpArea: unit.built_up_area,
      contractPrice: unit.contract_price,
      floorName: unit.floor_name,
      gardenArea: unit.garden_area,
      listPrice: unit.list_price,
      projectId: unit.project_id,
      projectName: projectById.get(unit.project_id)?.name_en ?? unit.project_id,
      sourceAvailable: unit.source_available,
      sourceSold: unit.source_sold,
      statusConflict: unit.status_conflict,
      unitCode: unit.unit_code,
      unitId: unit.id,
      unitStatus: unit.unit_status,
    },
  };
}
