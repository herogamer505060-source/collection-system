import { z } from "zod";

import {
  EXPORT_COLUMNS,
  EXPORT_SHEET_NAMES,
  EXPORT_TYPES,
  type ExportType,
} from "@/features/exports/column-definitions";
import { generateCsv } from "@/features/exports/csv-exporter";
import { generateExcel } from "@/features/exports/excel-exporter";
import {
  getContactTypeLabel,
  getContractDerivedStatusLabel,
  getCustomerStatusLabel,
  getFollowUpStatusLabel,
  getInstallmentPaymentStatusLabel,
  getUnitStatusLabel,
} from "@/features/customers/presentation";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { requirePermission } from "@/lib/auth/permissions";
import { apiErrorResponse, invalidRequest, toApiError } from "@/lib/errors/api-error";
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

const exportRequestSchema = z.object({
  filters: z.record(z.string(), z.string()).optional(),
  format: z.enum(["xlsx", "csv"]),
  type: z.enum(EXPORT_TYPES),
});

const EXPORT_PAGE_SIZE = 10_000;

export async function POST(request: Request) {
  try {
    const sessionUser = await getRequiredSessionUser();
    requirePermission(sessionUser, "reports.read");
    const payload = exportRequestSchema.parse(await request.json());
    const rows = await loadExportRows(payload.type, payload.filters ?? {}, sessionUser);
    const columns = EXPORT_COLUMNS[payload.type];
    const fileName = `${payload.type}-${new Date().toISOString().slice(0, 10)}.${payload.format}`;

    if (payload.format === "xlsx") {
      const buffer = await generateExcel(columns, rows, EXPORT_SHEET_NAMES[payload.type]);

      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    }

    const csv = generateCsv(columns, rows);

    return new Response(csv, {
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiErrorResponse(invalidRequest(error.issues[0]?.message ?? "بيانات التصدير غير صحيحة", error.flatten()));
    }

    return apiErrorResponse(toApiError(error));
  }
}

async function loadExportRows(
  type: ExportType,
  filters: Record<string, string>,
  sessionUser: Awaited<ReturnType<typeof getRequiredSessionUser>>,
): Promise<Record<string, unknown>[]> {
  switch (type) {
    case "customers": {
      const result = await getCustomersList({
        page: 1,
        pageSize: EXPORT_PAGE_SIZE,
        endDate: filters.endDate,
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
        page: 1,
        pageSize: EXPORT_PAGE_SIZE,
        endDate: filters.endDate,
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
        paymentStatus: getInstallmentPaymentStatusLabel(row.paymentStatus as "overdue" | "paid" | "partial" | "unpaid"),
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
      return result.items;
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
      return result.items.map((row) => ({ ...row, followUpDate: formatDateTime(row.followUpDate), customerResponse: row.customerResponse ?? "" }));
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
      return result.items.map((row) => ({ ...row, lastFollowUpDate: row.lastFollowUpDate ? formatDateTime(row.lastFollowUpDate) : "لا توجد متابعة" }));
    }
  }
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
