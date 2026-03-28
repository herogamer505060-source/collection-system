import { AgingDistributionChart } from "@/components/dashboard/aging-distribution-chart";
import { CollectionByProjectChart } from "@/components/dashboard/collection-by-project-chart";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { RecentFollowUps } from "@/components/dashboard/recent-follow-ups";
import { TopOverdueCustomers } from "@/components/dashboard/top-overdue-customers";
import { DateRangeInputs } from "@/components/ui/date-range-inputs";
import { FilterBar } from "@/components/ui/filter-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { getDashboardCharts } from "@/server/queries/dashboard/get-dashboard-charts";
import { getDashboardKpis } from "@/server/queries/dashboard/get-dashboard-kpis";
import {
  buildProjectById,
  filterContractsByScope,
  loadReadModelData,
} from "@/server/queries/read-model-helpers";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams?: Promise<{
    endDate?: string;
    projectId?: string;
    startDate?: string;
  }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const sessionUser = await getRequiredSessionUser();
  const filters = (await searchParams) ?? {};
  const projectId = filters.projectId || undefined;
  const [kpis, chartData, projectOptions] = await Promise.all([
    getDashboardKpis({
      endDate: filters.endDate,
      projectId,
      sessionUser,
      startDate: filters.startDate,
    }),
    getDashboardCharts({
      endDate: filters.endDate,
      projectId,
      sessionUser,
      startDate: filters.startDate,
    }),
    getDashboardProjectOptions(sessionUser),
  ]);

  return (
    <section className="space-y-6">
      <FilterBar
        actions={
          <>
            <StatusBadge variant="danger">
              {kpis.customersOverdue} عميل متأخر
            </StatusBadge>
            <StatusBadge variant="warning">
              {kpis.openPromises} وعد سداد مفتوح
            </StatusBadge>
          </>
        }
        description="عرض تنفيذي هادئ يوضح وضع التحصيل الحالي، المخاطر المفتوحة، وأين يجب أن يبدأ التدخل اليوم."
        title="لوحة مؤشرات التحصيل"
        className="overflow-hidden"
      >
        <form action="/dashboard" className="flex w-full flex-wrap gap-3">
          <select
            className="min-w-[240px] flex-1 rounded-2xl border border-[rgba(188,201,200,0.6)] bg-white/90 px-4 py-3 text-body-md text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30"
            defaultValue={projectId ?? ""}
            name="projectId"
          >
            <option value="">كل المشروعات</option>
            {projectOptions.map((project) => (
              <option key={project.id} value={project.id}>
                {project.label}
              </option>
            ))}
          </select>
          <DateRangeInputs
            endDateValue={filters.endDate ?? null}
            startDateValue={filters.startDate ?? null}
          />
          <button
            className="gradient-primary rounded-2xl px-5 py-3 text-body-md font-semibold text-white shadow-lg shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95"
            type="submit"
          >
            تطبيق نطاق المشروع
          </button>
        </form>
      </FilterBar>

      <KpiGrid kpis={kpis} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="executive-panel rounded-[28px] p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-display text-title-lg text-[hsl(var(--premium-ink))]">
            التحصيل حسب المشروع
            </h3>
            <span className="rounded-full bg-primary/5 px-3 py-1 text-label-lg text-primary/80">توزيع نقدي</span>
          </div>
          <CollectionByProjectChart data={chartData.byProject} />
        </div>
        <div className="executive-panel rounded-[28px] p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-display text-title-lg text-[hsl(var(--premium-ink))]">
            توزيع المتأخرات
            </h3>
            <span className="rounded-full bg-[rgba(183,146,82,0.12)] px-3 py-1 text-label-lg text-[#7a5d2f]">مخاطر التحصيل</span>
          </div>
          <AgingDistributionChart data={chartData.byAging} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <TopOverdueCustomers items={kpis.topOverdueCustomers} />
        <RecentFollowUps
          items={kpis.recentFollowUps}
          lastImportAt={kpis.lastImportAt}
        />
      </div>
    </section>
  );
}

async function getDashboardProjectOptions(
  sessionUser: Awaited<ReturnType<typeof getRequiredSessionUser>>,
) {
  const data = await loadReadModelData();
  const projectById = buildProjectById(data.projects);
  const visibleContracts = filterContractsByScope(sessionUser, data.contracts);

  return Array.from(
    new Set(visibleContracts.map((contract) => contract.project_id)),
  )
    .map((id) => ({
      id,
      label: projectById.get(id)?.name_en ?? id,
    }))
    .sort((left, right) => left.label.localeCompare(right.label, "ar"));
}
