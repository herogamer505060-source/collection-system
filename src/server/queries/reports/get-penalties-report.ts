import type { ReportQueryInput, PaginatedReportResult } from "./report-helpers";
import { buildPaginatedReportResult, getProjectName, getReportContext } from "./report-helpers";

export type PenaltiesReportItem = {
  amountCollected: number;
  amountDue: number;
  amountOutstanding: number;
  contractCode: string | null;
  customerName: string;
  installmentType: string;
  penaltyAmount: number;
  projectName: string;
};

export type PenaltiesReportResult = PaginatedReportResult<PenaltiesReportItem>;

export async function getPenaltiesReport(input: ReportQueryInput): Promise<PenaltiesReportResult> {
  const context = await getReportContext(input);
  const items = context.visibleInstallments
    .filter((installment) => installment.penalty_amount > 0)
    .map((installment) => {
      const contract = context.contractById.get(installment.contract_id);
      return {
        amountCollected: installment.amount_collected,
        amountDue: installment.amount_due,
        amountOutstanding: installment.amount_outstanding,
        contractCode: contract?.contract_code ?? null,
        customerName: contract ? context.customerById.get(contract.customer_id)?.customer_name ?? contract.customer_id : "—",
        installmentType: installment.installment_type,
        penaltyAmount: installment.penalty_amount,
        projectName: contract ? getProjectName(contract.project_id, context.projectById) : "—",
      };
    })
    .sort((left, right) => right.penaltyAmount - left.penaltyAmount || left.customerName.localeCompare(right.customerName, "ar"));

  return buildPaginatedReportResult(items, input, context.projectOptions, {});
}
