import { getEgyptToday } from "@/lib/dates/egypt";
import type { SessionUser } from "@/lib/auth/get-session-user";
import { requirePermission } from "@/lib/auth/permissions";
import { canWriteFollowUp } from "@/lib/auth/role-scopes";

import {
  buildCustomerById,
  buildProfileById,
  buildProjectById,
  loadReadModelData,
  paginate,
  resolveFollowUpProjectId,
  sortByDateDescending,
} from "@/server/queries/read-model-helpers";
import { canReadFollowUpRecord } from "@/features/follow-ups/services/follow-up-permissions";

export type GetFollowUpsListInput = {
  collectorUserId?: string;
  endDate?: string;
  overdueOnly?: boolean;
  page?: number;
  pageSize?: number;
  promisedToPayOnly?: boolean;
  projectId?: string;
  search?: string;
  sessionUser: SessionUser;
  startDate?: string;
  status?: string;
};

export type FollowUpListItem = {
  canEdit: boolean;
  collectorName: string | null;
  collectorUserId: string | null;
  contactType: string;
  contractCode: string | null;
  contractId: string | null;
  customerId: string;
  customerName: string;
  customerResponse: string | null;
  followUpDate: string;
  followUpId: string;
  followUpStatus: string;
  isOverdue: boolean;
  nextActionDate: string | null;
  note: string;
  projectId: string | null;
  projectName: string | null;
  promiseDate: string | null;
  promisedToPay: boolean;
};

export type GetFollowUpsListResult = {
  collectorOptions: Array<{ id: string; label: string }>;
  filters: {
    collectorUserId: string | null;
    endDate: string | null;
    overdueOnly: boolean;
    page: number;
    pageSize: number;
    promisedToPayOnly: boolean;
    projectId: string | null;
    search: string | null;
    startDate: string | null;
    status: string | null;
  };
  items: FollowUpListItem[];
  page: number;
  pageSize: number;
  projectOptions: Array<{ id: string; label: string }>;
  totalCount: number;
};

type GetFollowUpsListDependencies = {
  loadReadModelData: typeof loadReadModelData;
};

export async function getFollowUpsList(
  input: GetFollowUpsListInput,
  dependencies: GetFollowUpsListDependencies = { loadReadModelData },
): Promise<GetFollowUpsListResult> {
  requirePermission(input.sessionUser, "followUps.read");

  const data = await dependencies.loadReadModelData({
    projectId: input.projectId,
    sessionUser: input.sessionUser,
  });
  const customerById = buildCustomerById(data.customers);
  const profileById = buildProfileById(data.profiles);
  const projectById = buildProjectById(data.projects);
  const contractById = new Map(data.contracts.map((contract) => [contract.id, contract]));
  const today = getEgyptToday();
  const visibleRows = sortByDateDescending(
    data.followUps
      .map((followUp) => {
        const projectId = resolveFollowUpProjectId(
          {
            contractId: followUp.contract_id,
            customerId: followUp.customer_id,
            preferredProjectId: input.projectId,
          },
          data,
        );

        return {
          canEdit: canWriteFollowUp(input.sessionUser, {
            collectorUserId: followUp.collector_user_id,
            createdBy: followUp.created_by,
            projectId,
          }),
          collectorName: followUp.collector_user_id
            ? profileById.get(followUp.collector_user_id)?.full_name ?? followUp.collector_user_id
            : null,
          collectorUserId: followUp.collector_user_id,
          contactType: followUp.contact_type,
          contractCode: followUp.contract_id ? contractById.get(followUp.contract_id)?.contract_code ?? null : null,
          contractId: followUp.contract_id,
          customerId: followUp.customer_id,
          customerName: customerById.get(followUp.customer_id)?.customer_name ?? followUp.customer_id,
          customerResponse: followUp.customer_response,
          followUpDate: followUp.follow_up_date,
          followUpId: followUp.id,
          followUpStatus: followUp.follow_up_status,
          isOverdue:
            followUp.follow_up_status === "open" &&
            Boolean(followUp.next_action_date && followUp.next_action_date < today),
          nextActionDate: followUp.next_action_date,
          note: followUp.note,
          projectId,
          projectName: projectId ? projectById.get(projectId)?.name_ar ?? projectId : null,
          promiseDate: followUp.promise_date,
          promisedToPay: followUp.promised_to_pay,
          raw: followUp,
        };
      })
      .filter((row) =>
        canReadFollowUpRecord(input.sessionUser, {
          collectorUserId: row.raw.collector_user_id,
          createdBy: row.raw.created_by,
          customerId: row.raw.customer_id,
          projectId: row.projectId,
        }),
      )
      .filter((row) => (input.projectId ? row.projectId === input.projectId : true))
      .filter((row) => (input.collectorUserId ? row.collectorUserId === input.collectorUserId : true))
      .filter((row) => (input.status ? row.followUpStatus === input.status : true))
      .filter((row) => (input.promisedToPayOnly ? row.promisedToPay : true))
      .filter((row) => (input.overdueOnly ? row.isOverdue : true))
      .filter((row) => (input.startDate ? row.followUpDate >= input.startDate : true))
      .filter((row) => (input.endDate ? row.followUpDate <= `${input.endDate}T23:59:59Z` : true))
      .filter((row) => {
        if (!input.search) return true;
        const s = input.search.trim().toLowerCase();
        return row.customerName.toLowerCase().includes(s) || row.note.toLowerCase().includes(s);
      })
      .map((row) => {
        const result = { ...row } as Omit<typeof row, "raw"> & { raw?: typeof row.raw };

        delete result.raw;

        return result;
      }),
    (row) => row.followUpDate,
  );
  const pagination = paginate(visibleRows, input.page, input.pageSize);
  const collectorOptions = Array.from(
    new Map(
      visibleRows
        .filter((row) => row.collectorUserId)
        .map((row) => [
          row.collectorUserId as string,
          {
            id: row.collectorUserId as string,
            label: row.collectorName ?? (row.collectorUserId as string),
          },
        ]),
    ).values(),
  ).sort((left, right) => left.label.localeCompare(right.label, "ar"));

  return {
    collectorOptions,
    filters: {
      collectorUserId: input.collectorUserId ?? null,
      endDate: input.endDate ?? null,
      overdueOnly: input.overdueOnly ?? false,
      page: pagination.page,
      pageSize: pagination.pageSize,
      promisedToPayOnly: input.promisedToPayOnly ?? false,
      projectId: input.projectId ?? null,
      search: input.search ?? null,
      startDate: input.startDate ?? null,
      status: input.status ?? null,
    },
    items: pagination.items,
    page: pagination.page,
    pageSize: pagination.pageSize,
    projectOptions: Array.from(new Set(visibleRows.map((row) => row.projectId).filter(Boolean))).map((projectId) => ({
      id: projectId as string,
      label: projectById.get(projectId as string)?.name_ar ?? (projectId as string),
    })),
    totalCount: pagination.totalCount,
  };
}
