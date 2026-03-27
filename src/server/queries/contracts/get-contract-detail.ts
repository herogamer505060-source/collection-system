import type { SessionUser } from "@/lib/auth/get-session-user";
import { requirePermission } from "@/lib/auth/permissions";

import {
  buildCustomerById,
  buildFollowUpsByContract,
  buildInstallmentsByContract,
  buildProfileById,
  buildProjectById,
  buildUnitsByContract,
  calculateAggregateTotals,
  deriveContractPaymentStatus,
  filterContractsByScope,
  loadReadModelData,
  sortByDateDescending,
  type AggregateTotals,
} from "@/server/queries/read-model-helpers";

export type ContractDetailResult = {
  contract: {
    collectorName: string | null;
    collectorUserId: string | null;
    contractCode: string | null;
    contractId: string;
    contractNotes: string | null;
    contractStatus: string;
    customer: {
      customerId: string;
      customerName: string;
    };
    project: {
      projectId: string;
      projectName: string;
    };
    deliveryDate: string | null;
    totals: AggregateTotals & {
      derivedStatus: ReturnType<typeof deriveContractPaymentStatus>;
      followUpCount: number;
    };
  };
  followUps: Array<{
    contactType: string;
    followUpDate: string;
    followUpStatus: string;
    id: string;
    note: string;
    promiseDate: string | null;
    promisedToPay: boolean;
  }>;
    installments: Array<{
      amountCollected: number;
      amountDue: number;
      amountOutstanding: number;
      delayDays: number;
      dueDate: string;
      installmentCode: string | null;
      installmentId: string;
      installmentType: string;
      paymentDate: string | null;
      paymentStatus: string;
      penaltyAmount: number;
      receiptReference: string | null;
    }>;
  units: Array<{
    builtUpArea: number | null;
    contractPrice: number | null;
    floorName: string | null;
    gardenArea: number | null;
    listPrice: number | null;
    unitCode: string;
    unitId: string;
    unitStatus: string;
  }>;
};

type GetContractDetailDependencies = {
  loadReadModelData: typeof loadReadModelData;
};

export async function getContractDetail(
  input: { contractId: string; sessionUser: SessionUser },
  dependencies: GetContractDetailDependencies = { loadReadModelData },
): Promise<ContractDetailResult | null> {
  requirePermission(input.sessionUser, "contracts.read");

  const data = await dependencies.loadReadModelData({ sessionUser: input.sessionUser });
  const contract = filterContractsByScope(input.sessionUser, data.contracts).find(
    (item) => item.id === input.contractId,
  );

  if (!contract) {
    return null;
  }

  const customerById = buildCustomerById(data.customers);
  const followUpsByContract = buildFollowUpsByContract(data.followUps);
  const installmentsByContract = buildInstallmentsByContract(data.installments);
  const profileById = buildProfileById(data.profiles);
  const projectById = buildProjectById(data.projects);
  const unitsByContract = buildUnitsByContract(data);
  const contractInstallments = installmentsByContract.get(contract.id) ?? [];
  const followUps = sortByDateDescending(followUpsByContract.get(contract.id) ?? [], (followUp) => followUp.follow_up_date);
  const totals = calculateAggregateTotals(contractInstallments);

  return {
    contract: {
      collectorName: contract.collector_user_id
        ? profileById.get(contract.collector_user_id)?.full_name ?? contract.collector_user_id
        : null,
      collectorUserId: contract.collector_user_id,
      contractCode: contract.contract_code,
      contractId: contract.id,
      contractNotes: contract.contract_notes,
      contractStatus: contract.contract_status,
      customer: {
        customerId: contract.customer_id,
        customerName: customerById.get(contract.customer_id)?.customer_name ?? contract.customer_id,
      },
      project: {
        projectId: contract.project_id,
        projectName: projectById.get(contract.project_id)?.name_ar ?? contract.project_id,
      },
      deliveryDate: contract.delivery_date,
      totals: {
        ...totals,
        derivedStatus: deriveContractPaymentStatus(contractInstallments),
        followUpCount: followUps.length,
      },
    },
    followUps: followUps.map((followUp) => ({
      contactType: followUp.contact_type,
      followUpDate: followUp.follow_up_date,
      followUpStatus: followUp.follow_up_status,
      id: followUp.id,
      note: followUp.note,
      promiseDate: followUp.promise_date,
      promisedToPay: followUp.promised_to_pay,
    })),
    installments: contractInstallments
      .map((installment) => ({
        amountCollected: installment.amount_collected,
        amountDue: installment.amount_due,
        amountOutstanding: installment.amount_outstanding,
        delayDays: installment.delay_days,
        dueDate: installment.due_date,
        installmentCode: installment.installment_code,
        installmentId: installment.id,
        installmentType: installment.installment_type,
        paymentDate: installment.payment_date,
        paymentStatus: installment.payment_status,
        penaltyAmount: installment.penalty_amount,
        receiptReference: installment.receipt_reference,
      }))
      .sort((left, right) => left.dueDate.localeCompare(right.dueDate)),
    units: (unitsByContract.get(contract.id) ?? []).map((unit) => ({
      builtUpArea: unit.built_up_area,
      contractPrice: unit.contract_price,
      floorName: unit.floor_name,
      gardenArea: unit.garden_area,
      listPrice: unit.list_price,
      unitCode: unit.unit_code,
      unitId: unit.id,
      unitStatus: unit.unit_status,
    })),
  };
}
