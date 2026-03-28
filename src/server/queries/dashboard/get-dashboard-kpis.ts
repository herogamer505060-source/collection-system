import type { SessionUser } from "@/lib/auth/get-session-user";
import { requirePermission } from "@/lib/auth/permissions";

import { canReadFollowUpRecord } from "@/features/follow-ups/services/follow-up-permissions";
import { getLastImportAt } from "@/server/queries/imports/get-last-import-at";
import {
  buildInstallmentsByContract,
  deriveCustomerPaymentStatus,
  filterContractsByScope,
  loadReadModelData,
  resolveFollowUpProjectId,
} from "@/server/queries/read-model-helpers";

import {
  getRecentFollowUps,
  type RecentFollowUpItem,
} from "./get-recent-follow-ups";
import {
  getTopOverdueCustomers,
  type TopOverdueCustomer,
} from "./get-top-overdue-customers";

export type DashboardKpisResult = {
  collectionPercentage: number;
  customersOverdue: number;
  customersPaid: number;
  customersUnpaid: number;
  lastImportAt: string | null;
  openPromises: number;
  recentFollowUps: RecentFollowUpItem[];
  topOverdueCustomers: TopOverdueCustomer[];
  totalCollected: number;
  totalDue: number;
  totalOutstanding: number;
  totalOverdue: number;
  totalPenalties: number;
};

type GetDashboardKpisDependencies = {
  getLastImportAt: typeof getLastImportAt;
  getRecentFollowUps: typeof getRecentFollowUps;
  getTopOverdueCustomers: typeof getTopOverdueCustomers;
  loadReadModelData: typeof loadReadModelData;
};

export async function getDashboardKpis(
  input: {
    endDate?: string;
    projectId?: string;
    sessionUser: SessionUser;
    startDate?: string;
  },
  dependencies: GetDashboardKpisDependencies = {
    getLastImportAt,
    getRecentFollowUps,
    getTopOverdueCustomers,
    loadReadModelData,
  },
): Promise<DashboardKpisResult> {
  requirePermission(input.sessionUser, "dashboard.read");

  const data = await dependencies.loadReadModelData({
    projectId: input.projectId,
    sessionUser: input.sessionUser,
  });
  const visibleContracts = filterContractsByScope(input.sessionUser, data.contracts, input.projectId);
  const allInstallmentsByContract = buildInstallmentsByContract(data.installments);
  const visibleInstallments = visibleContracts
    .flatMap((contract) => allInstallmentsByContract.get(contract.id) ?? [])
    .filter((installment) => (input.startDate ? installment.due_date >= input.startDate : true))
    .filter((installment) => (input.endDate ? installment.due_date <= input.endDate : true));
  const visibleInstallmentsByContract = buildInstallmentsByContract(visibleInstallments);
  const customerInstallments = new Map<string, typeof visibleInstallments>();

  for (const contract of visibleContracts) {
    const nextInstallments = customerInstallments.get(contract.customer_id) ?? [];
    nextInstallments.push(...(visibleInstallmentsByContract.get(contract.id) ?? []));
    customerInstallments.set(contract.customer_id, nextInstallments);
  }

  const visibleOpenPromises = data.followUps.filter((followUp) => {
    const projectId = resolveFollowUpProjectId(
      {
        contractId: followUp.contract_id,
        customerId: followUp.customer_id,
        preferredProjectId: input.projectId,
      },
      data,
    );

    return (
      followUp.promised_to_pay &&
      followUp.follow_up_status === "open" &&
      canReadFollowUpRecord(input.sessionUser, {
        collectorUserId: followUp.collector_user_id,
        createdBy: followUp.created_by,
        customerId: followUp.customer_id,
        projectId,
      }) &&
      (!input.projectId || projectId === input.projectId)
    );
  });

  const [topOverdueCustomers, recentFollowUps, lastImportAt] = await Promise.all([
    dependencies.getTopOverdueCustomers({
      endDate: input.endDate,
      projectId: input.projectId,
      sessionUser: input.sessionUser,
      startDate: input.startDate,
    }),
    dependencies.getRecentFollowUps({ projectId: input.projectId, sessionUser: input.sessionUser }),
    dependencies.getLastImportAt(),
  ]);

  const totalDue = sum(visibleInstallments.map((installment) => installment.amount_due));
  const totalCollected = sum(visibleInstallments.map((installment) => installment.amount_collected));
  const totalOutstanding = sum(visibleInstallments.map((installment) => installment.amount_outstanding));
  const totalOverdue = sum(
    visibleInstallments
      .filter((installment) => installment.payment_status === "overdue")
      .map((installment) => installment.amount_outstanding),
  );
  const totalPenalties = sum(visibleInstallments.map((installment) => installment.penalty_amount));

  let customersPaid = 0;
  let customersUnpaid = 0;
  let customersOverdue = 0;

  for (const installments of customerInstallments.values()) {
    const status = deriveCustomerPaymentStatus(installments);

    if (status === "all_paid") {
      customersPaid += 1;
    } else if (status === "has_overdue") {
      customersOverdue += 1;
    } else {
      customersUnpaid += 1;
    }
  }

  return {
    collectionPercentage: totalDue > 0 ? roundToTwoDecimals((totalCollected / totalDue) * 100) : 0,
    customersOverdue,
    customersPaid,
    customersUnpaid,
    lastImportAt,
    openPromises: visibleOpenPromises.length,
    recentFollowUps,
    topOverdueCustomers,
    totalCollected,
    totalDue,
    totalOutstanding,
    totalOverdue,
    totalPenalties,
  };
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}
