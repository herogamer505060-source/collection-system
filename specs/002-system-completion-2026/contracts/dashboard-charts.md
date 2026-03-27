# Contract: Dashboard Charts

## Purpose
Add visual charts to the dashboard: collection by project (bar chart) and aging distribution (pie chart).

## Files to Create

### 1. Chart Data Query
**File**: `src/server/queries/dashboard/get-dashboard-charts.ts`

```typescript
import type { SessionUser } from "@/lib/auth/get-session-user";
import { requirePermission } from "@/lib/auth/permissions";
import { loadReadModelData, filterContractsByScope } from "@/server/queries/read-model-helpers";

type ProjectChartItem = {
  projectName: string;
  collected: number;
  outstanding: number;
};

type AgingChartItem = {
  bucket: string;
  bucketLabel: string;
  amount: number;
  count: number;
};

export async function getDashboardCharts(input: {
  sessionUser: SessionUser;
  projectId?: string;
}): Promise<{
  byProject: ProjectChartItem[];
  byAging: AgingChartItem[];
}> {
  requirePermission(input.sessionUser, "dashboard.read");
  const data = await loadReadModelData();

  // byProject: group installments by contract → project, sum collected/outstanding
  // byAging: group installments by delay_bucket, sum amount_outstanding, count

  // Aging bucket labels (Arabic):
  // not_due → "غير مستحق"
  // 1_30 → "1-30 يوم"
  // 31_60 → "31-60 يوم"
  // 61_90 → "61-90 يوم"
  // 90_plus → "أكثر من 90 يوم"
}
```

### 2. Collection by Project Chart
**File**: `src/components/dashboard/collection-by-project-chart.tsx`

```tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/formatting/currency";

type Props = {
  data: { projectName: string; collected: number; outstanding: number }[];
};

export function CollectionByProjectChart({ data }: Props) {
  // ResponsiveContainer wrapping BarChart
  // Two bars: collected (green/emerald) and outstanding (amber/orange)
  // XAxis: project names
  // Tooltip: formatted currency
  // Legend labels: "المحصل", "المتبقي"
  // If data is empty, show empty state message
}
```

### 3. Aging Distribution Chart
**File**: `src/components/dashboard/aging-distribution-chart.tsx`

```tsx
"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/formatting/currency";

type Props = {
  data: { bucketLabel: string; amount: number; count: number }[];
};

export function AgingDistributionChart({ data }: Props) {
  // ResponsiveContainer wrapping PieChart
  // Pie with cells colored by severity:
  //   not_due → green, 1_30 → yellow, 31_60 → orange, 61_90 → red, 90_plus → dark red
  // Tooltip: bucket label + formatted currency + count
  // Legend: bucket labels
  // If data is empty, show empty state message
}
```

### 4. Integration in Dashboard Page
**File**: `src/app/(dashboard)/dashboard/page.tsx`

Add charts below the KPI grid:

```tsx
const chartData = await getDashboardCharts({
  sessionUser,
  projectId: filters.projectId,
});

// In JSX, after KPI grid:
<div className="grid gap-6 lg:grid-cols-2">
  <div className="rounded-[1.75rem] border border-border/70 bg-white/80 p-5">
    <h3 className="font-display text-lg font-bold text-foreground mb-4">التحصيل حسب المشروع</h3>
    <CollectionByProjectChart data={chartData.byProject} />
  </div>
  <div className="rounded-[1.75rem] border border-border/70 bg-white/80 p-5">
    <h3 className="font-display text-lg font-bold text-foreground mb-4">توزيع المتأخرات</h3>
    <AgingDistributionChart data={chartData.byAging} />
  </div>
</div>
```

### RTL Considerations
- Recharts renders SVG; text labels need no RTL transform
- Arabic text in tooltips/legends works natively
- Bar chart reads naturally left-to-right for project comparison

### Color Palette
- Collected: `#10b981` (emerald-500)
- Outstanding: `#f59e0b` (amber-500)
- Aging buckets: `#22c55e`, `#eab308`, `#f97316`, `#ef4444`, `#991b1b`

### Verification
- Bar chart displays with correct data per project
- Pie chart displays aging distribution
- Both charts update when project filter changes
- Empty data shows graceful empty state
- Tooltips show formatted currency values
