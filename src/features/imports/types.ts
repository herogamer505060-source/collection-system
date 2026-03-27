import type { CustomerIdentityMatch } from "@/features/imports/matching/match-customer";
import type { Json, Tables } from "@/types/database";

export type KnownProjectCode = "parco" | "centro" | "caza";

export type ImportBatchType = "installments" | "sold_units" | "available_units";

export type ImportSourceType =
  | "installments_report"
  | "sold_units_report"
  | "available_units_report";

export type ImportCellValue = string | number | Date | null;

export type ParsedWorksheet<Row> = {
  detectedColumns: string[];
  headerRowNumber: number;
  rawRowCount: number;
  rows: Row[];
  sheetName: string;
  skippedRowCount: number;
};

export type ParsedInstallmentRow = {
  sourceRowNumber: number;
  sourceType: "installments_report";
  commercialPaper: ImportCellValue;
  amountOutstanding: ImportCellValue;
  amountCollected: ImportCellValue;
  netAmount: ImportCellValue;
  amountDue: ImportCellValue;
  dueDate: ImportCellValue;
  installmentCode: ImportCellValue;
  installmentType: ImportCellValue;
  unitCode: ImportCellValue;
  projectName: ImportCellValue;
  customerName: ImportCellValue;
};

export type ParsedUnitStatus = "sold" | "available";

export type ParsedUnitRow = {
  sourceRowNumber: number;
  sourceType: "sold_units_report" | "available_units_report";
  unitStatus: ParsedUnitStatus;
  projectName: ImportCellValue;
  unitCode: ImportCellValue;
  floorName: ImportCellValue;
  builtUpArea: ImportCellValue;
  gardenArea: ImportCellValue;
  listPrice: ImportCellValue;
  contractPrice: ImportCellValue;
};

export type ImportIssueSeverity = "high" | "medium" | "low";

export type ImportIssueType =
  | "unknown_project"
  | "invalid_customer_name"
  | "invalid_date"
  | "invalid_installment_code"
  | "invalid_money"
  | "invalid_number"
  | "invalid_unit_code"
  | "missing_required_field"
  | "duplicate_business_key"
  | "duplicate_unit_status"
  | "unmatched_unit";

export type MapImportIssueInput = {
  fieldLabel?: string;
  issueType: ImportIssueType;
  rawValue?: unknown;
  severity?: ImportIssueSeverity;
  sourceRowNumber?: number | null;
};

export type MappedImportIssue = {
  fieldLabel?: string;
  issueType: ImportIssueType;
  messageAr: string;
  payload?: Json | null;
  rawValue?: string | null;
  severity: ImportIssueSeverity;
  sourceRowNumber?: number | null;
};

export type NormalizeImportRowInput = {
  sourceRowNumber: number;
  [key: string]: unknown;
};

export type NormalizedImportRow = NormalizeImportRowInput & {
  actualDeliveryDate?: string;
  actualDeliveryDateRaw?: unknown;
  amountCollected?: number;
  amountCollectedRaw?: unknown;
  amountDue?: number;
  amountDueRaw?: unknown;
  amountOutstanding?: number;
  amountOutstandingRaw?: unknown;
  builtUpArea?: number;
  builtUpAreaRaw?: unknown;
  contractPrice?: number;
  contractPriceRaw?: unknown;
  customerName?: string;
  customerNameRaw?: unknown;
  deliveryDate?: string;
  deliveryDateRaw?: unknown;
  dueDate?: string;
  dueDateRaw?: unknown;
  gardenArea?: number;
  gardenAreaRaw?: unknown;
  listPrice?: number;
  listPriceRaw?: unknown;
  netAmount?: number;
  netAmountRaw?: unknown;
  normalizedCustomerName?: string;
  otherArea?: number;
  otherAreaRaw?: unknown;
  paymentDate?: string;
  paymentDateRaw?: unknown;
  penaltyAmount?: number;
  penaltyAmountRaw?: unknown;
  projectCode?: KnownProjectCode;
  projectName?: string;
  projectNameRaw?: unknown;
  unitCodeRaw?: unknown;
  unitCodes?: string[];
};

export type ProjectMatch = Pick<Tables<"projects">, "id" | "name_ar" | "name_en" | "project_code">;

export type ContractMatch = Pick<
  Tables<"contracts">,
  "collector_user_id" | "contract_code" | "contract_key" | "customer_id" | "id" | "project_id"
>;

export type InstallmentMatch = Pick<Tables<"installments">, "contract_id" | "id" | "installment_key">;

export type UnitMatch = Pick<
  Tables<"units">,
  | "contract_price"
  | "floor_name"
  | "garden_area"
  | "id"
  | "list_price"
  | "project_id"
  | "source_available"
  | "source_sold"
  | "status_conflict"
  | "unit_code"
  | "unit_key"
  | "unit_status"
>;

export type ContractUnitMatch = Pick<Tables<"contract_units">, "contract_id" | "unit_id">;

export type ImportMatchingContext = {
  contractUnits: ContractUnitMatch[];
  contracts: ContractMatch[];
  customerIdentities: CustomerIdentityMatch[];
  installments: InstallmentMatch[];
  projects: ProjectMatch[];
  units: UnitMatch[];
};

export type ChangeSummary = {
  contractsToCreate: number;
  contractsToUpdate: number;
  customersToCreate: number;
  customersToMatch: number;
  installmentsToCreate: number;
  installmentsToUpdate: number;
  linksToCreate: number;
  unitsToCreate?: number;
  unitsToUpdate?: number;
};

export type PreviewCounts = {
  blockedRows: number;
  issueRows: number;
  skippedRows: number;
  totalRows: number;
  validRows: number;
};

export type PreviewSampleRow = {
  amountDue?: number;
  customerName?: string;
  project?: string;
  sourceRowNumber: number;
  unitCode?: string;
};

export type StagedUnitReference = {
  existingUnitId?: string;
  statusConflict: boolean;
  unitCode: string;
  unitKey: string;
};

export type StagedCustomerReference = {
  customerId?: string;
  customerImportKey: string;
  customerName: string;
  normalizedName: string;
};

export type StagedContractReference = {
  contractId?: string;
  contractKey: string;
};

export type StagedInstallmentReference = {
  installmentId?: string;
  installmentKey: string;
  keySource: "fallback" | "source";
};

export type StagedInstallmentRow = {
  amountCollected: number;
  amountDue: number;
  amountOutstanding: number;
  canApply: boolean;
  commercialPaper?: string;
  contract: StagedContractReference;
  customer: StagedCustomerReference;
  dueDate: string;
  hasBlockingIssues: boolean;
  installment: StagedInstallmentReference;
  installmentCode?: string;
  installmentType: string;
  issues: MappedImportIssue[];
  kind: "installment";
  matchedUnitIds: string[];
  missingUnitCodes: string[];
  netAmount?: number;
  paymentDate?: string;
  penaltyAmount: number;
  projectCode: KnownProjectCode;
  projectId: string;
  projectName: string;
  sourceRowNumber: number;
  sourceType: "installments_report";
  unitCodes: string[];
};

export type StagedUnitRow = {
  builtUpArea?: number;
  canApply: boolean;
  contractPrice?: number;
  floorName?: string;
  gardenArea?: number;
  hasBlockingIssues: boolean;
  issues: MappedImportIssue[];
  kind: "unit";
  listPrice?: number;
  projectCode: KnownProjectCode;
  projectId: string;
  projectName: string;
  sourceRowNumber: number;
  sourceType: "sold_units_report" | "available_units_report";
  unit: StagedUnitReference;
  unitStatus: ParsedUnitStatus;
};

export type StagedImportRow = StagedInstallmentRow | StagedUnitRow;

export type ImportPreviewPayload = {
  batchId: string;
  changeSummary: ChangeSummary;
  counts: Omit<PreviewCounts, "blockedRows">;
  detectedColumns: string[];
  issues: Array<MappedImportIssue & { id: string }>;
  sampleRows: PreviewSampleRow[];
  status: "ready_for_review";
};

export type ImportBatchStagingData = {
  batchType: ImportBatchType;
  changeSummary: ChangeSummary;
  counts: PreviewCounts;
  detectedColumns: string[];
  fileId: string;
  generatedInstallmentKeys: number;
  sampleRows: PreviewSampleRow[];
  sheetName: string;
  stagedAt: string;
  stagedRows: StagedImportRow[];
};
