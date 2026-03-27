import type { SessionUser } from "@/lib/auth/get-session-user";
import { requirePermission } from "@/lib/auth/permissions";
import type { Tables } from "@/types/database";

import {
  buildInstallmentsByContract,
  buildProjectById,
  calculateAggregateTotals,
  deriveCustomerPaymentStatus,
  filterContractsByScope,
  loadReadModelData,
  matchesArabicSearch,
  paginate,
  type AggregateTotals,
  type CustomerPaymentStatus,
  type QueryFilters,
  type ReadModelData,
} from "@/server/queries/read-model-helpers";

export type CustomersListRow = {
  contractCount: number;
  customerId: string;
  customerName: string;
  email: string | null;
  mobile: string | null;
  paymentStatus: CustomerPaymentStatus;
  projectIds: string[];
  projectNames: string[];
  totals: AggregateTotals;
};

export type GetCustomersListInput = QueryFilters & {
  page?: number;
  pageSize?: number;
  paymentStatus?: "all" | CustomerPaymentStatus;
  sessionUser: SessionUser;
};

export type GetCustomersListResult = {
  filters: {
    page: number;
    pageSize: number;
    paymentStatus: "all" | CustomerPaymentStatus;
    projectId: string | null;
    search: string | null;
  };
  items: CustomersListRow[];
  page: number;
  pageSize: number;
  projectOptions: Array<{ id: string; label: string }>;
  totalCount: number;
};

type GetCustomersListDependencies = {
  loadReadModelData: typeof loadReadModelData;
};

export async function getCustomersList(
  input: GetCustomersListInput,
  dependencies: GetCustomersListDependencies = { loadReadModelData },
): Promise<GetCustomersListResult> {
  requirePermission(input.sessionUser, "customers.read");

  const data = await dependencies.loadReadModelData({
    projectId: input.projectId,
    sessionUser: input.sessionUser,
  });
  const filteredContracts = filterContractsByScope(input.sessionUser, data.contracts, input.projectId);
  const customerIds = new Set(filteredContracts.map((contract) => contract.customer_id));
  const customerRows = data.customers.filter(
    (customer) => customerIds.has(customer.id) && matchesArabicSearch(customer, input.search),
  );
  const customerListRows = customerRows
    .map((customer) => buildCustomerListRow(customer, filteredContracts, data))
    .filter((row) => (input.paymentStatus && input.paymentStatus !== "all" ? row.paymentStatus === input.paymentStatus : true))
    .sort((left, right) => {
      if (left.paymentStatus !== right.paymentStatus) {
        return getCustomerStatusPriority(left.paymentStatus) - getCustomerStatusPriority(right.paymentStatus);
      }

      return right.totals.amountOutstanding - left.totals.amountOutstanding || left.customerName.localeCompare(right.customerName, "ar");
    });
  const pagination = paginate(customerListRows, input.page, input.pageSize);

  return {
    filters: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      paymentStatus: input.paymentStatus ?? "all",
      projectId: input.projectId ?? null,
      search: input.search?.trim() || null,
    },
    items: pagination.items,
    page: pagination.page,
    pageSize: pagination.pageSize,
    projectOptions: buildProjectOptions(filteredContracts, data.projects),
    totalCount: pagination.totalCount,
  };
}

function buildCustomerListRow(
  customer: Tables<"customers">,
  contracts: Tables<"contracts">[],
  data: ReadModelData,
): CustomersListRow {
  const projectById = buildProjectById(data.projects);
  const installmentsByContract = buildInstallmentsByContract(data.installments);
  const customerContracts = contracts.filter((contract) => contract.customer_id === customer.id);
  const customerInstallments = customerContracts.flatMap(
    (contract) => installmentsByContract.get(contract.id) ?? [],
  );
  const projectPairs = Array.from(new Set(customerContracts.map((contract) => contract.project_id)))
    .map((projectId) => ({
      projectId,
      projectName: projectById.get(projectId)?.name_ar ?? projectId,
    }))
    .sort((left, right) => left.projectName.localeCompare(right.projectName, "ar"));

  return {
    contractCount: customerContracts.length,
    customerId: customer.id,
    customerName: customer.customer_name,
    email: customer.email,
    mobile: customer.mobile,
    paymentStatus: deriveCustomerPaymentStatus(customerInstallments),
    projectIds: projectPairs.map((project) => project.projectId),
    projectNames: projectPairs.map((project) => project.projectName),
    totals: calculateAggregateTotals(customerInstallments),
  };
}

function buildProjectOptions(
  contracts: Tables<"contracts">[],
  projects: Tables<"projects">[],
): Array<{ id: string; label: string }> {
  const projectById = buildProjectById(projects);

  return Array.from(new Set(contracts.map((contract) => contract.project_id)))
    .map((projectId) => ({
      id: projectId,
      label: projectById.get(projectId)?.name_ar ?? projectId,
    }))
    .sort((left, right) => left.label.localeCompare(right.label, "ar"));
}

function getCustomerStatusPriority(status: CustomerPaymentStatus): number {
  switch (status) {
    case "has_overdue":
      return 0;
    case "has_outstanding":
      return 1;
    case "all_paid":
      return 2;
  }
}
