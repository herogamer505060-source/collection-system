import type { PaginatedReportResult, ReportQueryInput } from "./report-helpers";
import { buildPaginatedReportResult, getProjectName, getReportContext } from "./report-helpers";

export type OverdueReportItem = {
  amountDue: number;
  amountOutstanding: number;
  contractCode: string | null;
  customerName: string;
  delayDays: number;
  dueDate: string;
  installmentType: string;
  lastCustomerResponse: string | null;
  lastFollowUpDate: string | null;
  lastFollowUpNote: string | null;
  nextActionDate: string | null;
  projectName: string;
  promiseDate: string | null;
};

export type OverdueReportResult = PaginatedReportResult<OverdueReportItem>;

export async function getOverdueReport(input: ReportQueryInput): Promise<OverdueReportResult> {
  const context = await getReportContext(input);
  const items = context.visibleInstallments
    .filter((installment) => installment.payment_status === "overdue")
    .map((installment) => {
      const contract = context.contractById.get(installment.contract_id);
      const customerId = contract?.customer_id;
      const latestFollowUp = customerId
        ? [...(context.followUpsByCustomer.get(customerId) ?? [])].sort((left, right) =>
            right.follow_up_date.localeCompare(left.follow_up_date),
          )[0] ?? null
        : null;

      return {
        amountDue: installment.amount_due,
        amountOutstanding: installment.amount_outstanding,
        contractCode: contract?.contract_code ?? null,
        customerName: contract
          ? context.customerById.get(contract.customer_id)?.customer_name ?? contract.customer_id
          : "—",
        delayDays: installment.delay_days,
        dueDate: installment.due_date,
        installmentType: installment.installment_type,
        lastCustomerResponse: latestFollowUp?.customer_response ?? null,
        lastFollowUpDate: latestFollowUp?.follow_up_date ?? null,
        lastFollowUpNote: latestFollowUp?.note ?? null,
        nextActionDate: latestFollowUp?.next_action_date ?? null,
        projectName: contract ? getProjectName(contract.project_id, context.projectById) : "—",
        promiseDate: latestFollowUp?.promise_date ?? null,
      };
    })
    .sort((left, right) => right.delayDays - left.delayDays || right.amountOutstanding - left.amountOutstanding);

  return buildPaginatedReportResult(items, input, context.projectOptions, {});
}
