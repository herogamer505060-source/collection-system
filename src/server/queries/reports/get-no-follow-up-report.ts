import { getEgyptToday } from "@/lib/dates/egypt";

import type { PaginatedReportResult, ReportQueryInput } from "./report-helpers";
import {
  buildPaginatedReportResult,
  getCustomerProjectName,
  getDaysSince,
  getReportContext,
  sumNumbers,
} from "./report-helpers";

export type NoFollowUpReportItem = {
  amountOutstanding: number;
  customerName: string;
  daysSinceLastFollowUp: number;
  lastFollowUpDate: string | null;
  projectName: string;
};

export type NoFollowUpReportResult = PaginatedReportResult<NoFollowUpReportItem, { days: number }>;

export async function getNoFollowUpReport(
  input: ReportQueryInput & { days?: number },
): Promise<NoFollowUpReportResult> {
  const context = await getReportContext(input);
  const today = getEgyptToday();
  const days = Number.isFinite(input.days) && (input.days ?? 0) > 0 ? Math.floor(input.days as number) : 30;
  const items = Array.from(context.contractsByCustomer.entries())
    .map(([customerId, contracts]) => {
      const followUps = context.followUpsByCustomer.get(customerId) ?? [];
      const latestFollowUp = [...followUps].sort((left, right) => right.follow_up_date.localeCompare(left.follow_up_date))[0] ?? null;
      const daysSinceLastFollowUp = latestFollowUp ? getDaysSince(latestFollowUp.follow_up_date, today) : days;
      const hasRecentFollowUp = followUps.some((followUp) => getDaysSince(followUp.follow_up_date, today) <= days);

      if (hasRecentFollowUp) {
        return null;
      }

      const installments = contracts.flatMap((contract) => context.installmentsByContract.get(contract.id) ?? []);

      const item: NoFollowUpReportItem = {
        amountOutstanding: sumNumbers(installments.map((installment) => installment.amount_outstanding)),
        customerName: context.customerById.get(customerId)?.customer_name ?? customerId,
        daysSinceLastFollowUp,
        lastFollowUpDate: latestFollowUp?.follow_up_date ?? null,
        projectName: getCustomerProjectName(customerId, context.customerProjectNames),
      };

      return item;
    })
    .filter((item): item is NoFollowUpReportItem => Boolean(item))
    .sort((left, right) => right.daysSinceLastFollowUp - left.daysSinceLastFollowUp || right.amountOutstanding - left.amountOutstanding);

  return buildPaginatedReportResult(items, input, context.projectOptions, { days });
}
