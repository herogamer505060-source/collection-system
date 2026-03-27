import { FollowUpsTable } from "@/components/follow-ups/follow-ups-table";
import { PromisesDueCard } from "@/components/follow-ups/promises-due-card";
import { ExportButton } from "@/components/ui/export-button";
import { QueryPagination } from "@/components/ui/query-pagination";
import { FilterBar } from "@/components/ui/filter-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { hasPermission } from "@/lib/auth/permissions";
import { getFollowUpsList } from "@/server/queries/follow-ups/get-follow-ups-list";
import { getPromisesDue } from "@/server/queries/follow-ups/get-promises-due";

export const dynamic = "force-dynamic";

type FollowUpsPageProps = {
  searchParams?: Promise<{
    collectorUserId?: string;
    endDate?: string;
    overdueOnly?: string;
    page?: string;
    pageSize?: string;
    projectId?: string;
    promisedToPayOnly?: string;
    search?: string;
    startDate?: string;
    status?: string;
  }>;
};

export default async function FollowUpsPage({ searchParams }: FollowUpsPageProps) {
  const sessionUser = await getRequiredSessionUser();
  const filters = (await searchParams) ?? {};
  const result = await getFollowUpsList({
    collectorUserId: filters.collectorUserId,
    endDate: filters.endDate,
    overdueOnly: coerceBoolean(filters.overdueOnly),
    page: coercePositiveNumber(filters.page, 1),
    pageSize: coercePositiveNumber(filters.pageSize, 50),
    projectId: filters.projectId,
    promisedToPayOnly: coerceBoolean(filters.promisedToPayOnly),
    search: filters.search,
    sessionUser,
    startDate: filters.startDate,
    status: filters.status,
  });
  const promisesDue = await getPromisesDue({ projectId: filters.projectId, sessionUser });
  const canManage = hasPermission(sessionUser, "followUps.manageAny") || hasPermission(sessionUser, "followUps.manageOwn");

  return (
    <section className="space-y-6">
      <FilterBar
        actions={
          <>
            <StatusBadge variant={canManage ? "success" : "info"}>{result.totalCount} متابعة</StatusBadge>
            <ExportButton exportType="follow-ups" filters={filters} />
          </>
        }
        description="فلترة المتابعات حسب المحصل والفترة الزمنية والحالة ووعود السداد، مع إبراز الإجراءات المتأخرة وإمكانية تعديل السجلات المسموح بها."
        title="قائمة المتابعات"
      >
        <form action="/follow-ups" className="flex w-full flex-wrap gap-3">
          <input
            className="min-w-[240px] rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30"
            defaultValue={result.filters.search ?? ""}
            name="search"
            placeholder="ابحث باسم العميل أو الملاحظة"
            type="search"
          />
          <select
            className="min-w-[200px] rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30"
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
            defaultValue={result.filters.collectorUserId ?? ""}
            name="collectorUserId"
          >
            <option value="">كل المحصلين</option>
            {result.collectorOptions.map((collector) => (
              <option key={collector.id} value={collector.id}>
                {collector.label}
              </option>
            ))}
          </select>
          <select
            className="min-w-[180px] rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30"
            defaultValue={result.filters.status ?? ""}
            name="status"
          >
            <option value="">كل الحالات</option>
            <option value="open">مفتوح</option>
            <option value="done">مغلق</option>
            <option value="missed">فائت</option>
          </select>
          <input
            className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30"
            defaultValue={result.filters.startDate ?? ""}
            name="startDate"
            type="date"
          />
          <input
            className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30"
            defaultValue={result.filters.endDate ?? ""}
            name="endDate"
            type="date"
          />
          <label className="flex items-center gap-2 rounded-xl bg-surface-container-low px-4 py-3 text-body-md text-on-surface">
            <input
              className="h-4 w-4 rounded border-outline-variant/40 text-primary focus:ring-[#8ad3d7]/30"
              defaultChecked={result.filters.overdueOnly}
              name="overdueOnly"
              type="checkbox"
              value="true"
            />
            <span>المتأخر فقط</span>
          </label>
          <label className="flex items-center gap-2 rounded-xl bg-surface-container-low px-4 py-3 text-body-md text-on-surface">
            <input
              className="h-4 w-4 rounded border-outline-variant/40 text-primary focus:ring-[#8ad3d7]/30"
              defaultChecked={result.filters.promisedToPayOnly}
              name="promisedToPayOnly"
              type="checkbox"
              value="true"
            />
            <span>وعود السداد فقط</span>
          </label>
          <button className="gradient-primary rounded-xl px-4 py-3 text-body-md font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90" type="submit">
            تطبيق
          </button>
        </form>
      </FilterBar>

      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <PromisesDueCard asOfDate={promisesDue.asOfDate} items={promisesDue.items} />
        <FollowUpsTable canManage={canManage} rows={result.items} />
      </div>

      <QueryPagination
        currentPage={result.page}
        pageSize={result.pageSize}
        pathname="/follow-ups"
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

function coerceBoolean(value: string | undefined): boolean {
  return value === "true" || value === "on";
}
