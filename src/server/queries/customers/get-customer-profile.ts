import type { SessionUser } from "@/lib/auth/get-session-user";
import { requirePermission } from "@/lib/auth/permissions";

import {
  buildCustomerById,
  buildFollowUpsByCustomer,
  buildInstallmentsByContract,
  buildProfileById,
  buildProjectById,
  buildUnitCodesByContract,
  buildUnitsByContract,
  calculateAggregateTotals,
  deriveContractPaymentStatus,
  filterContractsByScope,
  loadReadModelData,
  sortByDateDescending,
  type AggregateTotals,
  type ContractPaymentStatus,
  type ReadModelData,
} from "@/server/queries/read-model-helpers";

export type CustomerProfileContract = {
  collectorName: string | null;
  contractCode: string | null;
  contractId: string;
  contractStatus: ContractPaymentStatus;
  projectId: string;
  projectName: string;
  totals: AggregateTotals;
  unitCodes: string[];
};

export type CustomerProfileInstallment = {
  amountCollected: number;
  amountDue: number;
  amountOutstanding: number;
  contractCode: string | null;
  contractId: string;
  delayDays: number;
  dueDate: string;
  installmentCode: string | null;
  installmentId: string;
  installmentType: string;
  paymentStatus: string;
  penaltyAmount: number;
  projectId: string;
  projectName: string;
  unitCodes: string[];
};

export type CustomerProfileFollowUp = {
  collectorName: string | null;
  collectorUserId: string | null;
  contactType: string;
  contractId: string | null;
  followUpDate: string;
  followUpStatus: string;
  id: string;
  nextActionDate: string | null;
  note: string;
  promiseDate: string | null;
  promisedToPay: boolean;
};

export type CustomerProfileResult = {
  contracts: CustomerProfileContract[];
  customer: {
    customerId: string;
    customerName: string;
    customerNameRaw: string | null;
    email: string | null;
    mobile: string | null;
    nationalId: string | null;
    normalizedName: string;
    notes: string | null;
  };
  followUps: CustomerProfileFollowUp[];
  installments: CustomerProfileInstallment[];
  totals: AggregateTotals & {
    contractCount: number;
    followUpCount: number;
    overdueInstallments: number;
  };
};

type GetCustomerProfileDependencies = {
  loadReadModelData: typeof loadReadModelData;
};

export async function getCustomerProfile(
  input: { customerId: string; sessionUser: SessionUser },
  dependencies: GetCustomerProfileDependencies = { loadReadModelData },
): Promise<CustomerProfileResult | null> {
  requirePermission(input.sessionUser, "customers.read");

  const data = await dependencies.loadReadModelData({ sessionUser: input.sessionUser });
  const customerById = buildCustomerById(data.customers);
  const customer = customerById.get(input.customerId);

  if (!customer) {
    return null;
  }

  const contracts = filterContractsByScope(input.sessionUser, data.contracts).filter(
    (contract) => contract.customer_id === input.customerId,
  );

  if (contracts.length === 0) {
    return null;
  }

  return buildCustomerProfile(customer, contracts, data);
}

function buildCustomerProfile(
  customer: NonNullable<Awaited<ReturnType<typeof buildCustomerById>> extends Map<string, infer TValue> ? TValue : never>,
  contracts: ReadModelData["contracts"],
  data: ReadModelData,
): CustomerProfileResult {
  const followUpsByCustomer = buildFollowUpsByCustomer(data.followUps);
  const installmentsByContract = buildInstallmentsByContract(data.installments);
  const profileById = buildProfileById(data.profiles);
  const projectById = buildProjectById(data.projects);
  const unitCodesByContract = buildUnitCodesByContract(data);
  const unitsByContract = buildUnitsByContract(data);
  const contractById = new Map(contracts.map((contract) => [contract.id, contract]));
  const installments = contracts.flatMap((contract) => installmentsByContract.get(contract.id) ?? []);
  const totals = calculateAggregateTotals(installments);
  const contractIds = new Set(contracts.map((contract) => contract.id));
  const followUps = sortByDateDescending(
    (followUpsByCustomer.get(customer.id) ?? []).filter(
      (followUp) => !followUp.contract_id || contractIds.has(followUp.contract_id),
    ),
    (followUp) => followUp.follow_up_date,
  );

  return {
    contracts: contracts
      .map((contract) => {
        const contractInstallments = installmentsByContract.get(contract.id) ?? [];

        return {
          collectorName: contract.collector_user_id
            ? profileById.get(contract.collector_user_id)?.full_name ?? contract.collector_user_id
            : null,
          contractCode: contract.contract_code,
          contractId: contract.id,
          contractStatus: deriveContractPaymentStatus(contractInstallments),
          projectId: contract.project_id,
          projectName: projectById.get(contract.project_id)?.name_ar ?? contract.project_id,
          totals: calculateAggregateTotals(contractInstallments),
          unitCodes: unitCodesByContract.get(contract.id) ?? [],
        };
      })
      .sort((left, right) => left.projectName.localeCompare(right.projectName, "ar")),
    customer: {
      customerId: customer.id,
      customerName: customer.customer_name,
      customerNameRaw: customer.customer_name_raw,
      email: customer.email,
      mobile: customer.mobile,
      nationalId: customer.national_id,
      normalizedName: customer.normalized_name,
      notes: customer.notes,
    },
    followUps: followUps.map((followUp) => ({
      collectorName: followUp.collector_user_id
        ? profileById.get(followUp.collector_user_id)?.full_name ?? followUp.collector_user_id
        : null,
      collectorUserId: followUp.collector_user_id,
      contactType: followUp.contact_type,
      contractId: followUp.contract_id,
      followUpDate: followUp.follow_up_date,
      followUpStatus: followUp.follow_up_status,
      id: followUp.id,
      nextActionDate: followUp.next_action_date,
      note: followUp.note,
      promiseDate: followUp.promise_date,
      promisedToPay: followUp.promised_to_pay,
    })),
    installments: sortByDateDescending(
      installments.map((installment) => {
        const contract = contractById.get(installment.contract_id);

        return {
          amountCollected: installment.amount_collected,
          amountDue: installment.amount_due,
          amountOutstanding: installment.amount_outstanding,
          contractCode: contract?.contract_code ?? null,
          contractId: installment.contract_id,
          delayDays: installment.delay_days,
          dueDate: installment.due_date,
          installmentCode: installment.installment_code,
          installmentId: installment.id,
          installmentType: installment.installment_type,
          paymentStatus: installment.payment_status,
          penaltyAmount: installment.penalty_amount,
          projectId: contract?.project_id ?? "",
          projectName: contract ? projectById.get(contract.project_id)?.name_ar ?? contract.project_id : "",
          unitCodes: unitsByContract.get(installment.contract_id)?.map((unit) => unit.unit_code) ?? [],
        };
      }),
      (installment) => installment.dueDate,
    ),
    totals: {
      ...totals,
      contractCount: contracts.length,
      followUpCount: followUps.length,
      overdueInstallments: installments.filter((installment) => installment.payment_status === "overdue").length,
    },
  };
}
