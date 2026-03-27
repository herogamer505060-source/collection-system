import type { SessionUser } from "@/lib/auth/get-session-user";
import { requirePermission } from "@/lib/auth/permissions";
import { canAccessContract } from "@/lib/auth/role-scopes";

import {
  buildContractByUnitId,
  buildCustomerById,
  buildProjectById,
  filterUnitsByScope,
  loadReadModelData,
  paginate,
} from "@/server/queries/read-model-helpers";

export type UnitInventoryStatus = "available" | "sold";

export type UnitsListItem = {
  builtUpArea: number | null;
  contractPrice: number | null;
  floorName: string | null;
  gardenArea: number | null;
  linkedContract: null | {
    contractCode: string | null;
    contractId: string;
    customerId: string;
    customerName: string;
  };
  listPrice: number | null;
  projectId: string;
  projectName: string;
  statusConflict: boolean;
  unitCode: string;
  unitId: string;
  unitStatus: string;
};

export type GetUnitsListInput = {
  page?: number;
  pageSize?: number;
  projectId?: string;
  search?: string;
  sessionUser: SessionUser;
  status?: UnitInventoryStatus;
};

export type GetUnitsListResult = {
  filters: {
    page: number;
    pageSize: number;
    projectId: string | null;
    search: string | null;
    status: UnitInventoryStatus | null;
  };
  items: UnitsListItem[];
  page: number;
  pageSize: number;
  projectOptions: Array<{ id: string; label: string }>;
  totalCount: number;
};

type GetUnitsListDependencies = {
  loadReadModelData: typeof loadReadModelData;
};

export async function getUnitsList(
  input: GetUnitsListInput,
  dependencies: GetUnitsListDependencies = { loadReadModelData },
): Promise<GetUnitsListResult> {
  requirePermission(input.sessionUser, "units.read");

  const data = await dependencies.loadReadModelData({
    projectId: input.projectId,
    sessionUser: input.sessionUser,
  });
  const contractByUnitId = buildContractByUnitId(data);
  const customerById = buildCustomerById(data.customers);
  const projectById = buildProjectById(data.projects);
  const searchValue = input.search?.trim().toLowerCase() || undefined;
  const visibleUnits = filterUnitsByScope(input.sessionUser, data.units, input.projectId)
    .filter((unit) => (input.status ? unit.unit_status === input.status : true))
    .filter((unit) => {
      if (!searchValue) return true;
      const contract = contractByUnitId.get(unit.id);
      const customerName = contract ? customerById.get(contract.customer_id)?.customer_name ?? "" : "";
      return (
        unit.unit_code.toLowerCase().includes(searchValue) ||
        customerName.toLowerCase().includes(searchValue)
      );
    })
    .map((unit) => {
      const contract = contractByUnitId.get(unit.id);
      const canReadLinkedContract = Boolean(
        contract &&
          canAccessContract(input.sessionUser, {
            collectorUserId: contract.collector_user_id,
            projectId: contract.project_id,
          }),
      );

      return {
        builtUpArea: unit.built_up_area,
        contractPrice: unit.contract_price,
        floorName: unit.floor_name,
        gardenArea: unit.garden_area,
        linkedContract: contract && canReadLinkedContract
          ? {
              contractCode: contract.contract_code,
              contractId: contract.id,
              customerId: contract.customer_id,
              customerName: customerById.get(contract.customer_id)?.customer_name ?? contract.customer_id,
            }
          : null,
        listPrice: unit.list_price,
        projectId: unit.project_id,
        projectName: projectById.get(unit.project_id)?.name_ar ?? unit.project_id,
        statusConflict: unit.status_conflict,
        unitCode: unit.unit_code,
        unitId: unit.id,
        unitStatus: unit.unit_status,
      } satisfies UnitsListItem;
    })
    .sort((left, right) => {
      if (left.projectName !== right.projectName) {
        return left.projectName.localeCompare(right.projectName, "ar");
      }

      if (left.unitStatus !== right.unitStatus) {
        return left.unitStatus.localeCompare(right.unitStatus, "ar");
      }

      return left.unitCode.localeCompare(right.unitCode, "en");
    });
  const pagination = paginate(visibleUnits, input.page, input.pageSize);

  return {
    filters: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      projectId: input.projectId ?? null,
      search: input.search ?? null,
      status: input.status ?? null,
    },
    items: pagination.items,
    page: pagination.page,
    pageSize: pagination.pageSize,
    projectOptions: Array.from(new Set(filterUnitsByScope(input.sessionUser, data.units).map((unit) => unit.project_id)))
      .map((projectId) => ({
        id: projectId,
        label: projectById.get(projectId)?.name_ar ?? projectId,
      }))
      .sort((left, right) => left.label.localeCompare(right.label, "ar")),
    totalCount: pagination.totalCount,
  };
}
