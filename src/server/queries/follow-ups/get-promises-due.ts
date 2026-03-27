import { getEgyptToday } from "@/lib/dates/egypt";
import type { SessionUser } from "@/lib/auth/get-session-user";
import { requirePermission } from "@/lib/auth/permissions";

import { canReadFollowUpRecord } from "@/features/follow-ups/services/follow-up-permissions";
import {
  buildCustomerById,
  buildInstallmentsByContract,
  buildProjectById,
  calculateAggregateTotals,
  loadReadModelData,
  resolveFollowUpProjectId,
} from "@/server/queries/read-model-helpers";

export type PromiseDueItem = {
  contractCode: string | null;
  contractId: string | null;
  customerId: string;
  customerName: string;
  followUpDate: string;
  followUpId: string;
  note: string;
  outstandingAmount: number;
  projectId: string | null;
  projectName: string | null;
  promiseDate: string;
};

export type GetPromisesDueResult = {
  asOfDate: string;
  items: PromiseDueItem[];
  totalCount: number;
};

type GetPromisesDueDependencies = {
  loadReadModelData: typeof loadReadModelData;
};

export async function getPromisesDue(
  input: {
    asOfDate?: string;
    projectId?: string;
    sessionUser: SessionUser;
  },
  dependencies: GetPromisesDueDependencies = { loadReadModelData },
): Promise<GetPromisesDueResult> {
  requirePermission(input.sessionUser, "followUps.read");

  const data = await dependencies.loadReadModelData({
    projectId: input.projectId,
    sessionUser: input.sessionUser,
  });
  const asOfDate = input.asOfDate ?? getEgyptToday();
  const contractById = new Map(data.contracts.map((contract) => [contract.id, contract]));
  const customerById = buildCustomerById(data.customers);
  const installmentsByContract = buildInstallmentsByContract(data.installments);
  const projectById = buildProjectById(data.projects);
  const items = data.followUps
    .filter(
      (followUp) =>
        followUp.promised_to_pay &&
        followUp.promise_date !== null &&
        followUp.follow_up_status === "open",
    )
    .map((followUp) => {
      const contract = followUp.contract_id ? contractById.get(followUp.contract_id) ?? null : null;
      const projectId = resolveFollowUpProjectId(
        {
          contractId: followUp.contract_id,
          customerId: followUp.customer_id,
          preferredProjectId: input.projectId,
        },
        data,
      );

      return {
        contract,
        customerName: customerById.get(followUp.customer_id)?.customer_name ?? followUp.customer_id,
        followUp,
        outstandingAmount: calculateAggregateTotals(
          contract ? installmentsByContract.get(contract.id) ?? [] : [],
        ).amountOutstanding,
        projectId,
        projectName: projectId ? projectById.get(projectId)?.name_ar ?? projectId : null,
      };
    })
    .filter((row) => (input.projectId ? row.projectId === input.projectId : true))
    .filter((row) => row.followUp.promise_date !== null && row.followUp.promise_date >= asOfDate)
    .filter((row) =>
      canReadFollowUpRecord(input.sessionUser, {
        collectorUserId: row.followUp.collector_user_id,
        createdBy: row.followUp.created_by,
        customerId: row.followUp.customer_id,
        projectId: row.projectId,
      }),
    )
    .sort((left, right) => left.followUp.promise_date!.localeCompare(right.followUp.promise_date!))
    .map((row) => ({
      contractCode: row.contract?.contract_code ?? null,
      contractId: row.contract?.id ?? null,
      customerId: row.followUp.customer_id,
      customerName: row.customerName,
      followUpDate: row.followUp.follow_up_date,
      followUpId: row.followUp.id,
      note: row.followUp.note,
      outstandingAmount: row.outstandingAmount,
      projectId: row.projectId,
      projectName: row.projectName,
      promiseDate: row.followUp.promise_date!,
    }));

  return {
    asOfDate,
    items,
    totalCount: items.length,
  };
}
