import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { DateRangeInputs } from "@/components/ui/date-range-inputs";
import { ExportButton } from "@/components/ui/export-button";
import { FilterBar } from "@/components/ui/filter-bar";
import { PrintButton } from "@/components/ui/print-button";
import { QueryPagination } from "@/components/ui/query-pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { getFollowUpStatusLabel, getFollowUpStatusVariant } from "@/features/customers/presentation";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { requirePermission } from "@/lib/auth/permissions";
import {
  getPromisesReport,
  type PromisesReportItem,
} from "@/server/queries/reports/get-promises-report";

export const dynamic = "force-dynamic";

type PromisesReportPageProps = {
  searchParams?: Promise<{ endDate?: string; page?: string; pageSize?: string; projectId?: string; startDate?: string }>;
};

const columns: DataTableColumn<PromisesReportItem>[] = [
  { cell: (row) => row.customerName, header: "العميل" },
  { cell: (row) => row.projectName, header: "المشروع" },
  { cell: (row) => row.promiseDate ?? "—", header: "تاريخ الوعد" },
  { cell: (row) => <div className="max-w-xl leading-7">{row.note}</div>, header: "الملاحظة" },
  { cell: (row) => row.collectorName, header: "المحصل" },
  {
    cell: (row) => <StatusBadge variant={getFollowUpStatusVariant(row.followUpStatus)}>{getFollowUpStatusLabel(row.followUpStatus)}</StatusBadge>,
    header: "حالة المتابعة",
  },
];

export default async function PromisesReportPage({ searchParams }: PromisesReportPageProps) {
  const sessionUser = await getRequiredSessionUser();
  requirePermission(sessionUser, "reports.read");
  const filters = (await searchParams) ?? {};
  const result = await getPromisesReport({
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
            <StatusBadge variant="warning">{result.totalCount} وعد</StatusBadge>
            <ExportButton exportType="promises" filters={filters} />
            <PrintButton exportType="promises" filters={filters} />
          </>
        }
        description="سجل العملاء الذين لديهم وعد سداد مفتوح أو لم يتم إغلاق متابعتهم بعد."
        title="وعود السداد"
      >
        <form action="/reports/promises" className="flex w-full flex-wrap gap-3">
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

      <DataTable caption="تقرير وعود السداد" columns={columns} data={result.items} getRowId={(row, index) => `${row.customerName}-${index}`} />

      <QueryPagination
        currentPage={result.page}
        pageSize={result.pageSize}
        pathname="/reports/promises"
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
