import type { SessionUser } from "@/lib/auth/get-session-user";
import { requirePermission } from "@/lib/auth/permissions";

import { normalizeCustomerName } from "@/features/imports/normalization/normalize-customer-name";
import {
  buildCustomerById,
  buildProjectById,
  buildUnitCodesByContract,
  filterContractsByScope,
  loadReadModelData,
  paginate,
  type AggregateTotals,
} from "@/server/queries/read-model-helpers";

export type GetInstallmentsListInput = {
  contractId?: string;
  customerId?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  paymentStatus?: string;
  projectId?: string;
  search?: string;
  sessionUser: SessionUser;
  startDate?: string;
};

export type InstallmentListItem = {
  amountCollected: number;
  amountDue: number;
  amountOutstanding: number;
  contractCode: string | null;
  contractId: string;
  customerId: string;
  customerName: string;
  delayDays: number;
  dueDate: string;
  installmentCode: string | null;
  installmentId: string;
  installmentType: string;
  paymentDate: string | null;
  paymentStatus: string;
  penaltyAmount: number;
  projectId: string;
  projectName: string;
  receiptReference: string | null;
  unitCodes: string[];
};

export type GetInstallmentsListResult = {
  filters: {
    contractId: string | null;
    customerId: string | null;
    page: number;
    pageSize: number;
    paymentStatus: string | null;
    projectId: string | null;
    search: string | null;
  };
  items: InstallmentListItem[];
  page: number;
  pageSize: number;
  projectOptions: Array<{ id: string; label: string }>;
  summary: AggregateTotals;
  totalCount: number;
};

type GetInstallmentsListDependencies = {
  loadReadModelData: typeof loadReadModelData;
};

export async function getInstallmentsList(
  input: GetInstallmentsListInput,
  dependencies: GetInstallmentsListDependencies = { loadReadModelData },
): Promise<GetInstallmentsListResult> {
  requirePermission(input.sessionUser, "installments.read");

  const data = await dependencies.loadReadModelData({
    projectId: input.projectId,
    sessionUser: input.sessionUser,
  });
  const customerById = buildCustomerById(data.customers);
  const projectById = buildProjectById(data.projects);
  const unitCodesByContract = buildUnitCodesByContract(data);
  const visibleContracts = filterContractsByScope(input.sessionUser, data.contracts, input.projectId).filter(
    (contract) => {
      if (input.contractId && contract.id !== input.contractId) {
        return false;
      }

      if (input.customerId && contract.customer_id !== input.customerId) {
        return false;
      }

      return true;
    },
  );
  const visibleContractIds = new Set(visibleContracts.map((contract) => contract.id));
  const contractById = new Map(visibleContracts.map((contract) => [contract.id, contract]));
  const searchValue = input.search?.trim().toLowerCase();
  const normalizedSearchValue = normalizeCustomerName(input.search);
  const filteredInstallments = data.installments
    .filter((installment) => visibleContractIds.has(installment.contract_id))
    .filter((installment) => (input.startDate ? installment.due_date >= input.startDate : true))
    .filter((installment) => (input.endDate ? installment.due_date <= input.endDate : true))
    .filter((installment) => (input.paymentStatus ? installment.payment_status === input.paymentStatus : true))
    .map((installment) => {
      const contract = contractById.get(installment.contract_id);

      return {
        amountCollected: installment.amount_collected,
        amountDue: installment.amount_due,
        amountOutstanding: installment.amount_outstanding,
        contractCode: contract?.contract_code ?? null,
        contractId: installment.contract_id,
        customerId: contract?.customer_id ?? "",
        customerName: contract
          ? customerById.get(contract.customer_id)?.customer_name ?? contract.customer_id
          : "",
        delayDays: installment.delay_days,
        dueDate: installment.due_date,
        installmentCode: installment.installment_code,
        installmentId: installment.id,
        installmentType: installment.installment_type,
        paymentDate: installment.payment_date,
        paymentStatus: installment.payment_status,
        penaltyAmount: installment.penalty_amount,
        projectId: contract?.project_id ?? "",
        projectName: contract ? projectById.get(contract.project_id)?.name_ar ?? contract.project_id : "",
        receiptReference: installment.receipt_reference,
        unitCodes: unitCodesByContract.get(installment.contract_id) ?? [],
      };
    })
    .filter((installment) => {
      if (!searchValue) {
        return true;
      }

      return (
        (normalizedSearchValue
          ? normalizeCustomerName(installment.customerName)?.includes(normalizedSearchValue)
          : installment.customerName.toLowerCase().includes(searchValue)) ||
        installment.contractCode?.toLowerCase().includes(searchValue) ||
        installment.installmentCode?.toLowerCase().includes(searchValue) ||
        installment.unitCodes.some((unitCode) => unitCode.toLowerCase().includes(searchValue))
      );
    })
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate));
  const pagination = paginate(filteredInstallments, input.page, input.pageSize);

  return {
    filters: {
      contractId: input.contractId ?? null,
      customerId: input.customerId ?? null,
      page: pagination.page,
      pageSize: pagination.pageSize,
      paymentStatus: input.paymentStatus ?? null,
      projectId: input.projectId ?? null,
      search: input.search?.trim() || null,
    },
    items: pagination.items,
    page: pagination.page,
    pageSize: pagination.pageSize,
    projectOptions: Array.from(new Set(visibleContracts.map((contract) => contract.project_id)))
      .map((projectId) => ({ id: projectId, label: projectById.get(projectId)?.name_ar ?? projectId }))
      .sort((left, right) => left.label.localeCompare(right.label, "ar")),
    summary: filteredInstallments.reduce<AggregateTotals>(
      (totals, installment) => ({
        amountCollected: totals.amountCollected + installment.amountCollected,
        amountDue: totals.amountDue + installment.amountDue,
        amountOutstanding: totals.amountOutstanding + installment.amountOutstanding,
        penaltyAmount: totals.penaltyAmount + installment.penaltyAmount,
      }),
      {
        amountCollected: 0,
        amountDue: 0,
        amountOutstanding: 0,
        penaltyAmount: 0,
      },
    ),
    totalCount: pagination.totalCount,
  };
}
