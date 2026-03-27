import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
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
  searchParams?: Promise<{ page?: string; pageSize?: string }>;
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
    page: coercePositiveNumber(filters.page, 1),
    pageSize: coercePositiveNumber(filters.pageSize, 50),
    sessionUser,
  });

  return (
    <section className="space-y-6">
      <FilterBar
        actions={
          <>
            <StatusBadge variant="info">{result.totalCount} مشروع</StatusBadge>
            <ExportButton exportType="project-status" filters={filters} />
            <PrintButton />
          </>
        }
        description="ملخص إجمالي التحصيل والمتأخرات ونسبة الإنجاز على مستوى كل مشروع ظاهر للمستخدم."
        title="موقف كل مشروع"
      />

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
