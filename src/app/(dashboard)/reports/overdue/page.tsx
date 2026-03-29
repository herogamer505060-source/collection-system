import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { DateRangeInputs } from "@/components/ui/date-range-inputs";
import { ExportButton } from "@/components/ui/export-button";
import { FilterBar } from "@/components/ui/filter-bar";
import { PrintButton } from "@/components/ui/print-button";
import { QueryPagination } from "@/components/ui/query-pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { requirePermission } from "@/lib/auth/permissions";
import { formatEgyptDateTime, toEgyptDateString } from "@/lib/dates/egypt";
import { formatCurrency } from "@/lib/formatting/currency";
import { getOverdueReport, type OverdueReportItem } from "@/server/queries/reports/get-overdue-report";

export const dynamic = "force-dynamic";

type OverdueReportPageProps = {
  searchParams?: Promise<{
    endDate?: string;
    page?: string;
    pageSize?: string;
    projectId?: string;
    startDate?: string;
  }>;
};

const columns: DataTableColumn<OverdueReportItem>[] = [
  { cell: (row) => row.customerName, header: "العميل" },
  { cell: (row) => row.contractCode ?? "—", header: "العقد" },
  { cell: (row) => row.projectName, header: "المشروع" },
  { cell: (row) => row.installmentType, header: "نوع القسط" },
  { cell: (row) => formatCurrency(row.amountDue), header: "المستحق" },
  { cell: (row) => formatCurrency(row.amountCollected), header: "المحصل" },
  { cell: (row) => formatCurrency(row.amountOutstanding), header: "المتبقي" },
  { cell: (row) => `${row.delayDays} يوم`, header: "أيام التأخير" },
  { cell: (row) => formatDate(row.dueDate), header: "تاريخ الاستحقاق" },
  {
    cell: (row) => (row.lastFollowUpDate ? formatEgyptDateTime(row.lastFollowUpDate) : "—"),
    header: "آخر متابعة",
  },
  {
    cell: (row) => (
      <div className="max-w-xs whitespace-pre-wrap text-body-md leading-6 text-on-surface line-clamp-2">
        {row.lastFollowUpNote ?? "—"}
      </div>
    ),
    header: "ملاحظة المتابعة",
  },
  { cell: (row) => row.lastCustomerResponse ?? "—", header: "رد العميل" },
  { cell: (row) => formatDate(row.promiseDate), header: "تاريخ الوعد" },
  { cell: (row) => formatDate(row.nextActionDate), header: "الإجراء القادم" },
];

export default async function OverdueReportPage({ searchParams }: OverdueReportPageProps) {
  const sessionUser = await getRequiredSessionUser();
  requirePermission(sessionUser, "reports.read");
  const filters = (await searchParams) ?? {};
  const result = await getOverdueReport({
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
            <StatusBadge variant="danger">{result.totalCount} قسط متأخر</StatusBadge>
            <ExportButton exportType="overdue" filters={filters} />
            <PrintButton exportType="overdue" filters={filters} />
          </>
        }
        description="قائمة تفصيلية بالأقساط التي تجاوزت تاريخ الاستحقاق وما زال عليها رصيد قائم."
        title="العملاء المتأخرون"
      >
        <form action="/reports/overdue" className="flex w-full flex-wrap gap-3">
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

      <DataTable
        caption="تقرير العملاء المتأخرين"
        columns={columns}
        data={result.items}
        getRowId={(row, index) => `${row.customerName}-${index}`}
      />

      <QueryPagination
        currentPage={result.page}
        pageSize={result.pageSize}
        pathname="/reports/overdue"
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

function formatDate(value: string | null): string {
  return value ? toEgyptDateString(value) : "—";
}
