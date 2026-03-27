import type { SessionUser } from "@/lib/auth/get-session-user";
import { requirePermission } from "@/lib/auth/permissions";

import {
  buildCustomerById,
  buildInstallmentsByContract,
  buildProfileById,
  buildProjectById,
  buildUnitCodesByContract,
  calculateAggregateTotals,
  deriveContractPaymentStatus,
  filterContractsByScope,
  loadReadModelData,
  matchesArabicSearch,
  paginate,
  type AggregateTotals,
  type ContractPaymentStatus,
  type QueryFilters,
} from "@/server/queries/read-model-helpers";

export type ContractsListRow = {
  collectorName: string | null;
  contractCode: string | null;
  contractId: string;
  contractStatus: ContractPaymentStatus;
  customerId: string;
  customerName: string;
  projectId: string;
  projectName: string;
  totals: AggregateTotals;
  unitCodes: string[];
};

export type GetContractsListInput = QueryFilters & {
  page?: number;
  pageSize?: number;
  sessionUser: SessionUser;
};

export type GetContractsListResult = {
  filters: {
    page: number;
    pageSize: number;
    projectId: string | null;
    search: string | null;
  };
  items: ContractsListRow[];
  page: number;
  pageSize: number;
  projectOptions: Array<{ id: string; label: string }>;
  totalCount: number;
};

type GetContractsListDependencies = {
  loadReadModelData: typeof loadReadModelData;
};

export async function getContractsList(
  input: GetContractsListInput,
  dependencies: GetContractsListDependencies = { loadReadModelData },
): Promise<GetContractsListResult> {
  requirePermission(input.sessionUser, "contracts.read");

  const data = await dependencies.loadReadModelData({
    projectId: input.projectId,
    sessionUser: input.sessionUser,
  });
  const customerById = buildCustomerById(data.customers);
  const installmentsByContract = buildInstallmentsByContract(data.installments);
  const profileById = buildProfileById(data.profiles);
  const projectById = buildProjectById(data.projects);
  const unitCodesByContract = buildUnitCodesByContract(data);
  const filteredContracts = filterContractsByScope(input.sessionUser, data.contracts, input.projectId)
    .filter((contract) => {
      const customer = customerById.get(contract.customer_id);

      if (!customer) {
        return false;
      }

      if (input.search?.trim()) {
        const matchesCustomer = matchesArabicSearch(customer, input.search);
        const searchValue = input.search.trim().toLowerCase();
        const matchesContractCode = contract.contract_code?.toLowerCase().includes(searchValue) ?? false;
        const matchesUnitCode = (unitCodesByContract.get(contract.id) ?? []).some((unitCode) =>
          unitCode.toLowerCase().includes(searchValue),
        );

        return matchesCustomer || matchesContractCode || matchesUnitCode;
      }

      return true;
    })
    .map((contract) => {
      const contractInstallments = installmentsByContract.get(contract.id) ?? [];

      return {
        collectorName: contract.collector_user_id
          ? profileById.get(contract.collector_user_id)?.full_name ?? contract.collector_user_id
          : null,
        contractCode: contract.contract_code,
        contractId: contract.id,
        contractStatus: deriveContractPaymentStatus(contractInstallments),
        customerId: contract.customer_id,
        customerName: customerById.get(contract.customer_id)?.customer_name ?? contract.customer_id,
        projectId: contract.project_id,
        projectName: projectById.get(contract.project_id)?.name_ar ?? contract.project_id,
        totals: calculateAggregateTotals(contractInstallments),
        unitCodes: unitCodesByContract.get(contract.id) ?? [],
      } satisfies ContractsListRow;
    })
    .sort((left, right) => {
      if (left.contractStatus !== right.contractStatus) {
        return getContractStatusPriority(left.contractStatus) - getContractStatusPriority(right.contractStatus);
      }

      return right.totals.amountOutstanding - left.totals.amountOutstanding;
    });
  const pagination = paginate(filteredContracts, input.page, input.pageSize);

  return {
    filters: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      projectId: input.projectId ?? null,
      search: input.search?.trim() || null,
    },
    items: pagination.items,
    page: pagination.page,
    pageSize: pagination.pageSize,
    projectOptions: Array.from(new Set(filteredContracts.map((contract) => contract.projectId)))
      .map((projectId) => ({ id: projectId, label: projectById.get(projectId)?.name_ar ?? projectId }))
      .sort((left, right) => left.label.localeCompare(right.label, "ar")),
    totalCount: pagination.totalCount,
  };
}

function getContractStatusPriority(status: ContractPaymentStatus): number {
  switch (status) {
    case "overdue":
      return 0;
    case "partial":
      return 1;
    case "outstanding":
      return 2;
    case "paid":
      return 3;
  }
}
