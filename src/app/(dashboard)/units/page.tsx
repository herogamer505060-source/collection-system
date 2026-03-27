import { UnitsTable } from "@/components/units/units-table";
import { ExportButton } from "@/components/ui/export-button";
import { QueryPagination } from "@/components/ui/query-pagination";
import { FilterBar } from "@/components/ui/filter-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { getUnitsList } from "@/server/queries/units/get-units-list";

export const dynamic = "force-dynamic";

type UnitsPageProps = {
  searchParams?: Promise<{
    page?: string;
    pageSize?: string;
    projectId?: string;
    search?: string;
    status?: string;
  }>;
};

export default async function UnitsPage({ searchParams }: UnitsPageProps) {
  const sessionUser = await getRequiredSessionUser();
  const filters = (await searchParams) ?? {};
  const result = await getUnitsList({
    page: coercePositiveNumber(filters.page, 1),
    pageSize: coercePositiveNumber(filters.pageSize, 50),
    projectId: filters.projectId,
    search: filters.search,
    sessionUser,
    status: coerceUnitStatus(filters.status),
  });

  return (
    <section className="space-y-6">
      <FilterBar
        actions={
          <>
            <StatusBadge variant="info">{result.totalCount} وحدة</StatusBadge>
            <ExportButton exportType="units" filters={filters} />
          </>
        }
        description="فلترة الوحدات حسب المشروع والحالة، ثم الانتقال مباشرة إلى العقد عند توفر ربط للوحدة المباعة."
        title="مخزون الوحدات"
      >
        <form action="/units" className="flex w-full flex-wrap gap-3">
          <input
            className="min-w-[240px] rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30"
            defaultValue={result.filters.search ?? ""}
            name="search"
            placeholder="ابحث بكود الوحدة أو اسم العميل"
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
            className="min-w-[200px] rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30"
            defaultValue={result.filters.status ?? ""}
            name="status"
          >
            <option value="">كل الحالات</option>
            <option value="sold">مباعة</option>
            <option value="available">متاحة</option>
          </select>
          <button className="gradient-primary rounded-xl px-4 py-3 text-body-md font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90" type="submit">
            تطبيق
          </button>
        </form>
      </FilterBar>

      <UnitsTable rows={result.items} />

      <QueryPagination
        currentPage={result.page}
        pageSize={result.pageSize}
        pathname="/units"
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

function coerceUnitStatus(value: string | undefined): "available" | "sold" | undefined {
  if (value === "available" || value === "sold") {
    return value;
  }

  return undefined;
}
