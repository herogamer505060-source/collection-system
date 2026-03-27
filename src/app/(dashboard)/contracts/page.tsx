import { ContractsTable } from "@/components/contracts/contracts-table";
import { ExportButton } from "@/components/ui/export-button";
import { QueryPagination } from "@/components/ui/query-pagination";
import { FilterBar } from "@/components/ui/filter-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { getContractsList } from "@/server/queries/contracts/get-contracts-list";

export const dynamic = "force-dynamic";

type ContractsPageProps = {
  searchParams?: Promise<{
    page?: string;
    pageSize?: string;
    projectId?: string;
    search?: string;
  }>;
};

export default async function ContractsPage({ searchParams }: ContractsPageProps) {
  const sessionUser = await getRequiredSessionUser();
  const filters = (await searchParams) ?? {};
  const result = await getContractsList({
    page: coercePositiveNumber(filters.page, 1),
    pageSize: coercePositiveNumber(filters.pageSize, 50),
    projectId: filters.projectId,
    search: filters.search,
    sessionUser,
  });

  return (
    <section className="space-y-6">
      <FilterBar
        actions={
          <>
            <StatusBadge variant="info">{result.totalCount} عقد</StatusBadge>
            <ExportButton exportType="contracts" filters={filters} />
          </>
        }
        description="ابحث برقم العقد أو اسم العميل أو كود الوحدة، ثم افتح تفاصيل العقد لمراجعة الوحدات والأقساط والمتابعات."
        title="قائمة العقود"
      >
        <form action="/contracts" className="flex w-full flex-wrap gap-3">
          <input
            className="min-w-[260px] rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30"
            defaultValue={result.filters.search ?? ""}
            name="search"
            placeholder="ابحث برقم العقد أو العميل أو الوحدة"
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
          <button className="gradient-primary rounded-xl px-4 py-3 text-body-md font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90" type="submit">
            تطبيق
          </button>
        </form>
      </FilterBar>

      <ContractsTable rows={result.items} />

      <QueryPagination
        currentPage={result.page}
        pageSize={result.pageSize}
        pathname="/contracts"
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
