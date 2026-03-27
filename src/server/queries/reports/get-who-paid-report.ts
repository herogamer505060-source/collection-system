import type { ReportQueryInput, PaginatedReportResult } from "./report-helpers";
import {
  buildPaginatedReportResult,
  getCustomerProjectName,
  getReportContext,
  sumNumbers,
} from "./report-helpers";

export type WhoPaidReportItem = {
  amountCollected: number;
  amountDue: number;
  amountOutstanding: number;
  customerName: string;
  projectName: string;
  status: "سدد بالكامل" | "لديه متأخرات" | "لديه متبقي";
};

export type WhoPaidReportResult = PaginatedReportResult<WhoPaidReportItem>;

export async function getWhoPaidReport(input: ReportQueryInput): Promise<WhoPaidReportResult> {
  const context = await getReportContext(input);
  const items = Array.from(context.contractsByCustomer.entries())
    .map(([customerId, contracts]) => {
      const installments = contracts.flatMap((contract) => context.installmentsByContract.get(contract.id) ?? []);
      const amountDue = sumNumbers(installments.map((installment) => installment.amount_due));
      const amountCollected = sumNumbers(installments.map((installment) => installment.amount_collected));
      const amountOutstanding = sumNumbers(installments.map((installment) => installment.amount_outstanding));
      const hasOverdue = installments.some((installment) => installment.payment_status === "overdue");
      const status: WhoPaidReportItem["status"] =
        amountOutstanding <= 0
          ? "سدد بالكامل"
          : hasOverdue
            ? "لديه متأخرات"
            : "لديه متبقي";

      return {
        amountCollected,
        amountDue,
        amountOutstanding,
        customerName: context.customerById.get(customerId)?.customer_name ?? customerId,
        projectName: getCustomerProjectName(customerId, context.customerProjectNames),
        status,
      };
    })
    .sort((left, right) => right.amountOutstanding - left.amountOutstanding || left.customerName.localeCompare(right.customerName, "ar"));

  return buildPaginatedReportResult(items, input, context.projectOptions, {});
}
