import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ExportButton } from "@/components/ui/export-button";
import { FilterBar } from "@/components/ui/filter-bar";
import { PrintButton } from "@/components/ui/print-button";
import { QueryPagination } from "@/components/ui/query-pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { requirePermission } from "@/lib/auth/permissions";
import { formatEgyptDateTime } from "@/lib/dates/egypt";
import {
  getCollectionNotesReport,
  type CollectionNotesReportItem,
} from "@/server/queries/reports/get-collection-notes-report";

export const dynamic = "force-dynamic";

type CollectionNotesReportPageProps = {
  searchParams?: Promise<{ page?: string; pageSize?: string; projectId?: string }>;
};

const columns: DataTableColumn<CollectionNotesReportItem>[] = [
  { cell: (row) => row.customerName, header: "العميل" },
  { cell: (row) => row.projectName, header: "المشروع" },
  { cell: (row) => formatEgyptDateTime(row.followUpDate), header: "تاريخ المتابعة" },
  { cell: (row) => <div className="max-w-xl leading-7">{row.note}</div>, header: "الملاحظة" },
  { cell: (row) => row.customerResponse ?? "—", header: "رد العميل" },
  { cell: (row) => row.collectorName, header: "المحصل" },
];

export default async function CollectionNotesReportPage({ searchParams }: CollectionNotesReportPageProps) {
  const sessionUser = await getRequiredSessionUser();
  requirePermission(sessionUser, "reports.read");
  const filters = (await searchParams) ?? {};
  const result = await getCollectionNotesReport({
    page: coercePositiveNumber(filters.page, 1),
    pageSize: coercePositiveNumber(filters.pageSize, 50),
    projectId: filters.projectId,
    sessionUser,
  });

  return (
    <section className="space-y-6">
      <FilterBar
        actions={
          <>
            <StatusBadge variant="info">{result.totalCount} سجل</StatusBadge>
            <ExportButton exportType="collection-notes" filters={filters} />
            <PrintButton />
          </>
        }
        description="آخر ملاحظة متابعة متاحة لكل عميل ضمن النطاق الحالي مع اسم المحصل ورد العميل إن وجد."
        title="ملاحظات التحصيل"
      >
        <form action="/reports/collection-notes" className="flex w-full flex-wrap gap-3">
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
          <button className="gradient-primary rounded-xl px-4 py-3 text-body-md font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90" type="submit">
            تطبيق
          </button>
        </form>
      </FilterBar>

      <DataTable caption="تقرير ملاحظات التحصيل" columns={columns} data={result.items} getRowId={(row, index) => `${row.customerName}-${index}`} />

      <QueryPagination
        currentPage={result.page}
        pageSize={result.pageSize}
        pathname="/reports/collection-notes"
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
