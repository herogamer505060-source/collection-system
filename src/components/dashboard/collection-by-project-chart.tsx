"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/formatting/currency";

type CollectionByProjectChartProps = {
  data: { collected: number; outstanding: number; projectName: string }[];
};

export function CollectionByProjectChart({ data }: CollectionByProjectChartProps) {
  if (data.length === 0) {
    return <div className="flex h-[320px] items-center justify-center text-body-md text-on-surface-variant">لا توجد بيانات للعرض</div>;
  }

  const sortedData = [...data]
    .sort((left, right) => right.outstanding + right.collected - (left.outstanding + left.collected))
    .slice(0, 6)
    .map((item, index) => ({ ...item, isLead: index === 0 }));

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <InsightCard label="إجمالي المشاريع المعروضة" value={String(sortedData.length)} />
        <InsightCard
          label="أعلى مشروع تحصيلًا"
          value={sortedData[0]?.projectName ?? "—"}
          valueClassName="text-title-md leading-7"
        />
        <InsightCard label="إجمالي المحصل" value={formatCurrency(sortedData.reduce((sum, item) => sum + item.collected, 0))} />
      </div>

      <ResponsiveContainer height={340} width="100%">
        <BarChart data={sortedData} layout="vertical" margin={{ bottom: 8, left: 18, right: 16, top: 8 }}>
          <CartesianGrid horizontal stroke="rgba(188, 201, 200, 0.22)" strokeDasharray="2 8" vertical={false} />
          <XAxis axisLine={false} tick={{ fill: "#52606d", fontSize: 12 }} tickLine={false} type="number" />
          <YAxis
            axisLine={false}
            dataKey="projectName"
            tick={{ fill: "#1f2937", fontSize: 12 }}
            tickLine={false}
            type="category"
            width={130}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) {
                return null;
              }

              return (
                <div className="rounded-2xl bg-surface-container-lowest px-4 py-3 text-body-md ambient-shadow">
                  <div className="font-semibold text-on-surface">{label}</div>
                  {payload.map((entry) => (
                    <div className="mt-1 text-on-surface-variant" key={entry.dataKey?.toString()}>
                      {entry.name}: {formatCurrency(Number(entry.value ?? 0))}
                    </div>
                  ))}
                </div>
              );
            }}
          />
          <Bar barSize={16} dataKey="collected" isAnimationActive name="المحصل" radius={[8, 8, 8, 8]}>
            {sortedData.map((entry) => (
              <Cell fill={entry.isLead ? "#0f666a" : "#4f8d90"} key={`${entry.projectName}-collected`} />
            ))}
          </Bar>
          <Bar barSize={16} dataKey="outstanding" isAnimationActive name="المتبقي" radius={[8, 8, 8, 8]}>
            {sortedData.map((entry) => (
              <Cell fill={entry.isLead ? "#b79252" : "#d4bf97"} key={`${entry.projectName}-outstanding`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-2">
        <LegendChip colorClassName="bg-[#0f666a]" label="المحصل" />
        <LegendChip colorClassName="bg-[#b79252]" label="المتبقي" />
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

function LegendChip({ colorClassName, label }: { colorClassName: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-label-lg text-on-surface-variant">
      <span className={`h-2.5 w-2.5 rounded-full ${colorClassName}`} />
      <span>{label}</span>
    </div>
  );
}
