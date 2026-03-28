import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { DateRangeInputs } from "@/components/ui/date-range-inputs";
import { ExportButton } from "@/components/ui/export-button";
import { FilterBar } from "@/components/ui/filter-bar";
import { PrintButton } from "@/components/ui/print-button";
import { QueryPagination } from "@/components/ui/query-pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { requirePermission } from "@/lib/auth/permissions";
import { formatCurrency } from "@/lib/formatting/currency";
import {
  getProjectStatusReport,
  type ProjectStatusReportItem,
} from "@/server/queries/reports/get-project-status-report";

export const dynamic = "force-dynamic";

type ProjectStatusReportPageProps = {
  searchParams?: Promise<{ endDate?: string; page?: string; pageSize?: string; startDate?: string }>;
};

const columns: DataTableColumn<ProjectStatusReportItem>[] = [
  { cell: (row) => row.projectName, header: "المشروع" },
  { cell: (row) => row.contractCount, header: "عدد العقود" },
  { cell: (row) => formatCurrency(row.amountDue), header: "المستحق" },
  { cell: (row) => formatCurrency(row.amountCollected), header: "المحصل" },
  { cell: (row) => formatCurrency(row.amountOutstanding), header: "المتبقي" },
  { cell: (row) => formatCurrency(row.overdueAmount), header: "المتأخرات" },
  { cell: (row) => `${row.collectionPercentage.toFixed(2)}%`, header: "نسبة التحصيل" },
];

export default async function ProjectStatusReportPage({ searchParams }: ProjectStatusReportPageProps) {
  const sessionUser = await getRequiredSessionUser();
  requirePermission(sessionUser, "reports.read");
  const filters = (await searchParams) ?? {};
  const result = await getProjectStatusReport({
    endDate: filters.endDate,
    page: coercePositiveNumber(filters.page, 1),
    pageSize: coercePositiveNumber(filters.pageSize, 50),
    sessionUser,
    startDate: filters.startDate,
  });

  return (
    <section className="space-y-6">
      <FilterBar
        actions={
          <>
            <StatusBadge variant="info">{result.totalCount} مشروع</StatusBadge>
            <ExportButton exportType="project-status" filters={filters} />
            <PrintButton exportType="project-status" filters={filters} />
          </>
        }
        description="ملخص إجمالي التحصيل والمتأخرات ونسبة الإنجاز على مستوى كل مشروع ظاهر للمستخدم."
        title="موقف كل مشروع"
      >
        <form action="/reports/project-status" className="flex w-full flex-wrap gap-3">
          <DateRangeInputs endDateValue={result.filters.endDate} startDateValue={result.filters.startDate} />
          <button className="gradient-primary rounded-xl px-4 py-3 text-body-md font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90" type="submit">
            تطبيق
          </button>
        </form>
      </FilterBar>

      <DataTable caption="تقرير موقف كل مشروع" columns={columns} data={result.items} getRowId={(row) => row.projectName} />

      <QueryPagination
        currentPage={result.page}
        pageSize={result.pageSize}
        pathname="/reports/project-status"
        searchParams={filters}
        totalCount={result.totalCount}
      />
    </section>
  );
}

function coercePositiveNumber(value: string | undefined, fallback: number): number {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? Math.floor(numericValue) : fallback;
}
