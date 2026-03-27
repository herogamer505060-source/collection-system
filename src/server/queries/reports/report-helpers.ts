import { canReadFollowUpRecord } from "@/features/follow-ups/services/follow-up-permissions";
import type { SessionUser } from "@/lib/auth/get-session-user";
import { requirePermission } from "@/lib/auth/permissions";
import { differenceInEgyptCalendarDays, getEgyptToday } from "@/lib/dates/egypt";
import type { Tables } from "@/types/database";

import {
  buildCustomerById,
  buildFollowUpsByCustomer,
  buildInstallmentsByContract,
  buildProfileById,
  buildProjectById,
  filterContractsByScope,
  loadReadModelData,
  paginate,
  resolveFollowUpProjectId,
} from "../read-model-helpers";

export type ReportQueryInput = {
  page?: number;
  pageSize?: number;
  projectId?: string;
  sessionUser: SessionUser;
};

export type ReportProjectOption = {
  id: string;
  label: string;
};

export type PaginatedReportResult<TItem, TFilters extends object = object> = {
  filters: TFilters & {
    page: number;
    pageSize: number;
    projectId: string | null;
  };
  items: TItem[];
  page: number;
  pageSize: number;
  projectOptions: ReportProjectOption[];
  totalCount: number;
};

export type ReportContext = {
  accessibleFollowUps: Tables<"follow_ups">[];
  contractById: Map<string, Tables<"contracts">>;
  contractsByCustomer: Map<string, Tables<"contracts">[]>;
  customerById: Map<string, Tables<"customers">>;
  customerProjectNames: Map<string, string>;
  followUpsByCustomer: Map<string, Tables<"follow_ups">[]>;
  installmentsByContract: Map<string, Tables<"installments">[]>;
  profileById: Map<string, Tables<"profiles">>;
  projectById: Map<string, Tables<"projects">>;
  projectOptions: ReportProjectOption[];
  visibleContracts: Tables<"contracts">[];
  visibleInstallments: Tables<"installments">[];
};

export const AGING_BUCKET_LABELS: Record<string, string> = {
  not_due: "غير مستحق",
  "1_30": "1-30 يوم",
  "31_60": "31-60 يوم",
  "61_90": "61-90 يوم",
  "90_plus": "أكثر من 90 يوم",
};

export const AGING_BUCKET_ORDER = ["not_due", "1_30", "31_60", "61_90", "90_plus"] as const;

export async function getReportContext(
  input: Pick<ReportQueryInput, "projectId" | "sessionUser">,
): Promise<ReportContext> {
  requirePermission(input.sessionUser, "reports.read");

  const data = await loadReadModelData({
    projectId: input.projectId,
    sessionUser: input.sessionUser,
  });
  const customerById = buildCustomerById(data.customers);
  const profileById = buildProfileById(data.profiles);
  const projectById = buildProjectById(data.projects);
  const visibleContracts = filterContractsByScope(input.sessionUser, data.contracts, input.projectId);
  const contractById = new Map(visibleContracts.map((contract) => [contract.id, contract]));
  const contractsByCustomer = groupContractsByCustomer(visibleContracts);
  const visibleContractIds = new Set(visibleContracts.map((contract) => contract.id));
  const visibleCustomerIds = new Set(visibleContracts.map((contract) => contract.customer_id));
  const visibleInstallments = data.installments.filter((installment) => visibleContractIds.has(installment.contract_id));
  const installmentsByContract = buildInstallmentsByContract(visibleInstallments);
  const customerProjectNames = buildCustomerProjectNames(visibleContracts, projectById);
  const projectOptions = buildProjectOptions(visibleContracts, projectById);
  const accessibleFollowUps = data.followUps.filter((followUp) => {
    const projectId = resolveFollowUpProjectId(
      {
        contractId: followUp.contract_id,
        customerId: followUp.customer_id,
        preferredProjectId: input.projectId,
      },
      data,
    );

    return (
      visibleCustomerIds.has(followUp.customer_id) &&
      canReadFollowUpRecord(input.sessionUser, {
        collectorUserId: followUp.collector_user_id,
        createdBy: followUp.created_by,
        customerId: followUp.customer_id,
        projectId,
      }) &&
      (!input.projectId || projectId === input.projectId)
    );
  });

  return {
    accessibleFollowUps,
    contractById,
    contractsByCustomer,
    customerById,
    customerProjectNames,
    followUpsByCustomer: buildFollowUpsByCustomer(accessibleFollowUps),
    installmentsByContract,
    profileById,
    projectById,
    projectOptions,
    visibleContracts,
    visibleInstallments,
  };
}

export function buildPaginatedReportResult<TItem, TFilters extends Record<string, unknown>>(
  items: TItem[],
  input: Pick<ReportQueryInput, "page" | "pageSize" | "projectId">,
  projectOptions: ReportProjectOption[],
  extraFilters: TFilters,
): PaginatedReportResult<TItem, TFilters> {
  const pagination = paginate(items, input.page, input.pageSize);

  return {
    filters: {
      ...extraFilters,
      page: pagination.page,
      pageSize: pagination.pageSize,
      projectId: input.projectId ?? null,
    },
    items: pagination.items,
    page: pagination.page,
    pageSize: pagination.pageSize,
    projectOptions,
    totalCount: pagination.totalCount,
  };
}

export function getCustomerProjectName(customerId: string, customerProjectNames: Map<string, string>): string {
  return customerProjectNames.get(customerId) ?? "—";
}

export function getFollowUpProjectName(
  followUp: Tables<"follow_ups">,
  context: Pick<ReportContext, "contractById" | "customerProjectNames" | "projectById">,
): string {
  if (followUp.contract_id) {
    const contract = context.contractById.get(followUp.contract_id);

    if (contract) {
      return getProjectName(contract.project_id, context.projectById);
    }
  }

  return getCustomerProjectName(followUp.customer_id, context.customerProjectNames);
}

export function getProjectName(
  projectId: string,
  projectById: Map<string, Tables<"projects">>,
): string {
  return projectById.get(projectId)?.name_ar ?? projectId;
}

export function getDaysSince(value: string | null, today = getEgyptToday()): number {
  if (!value) {
    return 0;
  }

  return Math.max(0, differenceInEgyptCalendarDays(today, value));
}

export function sumNumbers(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function buildProjectOptions(
  contracts: Tables<"contracts">[],
  projectById: Map<string, Tables<"projects">>,
): ReportProjectOption[] {
  return Array.from(new Set(contracts.map((contract) => contract.project_id)))
    .map((id) => ({ id, label: getProjectName(id, projectById) }))
    .sort((left, right) => left.label.localeCompare(right.label, "ar"));
}

function buildCustomerProjectNames(
  contracts: Tables<"contracts">[],
  projectById: Map<string, Tables<"projects">>,
): Map<string, string> {
  const projectsByCustomer = new Map<string, string[]>();

  for (const contract of contracts) {
    const nextNames = projectsByCustomer.get(contract.customer_id) ?? [];
    nextNames.push(getProjectName(contract.project_id, projectById));
    projectsByCustomer.set(contract.customer_id, Array.from(new Set(nextNames)).sort((left, right) => left.localeCompare(right, "ar")));
  }

  return new Map(Array.from(projectsByCustomer.entries()).map(([customerId, labels]) => [customerId, labels.join("، ")]));
}

function groupContractsByCustomer(contracts: Tables<"contracts">[]): Map<string, Tables<"contracts">[]> {
  const grouped = new Map<string, Tables<"contracts">[]>();

  for (const contract of contracts) {
    const nextContracts = grouped.get(contract.customer_id) ?? [];
    nextContracts.push(contract);
    grouped.set(contract.customer_id, nextContracts);
  }

  return grouped;
}
