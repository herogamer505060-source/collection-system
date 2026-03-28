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
import { getPenaltiesReport, type PenaltiesReportItem } from "@/server/queries/reports/get-penalties-report";

export const dynamic = "force-dynamic";

type PenaltiesReportPageProps = {
  searchParams?: Promise<{ endDate?: string; page?: string; pageSize?: string; projectId?: string; startDate?: string }>;
};

const columns: DataTableColumn<PenaltiesReportItem>[] = [
  { cell: (row) => row.customerName, header: "العميل" },
  { cell: (row) => row.contractCode ?? "—", header: "العقد" },
  { cell: (row) => row.projectName, header: "المشروع" },
  { cell: (row) => row.installmentType, header: "نوع القسط" },
  { cell: (row) => formatCurrency(row.penaltyAmount), header: "الغرامة" },
  { cell: (row) => formatCurrency(row.amountDue), header: "المستحق" },
  { cell: (row) => formatCurrency(row.amountOutstanding), header: "المتبقي" },
];

export default async function PenaltiesReportPage({ searchParams }: PenaltiesReportPageProps) {
  const sessionUser = await getRequiredSessionUser();
  requirePermission(sessionUser, "reports.read");
  const filters = (await searchParams) ?? {};
  const result = await getPenaltiesReport({
    endDate: filters.endDate,
    page: coercePositiveNumber(filters.page, 1),
    pageSize: coercePositiveNumber(filters.pageSize, 50),
    projectId: filters.projectId,
    sessionUser,
    startDate: filters.startDate,
  });

  return (
    <section className="space-y-6">
      <FilterBar
        actions={
          <>
            <StatusBadge variant="warning">{result.totalCount} قسط</StatusBadge>
            <ExportButton exportType="penalties" filters={filters} />
            <PrintButton />
          </>
        }
        description="تفاصيل الأقساط التي تحمل غرامات مسجلة مع المبالغ الأصلية والمتبقية لكل عميل."
        title="الغرامات"
      >
        <form action="/reports/penalties" className="flex w-full flex-wrap gap-3">
          <select
            className="min-w-[220px] rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30"
            defaultValue={result.filters.projectId ?? ""}
            name="projectId"
          >
            <option value="">كل المشروعات</option>
            {result.projectOptions.map((project) => (
              <option key={project.id} value={project.id}>
                {project.label}
              </option>
            ))}
          </select>
          <DateRangeInputs endDateValue={result.filters.endDate} startDateValue={result.filters.startDate} />
          <button className="gradient-primary rounded-xl px-4 py-3 text-body-md font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90" type="submit">
            تطبيق
          </button>
        </form>
      </FilterBar>

      <DataTable caption="تقرير الغرامات" columns={columns} data={result.items} getRowId={(row, index) => `${row.customerName}-${index}`} />

      <QueryPagination
        currentPage={result.page}
        pageSize={result.pageSize}
        pathname="/reports/penalties"
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
