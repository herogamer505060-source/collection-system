import { InstallmentsTable } from "@/components/installments/installments-table";
import { DateRangeInputs } from "@/components/ui/date-range-inputs";
import { ExportButton } from "@/components/ui/export-button";
import { QueryPagination } from "@/components/ui/query-pagination";
import { FilterBar } from "@/components/ui/filter-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { formatCurrency } from "@/lib/formatting/currency";
import { getInstallmentsList } from "@/server/queries/installments/get-installments-list";

export const dynamic = "force-dynamic";

type InstallmentsPageProps = {
  searchParams?: Promise<{
    endDate?: string;
    page?: string;
    pageSize?: string;
    paymentStatus?: string;
    projectId?: string;
    search?: string;
    startDate?: string;
  }>;
};

export default async function InstallmentsPage({ searchParams }: InstallmentsPageProps) {
  const sessionUser = await getRequiredSessionUser();
  const filters = (await searchParams) ?? {};
  const canEdit = sessionUser.roles.some(
    (assignment) => assignment.role === "admin" || assignment.role === "manager",
  );
  const result = await getInstallmentsList({
    endDate: filters.endDate,
    page: coercePositiveNumber(filters.page, 1),
    pageSize: coercePositiveNumber(filters.pageSize, 50),
    paymentStatus: filters.paymentStatus,
    projectId: filters.projectId,
    search: filters.search,
    sessionUser,
    startDate: filters.startDate,
  });

  return (
    <section className="space-y-6">
      <FilterBar
        actions={
          <>
            <StatusBadge variant="info">{result.totalCount} قسط</StatusBadge>
            <ExportButton exportType="installments" filters={filters} />
          </>
        }
        description="فلترة الأقساط حسب المشروع أو حالة السداد، مع بحث مباشر بالعميل أو رقم العقد أو كود الوحدة."
        title="جدول الأقساط"
      >
        <form action="/installments" className="flex w-full flex-wrap gap-3">
          <input
            className="min-w-[260px] rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30"
            defaultValue={result.filters.search ?? ""}
            name="search"
            placeholder="ابحث بالعميل أو العقد أو الوحدة"
            type="search"
          />
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
          <select
            className="min-w-[220px] rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30"
            defaultValue={result.filters.paymentStatus ?? ""}
            name="paymentStatus"
          >
            <option value="">كل الحالات</option>
            <option value="overdue">متأخر</option>
            <option value="unpaid">غير مدفوع</option>
            <option value="partial">جزئي</option>
            <option value="paid">مدفوع</option>
          </select>
          <DateRangeInputs endDateValue={filters.endDate ?? null} startDateValue={filters.startDate ?? null} />
          <button className="gradient-primary rounded-xl px-4 py-3 text-body-md font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90" type="submit">
            تطبيق
          </button>
        </form>
      </FilterBar>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="إجمالي المستحق" value={formatCurrency(result.summary.amountDue)} />
        <MetricCard label="إجمالي المحصل" value={formatCurrency(result.summary.amountCollected)} />
        <MetricCard label="إجمالي المتبقي" value={formatCurrency(result.summary.amountOutstanding)} />
        <MetricCard label="إجمالي الغرامات" value={formatCurrency(result.summary.penaltyAmount)} />
      </section>

      <InstallmentsTable canEdit={canEdit} rows={result.items} />

      <QueryPagination
        currentPage={result.page}
        pageSize={result.pageSize}
        pathname="/installments"
        searchParams={filters}
        totalCount={result.totalCount}
      />
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-container-low p-4">
      <div className="text-label-lg text-on-surface-variant">{label}</div>
      <div className="mt-2 font-display text-headline-sm text-on-surface">{value}</div>
    </div>
  );
}

function coercePositiveNumber(value: string | undefined, fallback: number): number {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) && numericValue > 0 ? Math.floor(numericValue) : fallback;
}
