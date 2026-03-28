import {
  EXPORT_COLUMNS,
  EXPORT_SHEET_NAMES,
  type ExportColumn,
  type ExportType,
} from "@/features/exports/column-definitions";
import {
  getContactTypeLabel,
  getContractDerivedStatusLabel,
  getCustomerStatusLabel,
  getFollowUpStatusLabel,
  getInstallmentPaymentStatusLabel,
  getUnitStatusLabel,
} from "@/features/customers/presentation";
import type { SessionUser } from "@/lib/auth/get-session-user";
import { formatEgyptDateTime, toEgyptDateString } from "@/lib/dates/egypt";
import { getContractsList } from "@/server/queries/contracts/get-contracts-list";
import { getCustomersList } from "@/server/queries/customers/get-customers-list";
import { getFollowUpsList } from "@/server/queries/follow-ups/get-follow-ups-list";
import { getInstallmentsList } from "@/server/queries/installments/get-installments-list";
import { getAgingReport } from "@/server/queries/reports/get-aging-report";
import { getCollectionNotesReport } from "@/server/queries/reports/get-collection-notes-report";
import { getNoFollowUpReport } from "@/server/queries/reports/get-no-follow-up-report";
import { getOverdueReport } from "@/server/queries/reports/get-overdue-report";
import { getPenaltiesReport } from "@/server/queries/reports/get-penalties-report";
import { getProjectStatusReport } from "@/server/queries/reports/get-project-status-report";
import { getPromisesReport } from "@/server/queries/reports/get-promises-report";
import { getWhoPaidReport } from "@/server/queries/reports/get-who-paid-report";
import { getUnitsList } from "@/server/queries/units/get-units-list";

export const EXPORT_PAGE_SIZE = 10_000;

export type ExportDataset = {
  columns: ExportColumn[];
  fileNameBase: string;
  filterSummary: Array<{ label: string; value: string }>;
  generatedAt: string;
  rows: Record<string, unknown>[];
  title: string;
  type: ExportType;
};

export async function getExportDataset(input: {
  filters: Record<string, string>;
  sessionUser: SessionUser;
  type: ExportType;
}): Promise<ExportDataset> {
  const rows = await loadExportRows(input.type, input.filters, input.sessionUser);

  return {
    columns: EXPORT_COLUMNS[input.type],
    fileNameBase: `${input.type}-${new Date().toISOString().slice(0, 10)}`,
    filterSummary: buildFilterSummary(input.filters, rows),
    generatedAt: formatEgyptDateTime(new Date().toISOString()),
    rows,
    title: EXPORT_SHEET_NAMES[input.type],
    type: input.type,
  };
}

export async function loadExportRows(
  type: ExportType,
  filters: Record<string, string>,
  sessionUser: SessionUser,
): Promise<Record<string, unknown>[]> {
  switch (type) {
    case "customers": {
      const result = await getCustomersList({
        endDate: filters.endDate,
        page: 1,
        pageSize: EXPORT_PAGE_SIZE,
        paymentStatus: coerceCustomerStatus(filters.paymentStatus),
        projectId: filters.projectId,
        search: filters.search,
        sessionUser,
        startDate: filters.startDate,
      });

      return result.items.map((row) => ({
        customerName: row.customerName,
        email: row.email ?? "",
        mobile: row.mobile ?? "",
        outstanding: row.totals.amountOutstanding,
        status: getCustomerStatusLabel(row.paymentStatus),
      }));
    }
    case "contracts": {
      const result = await getContractsList({
        page: 1,
        pageSize: EXPORT_PAGE_SIZE,
        projectId: filters.projectId,
        search: filters.search,
        sessionUser,
      });

      return result.items.map((row) => ({
        amountCollected: row.totals.amountCollected,
        amountDue: row.totals.amountDue,
        amountOutstanding: row.totals.amountOutstanding,
        collectorName: row.collectorName ?? "",
        contractCode: row.contractCode ?? "",
        customerName: row.customerName,
        projectName: row.projectName,
        status: getContractDerivedStatusLabel(row.contractStatus),
      }));
    }
    case "installments": {
      const result = await getInstallmentsList({
        endDate: filters.endDate,
        page: 1,
        pageSize: EXPORT_PAGE_SIZE,
        paymentStatus: filters.paymentStatus,
        projectId: filters.projectId,
        search: filters.search,
        sessionUser,
        startDate: filters.startDate,
      });

      return result.items.map((row) => ({
        amountCollected: row.amountCollected,
        amountDue: row.amountDue,
        amountOutstanding: row.amountOutstanding,
        contractCode: row.contractCode ?? "",
        customerName: row.customerName,
        dueDate: formatDate(row.dueDate),
        installmentType: row.installmentType,
        paymentStatus: getInstallmentPaymentStatusLabel(
          row.paymentStatus as "overdue" | "paid" | "partial" | "unpaid",
        ),
        penaltyAmount: row.penaltyAmount,
        projectName: row.projectName,
      }));
    }
    case "follow-ups": {
      const result = await getFollowUpsList({
        collectorUserId: filters.collectorUserId,
        endDate: filters.endDate,
        overdueOnly: coerceBoolean(filters.overdueOnly),
        page: 1,
        pageSize: EXPORT_PAGE_SIZE,
        projectId: filters.projectId,
        promisedToPayOnly: coerceBoolean(filters.promisedToPayOnly),
        search: filters.search,
        sessionUser,
        startDate: filters.startDate,
        status: filters.status,
      });

      return result.items.map((row) => ({
        collectorName: row.collectorName ?? "",
        contactType: getContactTypeLabel(row.contactType),
        customerName: row.customerName,
        followUpDate: formatDateTime(row.followUpDate),
        followUpStatus: getFollowUpStatusLabel(row.followUpStatus),
        note: row.note,
      }));
    }
    case "units": {
      const result = await getUnitsList({
        page: 1,
        pageSize: EXPORT_PAGE_SIZE,
        projectId: filters.projectId,
        search: filters.search,
        sessionUser,
        status: coerceUnitStatus(filters.status),
      });

      return result.items.map((row) => ({
        builtUpArea: row.builtUpArea ?? "",
        listPrice: row.listPrice ?? "",
        projectName: row.projectName,
        unitCode: row.unitCode,
        unitStatus: getUnitStatusLabel(row.unitStatus),
      }));
    }
    case "aging": {
      const result = await getAgingReport({
        endDate: filters.endDate,
        page: 1,
        pageSize: EXPORT_PAGE_SIZE,
        projectId: filters.projectId,
        sessionUser,
        startDate: filters.startDate,
      });
      return result.items.map((row) => ({
        ...row,
        dueDate: formatDate(row.dueDate),
        lastCustomerResponse: row.lastCustomerResponse ?? "",
        lastFollowUpDate: formatDateTime(row.lastFollowUpDate),
        lastFollowUpNote: row.lastFollowUpNote ?? "",
      }));
    }
    case "who-paid": {
      const result = await getWhoPaidReport({
        endDate: filters.endDate,
        page: 1,
        pageSize: EXPORT_PAGE_SIZE,
        projectId: filters.projectId,
        sessionUser,
        startDate: filters.startDate,
      });
      return result.items;
    }
    case "overdue": {
      const result = await getOverdueReport({
        endDate: filters.endDate,
        page: 1,
        pageSize: EXPORT_PAGE_SIZE,
        projectId: filters.projectId,
        sessionUser,
        startDate: filters.startDate,
      });
      return result.items.map((row) => ({
        ...row,
        dueDate: formatDate(row.dueDate),
        lastCustomerResponse: row.lastCustomerResponse ?? "",
        lastFollowUpDate: formatDateTime(row.lastFollowUpDate),
        lastFollowUpNote: row.lastFollowUpNote ?? "",
        nextActionDate: formatDate(row.nextActionDate),
        promiseDate: formatDate(row.promiseDate),
      }));
    }
    case "penalties": {
      const result = await getPenaltiesReport({
        endDate: filters.endDate,
        page: 1,
        pageSize: EXPORT_PAGE_SIZE,
        projectId: filters.projectId,
        sessionUser,
        startDate: filters.startDate,
      });
      return result.items;
   
    }
    case "project-status": {
      const result = await getProjectStatusReport({
        endDate: filters.endDate,
        page: 1,
        pageSize: EXPORT_PAGE_SIZE,
        sessionUser,
        startDate: filters.startDate,
      });
      return result.items.map((row) => ({
        ...row,
        collectionPercentage: `${row.collectionPercentage.toFixed(2)}%`,
      }));
    }
    case "collection-notes": {
      const result = await getCollectionNotesReport({
        endDate: filters.endDate,
        page: 1,
        pageSize: EXPORT_PAGE_SIZE,
        projectId: filters.projectId,
        sessionUser,
        startDate: filters.startDate,
      });
      return result.items.map((row) => ({
        ...row,
        customerResponse: row.customerResponse ?? "",
        followUpDate: formatDateTime(row.followUpDate),
      }));
    }
    case "promises": {
      const result = await getPromisesReport({
        endDate: filters.endDate,
        page: 1,
        pageSize: EXPORT_PAGE_SIZE,
        projectId: filters.projectId,
        sessionUser,
        startDate: filters.startDate,
      });
      return result.items.map((row) => ({
        ...row,
        followUpStatus: getFollowUpStatusLabel(row.followUpStatus),
        promiseDate: formatDate(row.promiseDate),
      }));
    }
    case "no-follow-up": {
      const result = await getNoFollowUpReport({
        days: coercePositiveNumber(filters.days, 30),
        page: 1,
        pageSize: EXPORT_PAGE_SIZE,
        projectId: filters.projectId,
        sessionUser,
      });
      return result.items.map((row) => ({
        ...row,
        lastFollowUpDate: row.lastFollowUpDate ? formatDateTime(row.lastFollowUpDate) : "لا توجد متابعة",
      }));
    }
  }
}

function buildFilterSummary(
  filters: Record<string, string>,
  rows: Record<string, unknown>[],
): Array<{ label: string; value: string }> {
  const entries: Array<{ label: string; value: string }> = [];

  if (filters.startDate) {
    entries.push({ label: "من تاريخ", value: formatDate(filters.startDate) });
  }

  if (filters.endDate) {
    entries.push({ label: "إلى تاريخ", value: formatDate(filters.endDate) });
  }

  if (filters.search) {
    entries.push({ label: "بحث", value: filters.search });
  }

  if (filters.days) {
    entries.push({ label: "عدد الأيام", value: filters.days });
  }

  const projectNames = Array.from(
    new Set(
      rows
        .map((row) => row.projectName)
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0),
    ),
  );

  if (filters.projectId && projectNames.length === 1) {
    entries.push({ label: "المشروع", value: projectNames[0] });
  }

  return entries;
}

function coerceBoolean(value: string | undefined): boolean {
  return value === "true" || value === "on";
}

function coerceCustomerStatus(
  value: string | undefined,
): "all" | "all_paid" | "has_outstanding" | "has_overdue" | undefined {
  if (value === "all" || value === "all_paid" || value === "has_outstanding" || value === "has_overdue") {
    return value;
  }

  return undefined;
}

function coercePositiveNumber(value: string | undefined, fallback: number): number {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? Math.floor(numericValue) : fallback;
}

function coerceUnitStatus(value: string | undefined): "available" | "sold" | undefined {
  if (value === "available" || value === "sold") {
    return value;
  }

  return undefined;
}

function formatDate(value: string | null | undefined): string {
  return value ? toEgyptDateString(value) : "";
}

function formatDateTime(value: string | null | undefined): string {
  return value ? formatEgyptDateTime(value) : "";
}
