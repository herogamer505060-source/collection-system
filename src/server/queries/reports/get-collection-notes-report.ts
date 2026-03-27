import type { PaginatedReportResult, ReportQueryInput } from "./report-helpers";
import {
  buildPaginatedReportResult,
  getFollowUpProjectName,
  getReportContext,
} from "./report-helpers";

export type CollectionNotesReportItem = {
  collectorName: string;
  customerName: string;
  customerResponse: string | null;
  followUpDate: string;
  note: string;
  projectName: string;
};

export type CollectionNotesReportResult = PaginatedReportResult<CollectionNotesReportItem>;

export async function getCollectionNotesReport(
  input: ReportQueryInput,
): Promise<CollectionNotesReportResult> {
  const context = await getReportContext(input);
  const items = Array.from(context.followUpsByCustomer.entries())
    .map(([customerId, followUps]) => {
      const latestFollowUp = [...followUps].sort((left, right) => right.follow_up_date.localeCompare(left.follow_up_date))[0];

      if (!latestFollowUp) {
        return null;
      }

      return {
        collectorName: latestFollowUp.collector_user_id
          ? context.profileById.get(latestFollowUp.collector_user_id)?.full_name ?? latestFollowUp.collector_user_id
          : "غير محدد",
        customerName: context.customerById.get(customerId)?.customer_name ?? customerId,
        customerResponse: latestFollowUp.customer_response,
        followUpDate: latestFollowUp.follow_up_date,
        note: latestFollowUp.note,
        projectName: getFollowUpProjectName(latestFollowUp, context),
      };
    })
    .filter((item): item is CollectionNotesReportItem => Boolean(item))
    .sort((left, right) => right.followUpDate.localeCompare(left.followUpDate));

  return buildPaginatedReportResult(items, input, context.projectOptions, {});
}
