import { normalizeCustomerName } from "@/features/imports/normalization/normalize-customer-name";
import {
  canAccessContract,
  canAccessProject,
  getAssignedProjectIds,
} from "@/lib/auth/role-scopes";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { SessionUser } from "@/lib/auth/get-session-user";
import type { Tables } from "@/types/database";

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

export type ReadModelData = {
  contractUnits: Tables<"contract_units">[];
  contracts: Tables<"contracts">[];
  customers: Tables<"customers">[];
  followUps: Tables<"follow_ups">[];
  installments: Tables<"installments">[];
  profiles: Tables<"profiles">[];
  projects: Tables<"projects">[];
  units: Tables<"units">[];
};

export type AggregateTotals = {
  amountCollected: number;
  amountDue: number;
  amountOutstanding: number;
  penaltyAmount: number;
};

export type ContractPaymentStatus = "outstanding" | "overdue" | "paid" | "partial";
export type CustomerPaymentStatus = "all_paid" | "has_outstanding" | "has_overdue";

export type QueryFilters = {
  page?: number;
  pageSize?: number;
  projectId?: string;
  search?: string;
};

export type LoadReadModelDataInput = {
  projectId?: string;
  sessionUser?: SessionUser;
};

export async function loadReadModelData(
  input: LoadReadModelDataInput = {},
  client: AdminClient = createAdminSupabaseClient(),
): Promise<ReadModelData> {
  const scopedProjectIds = resolveScopedProjectIds(input);

  if (scopedProjectIds !== null) {
    return loadProjectScopedReadModelData(scopedProjectIds, client, input.sessionUser);
  }

  return loadAllReadModelData(client);
}

async function loadAllReadModelData(
  client: AdminClient,
): Promise<ReadModelData> {
  const [contractUnits, contracts, customers, followUps, installments, profiles, projects, units] = await Promise.all([
    selectAll(client, "contract_units"),
    selectAll(client, "contracts"),
    selectAll(client, "customers"),
    selectAll(client, "follow_ups"),
    selectAll(client, "installments"),
    selectAll(client, "profiles"),
    selectAll(client, "projects"),
    selectAll(client, "units"),
  ]);

  return {
    contractUnits,
    contracts,
    customers,
    followUps,
    installments,
    profiles,
    projects,
    units,
  };
}

export async function loadProjectScopedReadModelData(
  projectIds: string[],
  client: AdminClient = createAdminSupabaseClient(),
  sessionUser?: SessionUser,
): Promise<ReadModelData> {
  if (projectIds.length === 0) {
    return createEmptyReadModelData();
  }

  const [contracts, profiles, projects, units] = await Promise.all([
    selectContractsByScope(client, projectIds, sessionUser),
    selectAll(client, "profiles"),
    selectWhereIn(client, "projects", "id", projectIds),
    selectWhereIn(client, "units", "project_id", projectIds),
  ]);

  const contractIds = contracts.map((contract) => contract.id);
  const customerIds = Array.from(new Set(contracts.map((contract) => contract.customer_id)));

  const [contractUnits, customers, followUps, installments] = await Promise.all([
    selectWhereIn(client, "contract_units", "contract_id", contractIds),
    selectWhereIn(client, "customers", "id", customerIds),
    selectFollowUpsByScope(client, {
      contractIds,
      contracts,
      customerIds,
      projectIds,
      sessionUser,
    }),
    selectWhereIn(client, "installments", "contract_id", contractIds),
  ]);

  return {
    contractUnits,
    contracts,
    customers,
    followUps,
    installments,
    profiles,
    projects,
    units,
  };
}

function resolveScopedProjectIds(input: LoadReadModelDataInput): string[] | null {
  if (input.projectId) {
    if (!input.sessionUser) {
      return [input.projectId];
    }

    const hasGlobalScope = input.sessionUser.roles.some(
      (assignment) => assignment.role === "admin" || assignment.projectId === null,
    );

    if (hasGlobalScope) {
      return [input.projectId];
    }

    return getAssignedProjectIds(input.sessionUser).includes(input.projectId)
      ? [input.projectId]
      : [];
  }

  if (!input.sessionUser) {
    return null;
  }

  const hasGlobalScope = input.sessionUser.roles.some(
    (assignment) => assignment.role === "admin" || assignment.projectId === null,
  );

  if (hasGlobalScope) {
    return null;
  }

  return getAssignedProjectIds(input.sessionUser);
}

function createEmptyReadModelData(): ReadModelData {
  return {
    contractUnits: [],
    contracts: [],
    customers: [],
    followUps: [],
    installments: [],
    profiles: [],
    projects: [],
    units: [],
  };
}

async function selectContractsByScope(
  client: AdminClient,
  projectIds: string[],
  sessionUser?: SessionUser,
): Promise<Tables<"contracts">[]> {
  if (!sessionUser) {
    return selectWhereIn(client, "contracts", "project_id", projectIds);
  }

  const { broadProjectIds, collectorProjectIds } = resolveProjectAccess(sessionUser, projectIds);
  const contractGroups = await Promise.all([
    broadProjectIds.length > 0
      ? selectWhereIn(client, "contracts", "project_id", broadProjectIds)
      : Promise.resolve([] as Tables<"contracts">[]),
    collectorProjectIds.length > 0
      ? selectContractsForCollector(client, collectorProjectIds, sessionUser.id)
      : Promise.resolve([] as Tables<"contracts">[]),
  ]);

  return dedupeRowsById(contractGroups.flat());
}

async function selectFollowUpsByScope(
  client: AdminClient,
  input: {
    contractIds: string[];
    contracts: Tables<"contracts">[];
    customerIds: string[];
    projectIds: string[];
    sessionUser?: SessionUser;
  },
): Promise<Tables<"follow_ups">[]> {
  const [followUpsWithContracts, contractlessFollowUps] = await Promise.all([
    selectWhereIn(client, "follow_ups", "contract_id", input.contractIds),
    selectContractlessFollowUpsByScope(client, input),
  ]);

  return dedupeRowsById([...followUpsWithContracts, ...contractlessFollowUps]);
}

async function selectContractlessFollowUpsByScope(
  client: AdminClient,
  input: {
    contracts: Tables<"contracts">[];
    customerIds: string[];
    projectIds: string[];
    sessionUser?: SessionUser;
  },
): Promise<Tables<"follow_ups">[]> {
  if (input.customerIds.length === 0) {
    return [];
  }

  if (!input.sessionUser) {
    return selectContractlessFollowUpsByCustomerIds(client, input.customerIds);
  }

  const { broadProjectIds, collectorProjectIds } = resolveProjectAccess(
    input.sessionUser,
    input.projectIds,
  );
  const broadCustomerIds = getCustomerIdsForProjects(input.contracts, broadProjectIds);
  const collectorCustomerIds = getCustomerIdsForProjects(input.contracts, collectorProjectIds);
  const followUpGroups = await Promise.all([
    broadCustomerIds.length > 0
      ? selectContractlessFollowUpsByCustomerIds(client, broadCustomerIds)
      : Promise.resolve([] as Tables<"follow_ups">[]),
    collectorCustomerIds.length > 0
      ? selectContractlessFollowUpsByCustomerIds(client, collectorCustomerIds, input.sessionUser.id)
      : Promise.resolve([] as Tables<"follow_ups">[]),
  ]);

  return dedupeRowsById(followUpGroups.flat());
}

async function selectContractsForCollector(
  client: AdminClient,
  projectIds: string[],
  collectorUserId: string,
): Promise<Tables<"contracts">[]> {
  const { data, error } = await client
    .from("contracts")
    .select("*")
    .eq("collector_user_id", collectorUserId)
    .in("project_id", projectIds);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function selectContractlessFollowUpsByCustomerIds(
  client: AdminClient,
  customerIds: string[],
  actorId?: string,
): Promise<Tables<"follow_ups">[]> {
  if (customerIds.length === 0) {
    return [];
  }

  let query = client
    .from("follow_ups")
    .select("*")
    .is("contract_id", null)
    .in("customer_id", customerIds);

  if (actorId) {
    query = query.or(`collector_user_id.eq.${actorId},created_by.eq.${actorId}`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

function resolveProjectAccess(
  sessionUser: SessionUser,
  projectIds: string[],
): { broadProjectIds: string[]; collectorProjectIds: string[] } {
  const broadProjectIds = new Set<string>();
  const collectorProjectIds = new Set<string>();

  for (const assignment of sessionUser.roles) {
    const matchingProjectIds =
      assignment.projectId === null
        ? projectIds
        : projectIds.filter((projectId) => projectId === assignment.projectId);

    if (assignment.role === "admin" || assignment.role === "manager" || assignment.role === "viewer") {
      for (const projectId of matchingProjectIds) {
        broadProjectIds.add(projectId);
        collectorProjectIds.delete(projectId);
      }

      continue;
    }

    if (assignment.role === "collector") {
      for (const projectId of matchingProjectIds) {
        if (!broadProjectIds.has(projectId)) {
          collectorProjectIds.add(projectId);
        }
      }
    }
  }

  return {
    broadProjectIds: [...broadProjectIds],
    collectorProjectIds: [...collectorProjectIds],
  };
}

function getCustomerIdsForProjects(
  contracts: Tables<"contracts">[],
  projectIds: string[],
): string[] {
  const allowedProjectIds = new Set(projectIds);

  return Array.from(
    new Set(
      contracts
        .filter((contract) => allowedProjectIds.has(contract.project_id))
        .map((contract) => contract.customer_id),
    ),
  );
}

function dedupeRowsById<TData extends { id: string }>(rows: TData[]): TData[] {
  return Array.from(new Map(rows.map((row) => [row.id, row])).values());
}

async function selectWhereIn<TableName extends ReadModelTableName>(
  client: AdminClient,
  tableName: TableName,
  column: string,
  values: string[],
): Promise<ReadModelTableRows[TableName]> {
  if (values.length === 0) {
    return [] as ReadModelTableRows[TableName];
  }

  const { data, error } = await client.from(tableName as never).select("*").in(column, values as never);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as ReadModelTableRows[TableName];
}

export function filterContractsByScope(
  sessionUser: SessionUser,
  contracts: Tables<"contracts">[],
  projectId?: string,
): Tables<"contracts">[] {
  return contracts.filter((contract) => {
    if (projectId && contract.project_id !== projectId) {
      return false;
    }

    return canAccessContract(sessionUser, {
      collectorUserId: contract.collector_user_id,
      projectId: contract.project_id,
    });
  });
}

export function filterUnitsByScope(
  sessionUser: SessionUser,
  units: Tables<"units">[],
  projectId?: string,
): Tables<"units">[] {
  return units.filter((unit) => {
    if (projectId && unit.project_id !== projectId) {
      return false;
    }

    return canAccessProject(sessionUser, unit.project_id);
  });
}

export function buildUnitCodesByContract(data: ReadModelData): Map<string, string[]> {
  const unitById = new Map(data.units.map((unit) => [unit.id, unit]));
  const unitCodesByContract = new Map<string, string[]>();

  for (const link of data.contractUnits) {
    const unit = unitById.get(link.unit_id);

    if (!unit) {
      continue;
    }

    const nextCodes = unitCodesByContract.get(link.contract_id) ?? [];
    nextCodes.push(unit.unit_code);
    unitCodesByContract.set(link.contract_id, Array.from(new Set(nextCodes)).sort());
  }

  return unitCodesByContract;
}

export function buildUnitsByContract(data: ReadModelData): Map<string, Tables<"units">[]> {
  const unitById = new Map(data.units.map((unit) => [unit.id, unit]));
  const unitsByContract = new Map<string, Tables<"units">[]>();

  for (const link of data.contractUnits) {
    const unit = unitById.get(link.unit_id);

    if (!unit) {
      continue;
    }

    const nextUnits = unitsByContract.get(link.contract_id) ?? [];
    nextUnits.push(unit);
    unitsByContract.set(link.contract_id, nextUnits);
  }

  return unitsByContract;
}

export function buildContractByUnitId(data: ReadModelData): Map<string, Tables<"contracts">> {
  const contractById = new Map(data.contracts.map((contract) => [contract.id, contract]));
  const contractByUnitId = new Map<string, Tables<"contracts">>();
  const orderedLinks = [...data.contractUnits].sort((left, right) => {
    const leftOrder = left.unit_order ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.unit_order ?? Number.MAX_SAFE_INTEGER;

    return leftOrder - rightOrder;
  });

  for (const link of orderedLinks) {
    if (contractByUnitId.has(link.unit_id)) {
      continue;
    }

    const contract = contractById.get(link.contract_id);

    if (!contract) {
      continue;
    }

    contractByUnitId.set(link.unit_id, contract);
  }

  return contractByUnitId;
}

export function buildProjectById(projects: Tables<"projects">[]): Map<string, Tables<"projects">> {
  return new Map(projects.map((project) => [project.id, project]));
}

export function buildCustomerById(customers: Tables<"customers">[]): Map<string, Tables<"customers">> {
  return new Map(customers.map((customer) => [customer.id, customer]));
}

export function buildProfileById(profiles: Tables<"profiles">[]): Map<string, Tables<"profiles">> {
  return new Map(profiles.map((profile) => [profile.id, profile]));
}

export function buildInstallmentsByContract(
  installments: Tables<"installments">[],
): Map<string, Tables<"installments">[]> {
  return groupBy(installments, (installment) => installment.contract_id);
}

export function buildFollowUpsByCustomer(
  followUps: Tables<"follow_ups">[],
): Map<string, Tables<"follow_ups">[]> {
  return groupBy(followUps, (followUp) => followUp.customer_id);
}

export function buildFollowUpsByContract(
  followUps: Tables<"follow_ups">[],
): Map<string, Tables<"follow_ups">[]> {
  return groupBy(
    followUps.filter((followUp) => Boolean(followUp.contract_id)),
    (followUp) => followUp.contract_id as string,
  );
}

export function calculateAggregateTotals(installments: Tables<"installments">[]): AggregateTotals {
  return installments.reduce<AggregateTotals>(
    (totals, installment) => ({
      amountCollected: totals.amountCollected + installment.amount_collected,
      amountDue: totals.amountDue + installment.amount_due,
      amountOutstanding: totals.amountOutstanding + installment.amount_outstanding,
      penaltyAmount: totals.penaltyAmount + installment.penalty_amount,
    }),
    {
      amountCollected: 0,
      amountDue: 0,
      amountOutstanding: 0,
      penaltyAmount: 0,
    },
  );
}

export function deriveContractPaymentStatus(installments: Tables<"installments">[]): ContractPaymentStatus {
  if (installments.length === 0) {
    return "outstanding";
  }

  if (installments.every((installment) => installment.payment_status === "paid")) {
    return "paid";
  }

  if (installments.some((installment) => installment.payment_status === "overdue")) {
    return "overdue";
  }

  if (installments.some((installment) => installment.amount_collected > 0)) {
    return "partial";
  }

  return "outstanding";
}

export function deriveCustomerPaymentStatus(installments: Tables<"installments">[]): CustomerPaymentStatus {
  if (installments.some((installment) => installment.payment_status === "overdue")) {
    return "has_overdue";
  }

  if (installments.some((installment) => installment.amount_outstanding > 0)) {
    return "has_outstanding";
  }

  return "all_paid";
}

export function matchesArabicSearch(customer: Tables<"customers">, search?: string): boolean {
  if (!search || typeof search !== "string") {
    return true;
  }

  const trimmedSearch = search.trim();

  if (trimmedSearch.length === 0) {
    return true;
  }

  const normalizedSearch = normalizeCustomerName(trimmedSearch);

  if (!normalizedSearch) {
    return true;
  }

  const searchValue = trimmedSearch.toLowerCase();

  return (
    customer.normalized_name.includes(normalizedSearch) ||
    customer.customer_name.toLowerCase().includes(searchValue)
  );
}

export function resolveFollowUpProjectId(
  input: {
    contractId?: string | null;
    customerId: string;
    preferredProjectId?: string | null;
  },
  data: Pick<ReadModelData, "contracts">,
): string | null {
  if (input.contractId) {
    return data.contracts.find((contract) => contract.id === input.contractId)?.project_id ?? null;
  }

  const customerProjects = Array.from(
    new Set(
      data.contracts
        .filter((contract) => contract.customer_id === input.customerId)
        .map((contract) => contract.project_id),
    ),
  );

  if (input.preferredProjectId && customerProjects.includes(input.preferredProjectId)) {
    return input.preferredProjectId;
  }

  if (customerProjects.length === 1) {
    return customerProjects[0];
  }

  return customerProjects[0] ?? null;
}

export function paginate<TData>(data: TData[], page = 1, pageSize = 50): {
  items: TData[];
  page: number;
  pageSize: number;
  totalCount: number;
} {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 50;
  const start = (safePage - 1) * safePageSize;

  return {
    items: data.slice(start, start + safePageSize),
    page: safePage,
    pageSize: safePageSize,
    totalCount: data.length,
  };
}

export function sortByDateDescending<TData>(
  data: TData[],
  getDate: (item: TData) => string,
): TData[] {
  return [...data].sort((left, right) => getDate(right).localeCompare(getDate(left)));
}

type ReadModelTableName =
  | "contract_units"
  | "contracts"
  | "customers"
  | "follow_ups"
  | "installments"
  | "profiles"
  | "projects"
  | "units";

type ReadModelTableRows = {
  contract_units: Tables<"contract_units">[];
  contracts: Tables<"contracts">[];
  customers: Tables<"customers">[];
  follow_ups: Tables<"follow_ups">[];
  installments: Tables<"installments">[];
  profiles: Tables<"profiles">[];
  projects: Tables<"projects">[];
  units: Tables<"units">[];
};

async function selectAll<TableName extends ReadModelTableName>(
  client: AdminClient,
  tableName: TableName,
): Promise<ReadModelTableRows[TableName]> {
  const { data, error } = await client.from(tableName as never).select("*");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as ReadModelTableRows[TableName];
}

function groupBy<TData>(data: TData[], getKey: (item: TData) => string): Map<string, TData[]> {
  const grouped = new Map<string, TData[]>();

  for (const item of data) {
    const key = getKey(item);
    const nextItems = grouped.get(key) ?? [];
    nextItems.push(item);
    grouped.set(key, nextItems);
  }

  return grouped;
}
