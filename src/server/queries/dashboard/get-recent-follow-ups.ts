import type { SessionUser } from "@/lib/auth/get-session-user";
import { requirePermission } from "@/lib/auth/permissions";

import { canReadFollowUpRecord } from "@/features/follow-ups/services/follow-up-permissions";
import {
  buildCustomerById,
  loadReadModelData,
  resolveFollowUpProjectId,
} from "@/server/queries/read-model-helpers";

export type RecentFollowUpItem = {
  customerName: string;
  followUpDate: string;
  id: string;
  summary: string;
};

type GetRecentFollowUpsDependencies = {
  loadReadModelData: typeof loadReadModelData;
};

export async function getRecentFollowUps(
  input: {
    limit?: number;
    projectId?: string;
    sessionUser: SessionUser;
  },
  dependencies: GetRecentFollowUpsDependencies = { loadReadModelData },
): Promise<RecentFollowUpItem[]> {
  requirePermission(input.sessionUser, "dashboard.read");

  const data = await dependencies.loadReadModelData({
    projectId: input.projectId,
    sessionUser: input.sessionUser,
  });
  const customerById = buildCustomerById(data.customers);

  return data.followUps
    .filter((followUp) => {
      const projectId = resolveFollowUpProjectId(
        {
          contractId: followUp.contract_id,
          customerId: followUp.customer_id,
          preferredProjectId: input.projectId,
        },
        data,
      );

      return (
        canReadFollowUpRecord(input.sessionUser, {
          collectorUserId: followUp.collector_user_id,
          createdBy: followUp.created_by,
          customerId: followUp.customer_id,
          projectId,
        }) && (!input.projectId || projectId === input.projectId)
      );
    })
    .sort((left, right) => right.follow_up_date.localeCompare(left.follow_up_date))
    .slice(0, input.limit ?? 5)
    .map((followUp) => ({
      customerName: customerById.get(followUp.customer_id)?.customer_name ?? followUp.customer_id,
      followUpDate: followUp.follow_up_date.slice(0, 10),
      id: followUp.id,
      summary: followUp.note,
    }));
}
