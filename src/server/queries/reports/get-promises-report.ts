import type { PaginatedReportResult, ReportQueryInput } from "./report-helpers";
import {
  buildPaginatedReportResult,
  getFollowUpProjectName,
  getReportContext,
} from "./report-helpers";

export type PromisesReportItem = {
  collectorName: string;
  customerName: string;
  followUpStatus: string;
  note: string;
  projectName: string;
  promiseDate: string | null;
};

export type PromisesReportResult = PaginatedReportResult<PromisesReportItem>;

export async function getPromisesReport(input: ReportQueryInput): Promise<PromisesReportResult> {
  const context = await getReportContext(input);
  const items = context.accessibleFollowUps
    .filter((followUp) => followUp.promised_to_pay && followUp.follow_up_status !== "done")
    .map((followUp) => ({
      collectorName: followUp.collector_user_id
        ? context.profileById.get(followUp.collector_user_id)?.full_name ?? followUp.collector_user_id
        : "غير محدد",
      customerName: context.customerById.get(followUp.customer_id)?.customer_name ?? followUp.customer_id,
      followUpStatus: followUp.follow_up_status,
      note: followUp.note,
      projectName: getFollowUpProjectName(followUp, context),
      promiseDate: followUp.promise_date,
    }))
    .sort((left, right) => {
      if (left.promiseDate && right.promiseDate) {
        return left.promiseDate.localeCompare(right.promiseDate);
      }

      if (left.promiseDate) {
        return -1;
      }

      if (right.promiseDate) {
        return 1;
      }

      return left.customerName.localeCompare(right.customerName, "ar");
    });

  return buildPaginatedReportResult(items, input, context.projectOptions, {});
}
