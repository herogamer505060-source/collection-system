import type { SessionUser } from "@/lib/auth/get-session-user";
import { requirePermission } from "@/lib/auth/permissions";

import { canReadFollowUpRecord } from "@/features/follow-ups/services/follow-up-permissions";
import {
  buildCustomerById,
  buildInstallmentsByContract,
  buildProjectById,
  filterContractsByScope,
  loadReadModelData,
  resolveFollowUpProjectId,
} from "@/server/queries/read-model-helpers";

export type TopOverdueCustomer = {
  customerId: string;
  customerName: string;
  lastFollowUpDate: string | null;
  projectName: string;
  totalOverdue: number;
};

type GetTopOverdueCustomersDependencies = {
  loadReadModelData: typeof loadReadModelData;
};

export async function getTopOverdueCustomers(
  input: {
    limit?: number;
    projectId?: string;
    sessionUser: SessionUser;
  },
  dependencies: GetTopOverdueCustomersDependencies = { loadReadModelData },
): Promise<TopOverdueCustomer[]> {
  requirePermission(input.sessionUser, "dashboard.read");

  const data = await dependencies.loadReadModelData({
    projectId: input.projectId,
    sessionUser: input.sessionUser,
  });
  const customerById = buildCustomerById(data.customers);
  const installmentsByContract = buildInstallmentsByContract(data.installments);
  const projectById = buildProjectById(data.projects);
  const visibleContracts = filterContractsByScope(input.sessionUser, data.contracts, input.projectId);
  const visibleContractIds = new Set(visibleContracts.map((contract) => contract.id));
  const visibleContractsByCustomer = new Map<string, typeof visibleContracts>();

  for (const contract of visibleContracts) {
    const nextContracts = visibleContractsByCustomer.get(contract.customer_id) ?? [];
    nextContracts.push(contract);
    visibleContractsByCustomer.set(contract.customer_id, nextContracts);
  }

  const topCustomers = Array.from(visibleContractsByCustomer.entries())
    .map(([customerId, contracts]) => {
      const overdueInstallments = contracts.flatMap((contract) =>
        (installmentsByContract.get(contract.id) ?? []).filter((installment) => installment.payment_status === "overdue"),
      );

      if (overdueInstallments.length === 0) {
        return null;
      }

      const overdueContractIds = new Set(overdueInstallments.map((installment) => installment.contract_id));
      const projectNames = Array.from(
        new Set(
          contracts
            .filter((contract) => overdueContractIds.has(contract.id))
            .map((contract) => projectById.get(contract.project_id)?.name_ar ?? contract.project_id),
        ),
      );
      const lastFollowUpDate = data.followUps
        .filter((followUp) => {
          const projectId = resolveFollowUpProjectId(
            {
              contractId: followUp.contract_id,
              customerId: followUp.customer_id,
              preferredProjectId: input.projectId,
            },
            data,
          );

          return (
            followUp.customer_id === customerId &&
            canReadFollowUpRecord(input.sessionUser, {
              collectorUserId: followUp.collector_user_id,
              createdBy: followUp.created_by,
              customerId: followUp.customer_id,
              projectId,
            }) &&
            (!input.projectId || projectId === input.projectId) &&
            (!followUp.contract_id || visibleContractIds.has(followUp.contract_id))
          );
        })
        .sort((left, right) => right.follow_up_date.localeCompare(left.follow_up_date))[0]?.follow_up_date;

      return {
        customerId,
        customerName: customerById.get(customerId)?.customer_name ?? customerId,
        lastFollowUpDate: lastFollowUpDate ? lastFollowUpDate.slice(0, 10) : null,
        projectName: projectNames.length === 1 ? projectNames[0] : "متعدد المشروعات",
        totalOverdue: overdueInstallments.reduce(
          (sum, installment) => sum + installment.amount_outstanding,
          0,
        ),
      } satisfies TopOverdueCustomer;
    })
    .filter((row): row is TopOverdueCustomer => Boolean(row))
    .sort((left, right) => right.totalOverdue - left.totalOverdue || left.customerName.localeCompare(right.customerName, "ar"));

  return topCustomers.slice(0, input.limit ?? 5);
}
