import type { SessionUser } from "@/lib/auth/get-session-user";
import { requirePermission } from "@/lib/auth/permissions";

import {
  buildProjectById,
  filterContractsByScope,
  loadReadModelData,
} from "@/server/queries/read-model-helpers";

type ProjectChartItem = {
  projectName: string;
  collected: number;
  outstanding: number;
};

type AgingChartItem = {
  amount: number;
  bucket: string;
  bucketLabel: string;
  count: number;
};

const BUCKET_LABELS: Record<string, string> = {
  not_due: "غير مستحق",
  "1_30": "1-30 يوم",
  "31_60": "31-60 يوم",
  "61_90": "61-90 يوم",
  "90_plus": "أكثر من 90 يوم",
};

const BUCKET_ORDER = ["not_due", "1_30", "31_60", "61_90", "90_plus"] as const;

export async function getDashboardCharts(input: {
  projectId?: string;
  sessionUser: SessionUser;
}): Promise<{
  byAging: AgingChartItem[];
  byProject: ProjectChartItem[];
}> {
  requirePermission(input.sessionUser, "dashboard.read");

  const data = await loadReadModelData({
    projectId: input.projectId,
    sessionUser: input.sessionUser,
  });
  const projectById = buildProjectById(data.projects);
  const visibleContracts = filterContractsByScope(input.sessionUser, data.contracts, input.projectId);
  const visibleContractIds = new Set(visibleContracts.map((contract) => contract.id));
  const byProjectMap = new Map<string, ProjectChartItem>();
  const byAgingMap = new Map<string, AgingChartItem>();

  for (const contract of visibleContracts) {
    byProjectMap.set(contract.project_id, {
      collected: 0,
      outstanding: 0,
      projectName: projectById.get(contract.project_id)?.name_ar ?? contract.project_id,
    });
  }

  for (const installment of data.installments) {
    if (!visibleContractIds.has(installment.contract_id)) {
      continue;
    }

    const contract = visibleContracts.find((item) => item.id === installment.contract_id);

    if (!contract) {
      continue;
    }

    const projectEntry = byProjectMap.get(contract.project_id);

    if (projectEntry) {
      projectEntry.collected += installment.amount_collected;
      projectEntry.outstanding += installment.amount_outstanding;
    }

    if (installment.amount_outstanding > 0) {
      const bucket = installment.delay_bucket;
      const existingBucket = byAgingMap.get(bucket) ?? {
        amount: 0,
        bucket,
        bucketLabel: BUCKET_LABELS[bucket] ?? bucket,
        count: 0,
      };

      existingBucket.amount += installment.amount_outstanding;
      existingBucket.count += 1;
      byAgingMap.set(bucket, existingBucket);
    }
  }

  return {
    byAging: BUCKET_ORDER.map((bucket) => byAgingMap.get(bucket))
      .filter((item): item is AgingChartItem => Boolean(item))
      .sort((left, right) => BUCKET_ORDER.indexOf(left.bucket as (typeof BUCKET_ORDER)[number]) - BUCKET_ORDER.indexOf(right.bucket as (typeof BUCKET_ORDER)[number])),
    byProject: Array.from(byProjectMap.values()).sort((left, right) => left.projectName.localeCompare(right.projectName, "ar")),
  };
}
