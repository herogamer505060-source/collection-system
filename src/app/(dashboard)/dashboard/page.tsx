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
        description="المؤشرات تتغير حسب المشروع المختار وصلاحيات المستخدم، وتدمج التحصيلات والمتابعات وآخر استيراد معتمد."
        title="لوحة مؤشرات التحصيل"
      >
        <form action="/dashboard" className="flex w-full flex-wrap gap-3">
          <select
            className="min-w-[240px] rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30"
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
            className="gradient-primary rounded-xl px-4 py-3 text-body-md font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90"
            type="submit"
          >
            تطبيق نطاق المشروع
          </button>
        </form>
      </FilterBar>

      <KpiGrid kpis={kpis} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-surface-container-lowest p-5 ambient-shadow">
          <h3 className="mb-4 font-display text-title-lg text-on-surface">
            التحصيل حسب المشروع
          </h3>
          <CollectionByProjectChart data={chartData.byProject} />
        </div>
        <div className="rounded-2xl bg-surface-container-lowest p-5 ambient-shadow">
          <h3 className="mb-4 font-display text-title-lg text-on-surface">
            توزيع المتأخرات
          </h3>
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
