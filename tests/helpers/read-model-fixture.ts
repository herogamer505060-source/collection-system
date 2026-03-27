import type { ReadModelData } from "@/server/queries/read-model-helpers";
import type { Tables } from "@/types/database";

export function createReadModelFixture(): ReadModelData {
  const profiles: Tables<"profiles">[] = [
    createProfile({ email: "collector1@example.com", full_name: "محصل أول", id: "collector-1" }),
    createProfile({ email: "collector2@example.com", full_name: "محصل ثان", id: "collector-2" }),
    createProfile({ email: "manager1@example.com", full_name: "مدير أول", id: "manager-1" }),
  ];
  const projects: Tables<"projects">[] = [
    createProject({ id: "project-parco", name_ar: "إل باركو", name_en: "IL Parco", project_code: "parco" }),
    createProject({ id: "project-centro", name_ar: "إل سنترو", name_en: "IL Centro", project_code: "centro" }),
  ];
  const customers: Tables<"customers">[] = [
    createCustomer({
      customer_key: "customer-ahmed",
      customer_name: "أحمد علي",
      customer_name_raw: "أحمد علي",
      id: "customer-ahmed",
      normalized_name: "احمد علي",
    }),
    createCustomer({
      customer_key: "customer-mona",
      customer_name: "منى سمير",
      customer_name_raw: "منى سمير",
      id: "customer-mona",
      normalized_name: "مني سمير",
    }),
  ];
  const contracts: Tables<"contracts">[] = [
    createContract({
      contract_code: "PAR-001",
      contract_key: "parco::ahmed::B28",
      customer_id: "customer-ahmed",
      id: "contract-ahmed-parco",
      project_id: "project-parco",
    }),
    createContract({
      contract_code: "CEN-009",
      contract_key: "centro::ahmed::F7",
      customer_id: "customer-ahmed",
      id: "contract-ahmed-centro",
      project_id: "project-centro",
    }),
    createContract({
      collector_user_id: "collector-2",
      contract_code: "PAR-050",
      contract_key: "parco::mona::B30",
      customer_id: "customer-mona",
      id: "contract-mona-parco",
      project_id: "project-parco",
    }),
  ];
  const units: Tables<"units">[] = [
    createUnit({ id: "unit-b28", project_id: "project-parco", unit_code: "B28", unit_key: "parco::B28", unit_status: "sold" }),
    createUnit({ id: "unit-f7", project_id: "project-centro", unit_code: "F7", unit_key: "centro::F7", unit_status: "sold" }),
    createUnit({ id: "unit-b30", project_id: "project-parco", unit_code: "B30", unit_key: "parco::B30", unit_status: "sold" }),
    createUnit({
      contract_price: null,
      id: "unit-a10",
      list_price: 750000,
      project_id: "project-parco",
      source_available: true,
      source_sold: false,
      unit_code: "A10",
      unit_key: "parco::A10",
      unit_status: "available",
    }),
  ];
  const contractUnits: Tables<"contract_units">[] = [
    createContractUnit({ contract_id: "contract-ahmed-parco", id: "link-1", unit_id: "unit-b28" }),
    createContractUnit({ contract_id: "contract-ahmed-centro", id: "link-2", unit_id: "unit-f7" }),
    createContractUnit({ contract_id: "contract-mona-parco", id: "link-3", unit_id: "unit-b30" }),
  ];
  const installments: Tables<"installments">[] = [
    createInstallment({
      amount_due: 1000,
      amount_outstanding: 1000,
      contract_id: "contract-ahmed-parco",
      delay_bucket: "1_30",
      delay_days: 10,
      due_date: "2026-03-01",
      id: "installment-1",
      installment_code: "INST-1",
      installment_key: "INST-1",
      payment_status: "overdue",
      penalty_amount: 25,
    }),
    createInstallment({
      amount_collected: 500,
      amount_due: 1000,
      amount_outstanding: 500,
      contract_id: "contract-ahmed-centro",
      delay_bucket: "not_due",
      delay_days: 0,
      due_date: "2026-04-15",
      id: "installment-2",
      installment_code: "INST-2",
      installment_key: "INST-2",
      payment_status: "partial",
      penalty_amount: 0,
    }),
    createInstallment({
      amount_collected: 1000,
      amount_due: 1000,
      amount_outstanding: 0,
      contract_id: "contract-mona-parco",
      delay_bucket: "not_due",
      delay_days: 0,
      due_date: "2026-02-01",
      id: "installment-3",
      installment_code: "INST-3",
      installment_key: "INST-3",
      payment_status: "paid",
      penalty_amount: 0,
    }),
  ];
  const followUps: Tables<"follow_ups">[] = [
    createFollowUp({
      contract_id: "contract-ahmed-parco",
      created_by: "manager-1",
      customer_id: "customer-ahmed",
      follow_up_date: "2026-03-20T10:00:00Z",
      id: "follow-up-1",
      note: "تم التواصل بخصوص قسط متأخر",
      promise_date: "2026-03-27",
      promised_to_pay: true,
    }),
    createFollowUp({
      contract_id: "contract-ahmed-centro",
      created_by: "manager-1",
      customer_id: "customer-ahmed",
      follow_up_date: "2026-03-10T10:00:00Z",
      id: "follow-up-2",
      note: "متابعة على عقد آخر",
      promised_to_pay: false,
    }),
  ];

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

function createProfile(overrides: Partial<Tables<"profiles">>): Tables<"profiles"> {
  return {
    created_at: "2026-03-01T00:00:00Z",
    default_project_id: null,
    email: null,
    full_name: "مستخدم",
    id: "profile-id",
    is_active: true,
    updated_at: "2026-03-01T00:00:00Z",
    ...overrides,
  };
}

function createProject(overrides: Partial<Tables<"projects">>): Tables<"projects"> {
  return {
    created_at: "2026-03-01T00:00:00Z",
    id: "project-default",
    name_ar: "مشروع",
    name_en: "Project",
    project_code: "parco",
    updated_at: "2026-03-01T00:00:00Z",
    ...overrides,
  };
}

function createCustomer(overrides: Partial<Tables<"customers">>): Tables<"customers"> {
  return {
    created_at: "2026-03-01T00:00:00Z",
    customer_key: "customer-key",
    customer_name: "عميل",
    customer_name_raw: "عميل",
    email: null,
    id: "customer-id",
    mobile: null,
    national_id: null,
    normalized_name: "عميل",
    notes: null,
    updated_at: "2026-03-01T00:00:00Z",
    ...overrides,
  };
}

function createContract(overrides: Partial<Tables<"contracts">>): Tables<"contracts"> {
  return {
    actual_delivery_date: null,
    collector_user_id: "collector-1",
    contract_code: null,
    contract_key: "contract-key",
    contract_notes: null,
    contract_status: "active",
    created_at: "2026-03-01T00:00:00Z",
    customer_id: "customer-id",
    delivery_date: null,
    id: "contract-id",
    project_id: "project-default",
    source_batch_id: null,
    updated_at: "2026-03-01T00:00:00Z",
    ...overrides,
  };
}

function createUnit(overrides: Partial<Tables<"units">>): Tables<"units"> {
  return {
    built_up_area: 100,
    contract_price: 1000000,
    created_at: "2026-03-01T00:00:00Z",
    floor_name: "Ground",
    garden_area: 0,
    id: "unit-id",
    list_price: 1000000,
    other_area: null,
    project_id: "project-default",
    source_available: false,
    source_batch_id: null,
    source_sold: true,
    status_conflict: false,
    unit_code: "B1",
    unit_key: "parco::B1",
    unit_status: "sold",
    updated_at: "2026-03-01T00:00:00Z",
    ...overrides,
  };
}

function createContractUnit(overrides: Partial<Tables<"contract_units">>): Tables<"contract_units"> {
  return {
    contract_id: "contract-id",
    created_at: "2026-03-01T00:00:00Z",
    id: "contract-unit-id",
    unit_id: "unit-id",
    unit_order: 1,
    ...overrides,
  };
}

function createInstallment(overrides: Partial<Tables<"installments">>): Tables<"installments"> {
  return {
    amount_collected: 0,
    amount_due: 0,
    amount_outstanding: 0,
    commercial_paper: null,
    contract_id: "contract-id",
    created_at: "2026-03-01T00:00:00Z",
    delay_bucket: "not_due",
    delay_days: 0,
    due_date: "2026-03-01",
    id: "installment-id",
    installment_code: null,
    installment_key: "installment-key",
    installment_type: "قسط",
    net_amount: null,
    payment_date: null,
    payment_status: "unpaid",
    penalty_amount: 0,
    receipt_reference: null,
    source_batch_id: null,
    updated_at: "2026-03-01T00:00:00Z",
    ...overrides,
  };
}

function createFollowUp(overrides: Partial<Tables<"follow_ups">>): Tables<"follow_ups"> {
  return {
    collector_user_id: "collector-1",
    contact_type: "call",
    contract_id: null,
    created_at: "2026-03-01T00:00:00Z",
    created_by: "manager-1",
    customer_id: "customer-id",
    customer_response: null,
    follow_up_date: "2026-03-01T10:00:00Z",
    follow_up_status: "open",
    id: "follow-up-id",
    next_action_date: null,
    note: "متابعة",
    promise_date: null,
    promised_to_pay: false,
    updated_at: "2026-03-01T00:00:00Z",
    ...overrides,
  };
}
