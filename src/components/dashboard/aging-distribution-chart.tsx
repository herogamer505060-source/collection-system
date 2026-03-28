"use client";

import { formatCurrency } from "@/lib/formatting/currency";

type AgingDistributionChartProps = {
  data: { amount: number; bucketLabel: string; count: number }[];
};

const RISK_COLORS = ["#4f8d90", "#71b8ba", "#b79252", "#c97342", "#ba1a1a"];

export function AgingDistributionChart({ data }: AgingDistributionChartProps) {
  if (data.length === 0) {
    return <div className="flex h-[320px] items-center justify-center text-body-md text-on-surface-variant">لا توجد بيانات للعرض</div>;
  }

  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
  const leadBucket = [...data].sort((left, right) => right.amount - left.amount)[0];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <InsightCard label="إجمالي الرصيد المتأخر" value={formatCurrency(totalAmount)} />
        <InsightCard label="أعلى شريحة مخاطرة" value={leadBucket?.bucketLabel ?? "—"} valueClassName="text-title-md leading-7" />
        <InsightCard label="عدد الشرائح النشطة" value={String(data.length)} />
      </div>

      <div className="space-y-4">
        {data.map((item, index) => {
          const ratio = totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0;
          return (
            <div className="space-y-2" key={item.bucketLabel}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-on-surface">{item.bucketLabel}</div>
                  <div className="text-label-lg text-on-surface-variant">{item.count} قسط</div>
                </div>
                <div className="text-left">
                  <div className="font-display text-title-lg text-[hsl(var(--premium-ink))]">{formatCurrency(item.amount)}</div>
                  <div className="text-label-lg text-on-surface-variant">{ratio.toFixed(1)}%</div>
                </div>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-surface-container-low">
                <div
                  className="h-full rounded-full transition-[width] duration-700 ease-out"
                  style={{ background: RISK_COLORS[index % RISK_COLORS.length], width: `${Math.max(ratio, 6)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InsightCard({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="executive-soft-panel rounded-2xl p-4">
      <div className="text-label-lg text-on-surface-variant">{label}</div>
      <div className={`mt-2 font-display text-headline-sm text-[hsl(var(--premium-ink))] ${valueClassName ?? ""}`}>{value}</div>
    </div>
  );
}
