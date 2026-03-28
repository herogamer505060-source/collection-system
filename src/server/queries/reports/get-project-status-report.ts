import type { PaginatedReportResult, ReportQueryInput } from "./report-helpers";
import { buildPaginatedReportResult, getProjectName, getReportContext, sumNumbers } from "./report-helpers";

export type ProjectStatusReportItem = {
  amountCollected: number;
  amountDue: number;
  amountOutstanding: number;
  collectionPercentage: number;
  contractCount: number;
  overdueAmount: number;
  projectName: string;
};

export type ProjectStatusReportResult = PaginatedReportResult<ProjectStatusReportItem, { projectId: null }>;

export async function getProjectStatusReport(
  input: Omit<ReportQueryInput, "projectId">,
): Promise<ProjectStatusReportResult> {
  const context = await getReportContext({ endDate: input.endDate, sessionUser: input.sessionUser, startDate: input.startDate });
  const installmentsByProject = new Map<string, typeof context.visibleInstallments>();
  const contractCounts = new Map<string, number>();

  for (const contract of context.visibleContracts) {
    const nextInstallments = installmentsByProject.get(contract.project_id) ?? [];
    nextInstallments.push(...(context.installmentsByContract.get(contract.id) ?? []));
    installmentsByProject.set(contract.project_id, nextInstallments);
    contractCounts.set(contract.project_id, (contractCounts.get(contract.project_id) ?? 0) + 1);
  }

  const items = Array.from(installmentsByProject.entries())
    .map(([projectId, installments]) => {
      const amountDue = sumNumbers(installments.map((installment) => installment.amount_due));
      const amountCollected = sumNumbers(installments.map((installment) => installment.amount_collected));
      const amountOutstanding = sumNumbers(installments.map((installment) => installment.amount_outstanding));
      const overdueAmount = sumNumbers(
        installments
          .filter((installment) => installment.payment_status === "overdue")
          .map((installment) => installment.amount_outstanding),
      );

      return {
        amountCollected,
        amountDue,
        amountOutstanding,
        collectionPercentage: amountDue > 0 ? Math.round((amountCollected / amountDue) * 10000) / 100 : 0,
        contractCount: contractCounts.get(projectId) ?? 0,
        overdueAmount,
        projectName: getProjectName(projectId, context.projectById),
      };
    })
    .sort((left, right) => left.projectName.localeCompare(right.projectName, "ar"));

  return buildPaginatedReportResult(items, { endDate: input.endDate, page: input.page, pageSize: input.pageSize, startDate: input.startDate }, context.projectOptions, { projectId: null });
}
