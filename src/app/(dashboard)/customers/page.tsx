import { CustomersTable } from "@/components/customers/customers-table";
import { DateRangeInputs } from "@/components/ui/date-range-inputs";
import { ExportButton } from "@/components/ui/export-button";
import { QueryPagination } from "@/components/ui/query-pagination";
import { FilterBar } from "@/components/ui/filter-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import {
  getCustomerStatusLabel,
  type CustomerStatus,
} from "@/features/customers/presentation";
import { getCustomersList } from "@/server/queries/customers/get-customers-list";

export const dynamic = "force-dynamic";

type CustomersPageProps = {
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

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const sessionUser = await getRequiredSessionUser();
  const filters = (await searchParams) ?? {};
  const result = await getCustomersList({
    endDate: filters.endDate,
    page: coercePositiveNumber(filters.page, 1),
    pageSize: coercePositiveNumber(filters.pageSize, 50),
    paymentStatus: coerceCustomerStatus(filters.paymentStatus),
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
            <StatusBadge variant="info">{result.totalCount} عميل</StatusBadge>
            <ExportButton exportType="customers" filters={filters} />
          </>
        }
        description="ابحث بالاسم العربي الجزئي، ثم صف النتائج حسب المشروع أو حالة السداد للوصول السريع إلى ملف العميل."
        title="قائمة العملاء"
      >
        <form action="/customers" className="flex w-full flex-wrap gap-3">
          <input
            className="min-w-[240px] rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30"
            defaultValue={result.filters.search ?? ""}
            name="search"
            placeholder="ابحث باسم العميل"
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
            defaultValue={result.filters.paymentStatus}
            name="paymentStatus"
          >
            <option value="all">كل الحالات</option>
            <option value="has_overdue">{getCustomerStatusLabel("has_overdue")}</option>
            <option value="has_outstanding">{getCustomerStatusLabel("has_outstanding")}</option>
            <option value="all_paid">{getCustomerStatusLabel("all_paid")}</option>
          </select>
          <DateRangeInputs endDateValue={filters.endDate ?? null} startDateValue={filters.startDate ?? null} />
          <button className="gradient-primary rounded-xl px-4 py-3 text-body-md font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90" type="submit">
            تطبيق
          </button>
        </form>
      </FilterBar>

      <CustomersTable rows={result.items} />

      <QueryPagination
        currentPage={result.page}
        pageSize={result.pageSize}
        pathname="/customers"
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

function coerceCustomerStatus(value: string | undefined): "all" | CustomerStatus | undefined {
  if (value === "all_paid" || value === "has_outstanding" || value === "has_overdue") {
    return value;
  }

  return value === "all" ? "all" : undefined;
}
