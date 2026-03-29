import type { PaginatedReportResult, ReportQueryInput } from "./report-helpers";
import {
  AGING_BUCKET_LABELS,
  AGING_BUCKET_ORDER,
  buildPaginatedReportResult,
  getProjectName,
  getReportContext,
} from "./report-helpers";

export type AgingReportItem = {
  amountCollected: number;
  amountDue: number;
  amountOutstanding: number;
  collectorUserId: string | null;
  contractCode: string | null;
  contractId: string | null;
  customerId: string | null;
  customerName: string;
  delayBucket: string;
  delayDays: number;
  dueDate: string;
  lastCustomerResponse: string | null;
  lastFollowUpDate: string | null;
  lastFollowUpNote: string | null;
  projectName: string;
};

export type AgingReportSummaryItem = {
  amount: number;
  bucket: string;
  bucketLabel: string;
  count: number;
};

export type AgingReportResult = PaginatedReportResult<AgingReportItem> & {
  summary: AgingReportSummaryItem[];
};

export async function getAgingReport(input: ReportQueryInput): Promise<AgingReportResult> {
  const context = await getReportContext(input);
  const summaryMap = new Map<string, AgingReportSummaryItem>();
  const items = context.visibleInstallments
    .filter((installment) => installment.amount_outstanding > 0)
    .map((installment) => {
      const contract = context.contractById.get(installment.contract_id);
      const customerId = contract?.customer_id ?? null;
      const latestFollowUp = customerId
        ? [...(context.followUpsByCustomer.get(customerId) ?? [])].sort((left, right) =>
            right.follow_up_date.localeCompare(left.follow_up_date),
          )[0] ?? null
        : null;
      const customerName = contract
        ? context.customerById.get(contract.customer_id)?.customer_name ?? contract.customer_id
        : "—";
      const projectName = contract ? getProjectName(contract.project_id, context.projectById) : "—";
      const bucket = installment.delay_bucket;
      const summaryItem = summaryMap.get(bucket) ?? {
        amount: 0,
        bucket,
        bucketLabel: AGING_BUCKET_LABELS[bucket] ?? bucket,
        count: 0,
      };

      summaryItem.amount += installment.amount_outstanding;
      summaryItem.count += 1;
      summaryMap.set(bucket, summaryItem);

      return {
        amountCollected: installment.amount_collected,
        amountDue: installment.amount_due,
        amountOutstanding: installment.amount_outstanding,
        collectorUserId: contract?.collector_user_id ?? null,
        contractCode: contract?.contract_code ?? null,
        contractId: contract?.id ?? null,
        customerId,
        customerName,
        delayBucket: AGING_BUCKET_LABELS[bucket] ?? bucket,
        delayDays: installment.delay_days,
        dueDate: installment.due_date,
        lastCustomerResponse: latestFollowUp?.customer_response ?? null,
        lastFollowUpDate: latestFollowUp?.follow_up_date ?? null,
        lastFollowUpNote: latestFollowUp?.note ?? null,
        projectName,
      };
    })
    .sort((left, right) => right.delayDays - left.delayDays || right.amountOutstanding - left.amountOutstanding);
  const result = buildPaginatedReportResult(items, input, context.projectOptions, {});

  return {
    ...result,
    summary: AGING_BUCKET_ORDER.map((bucket) => summaryMap.get(bucket)).filter(
      (item): item is AgingReportSummaryItem => Boolean(item),
    ),
  };
}
