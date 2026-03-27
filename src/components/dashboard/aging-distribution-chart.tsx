"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatCurrency } from "@/lib/formatting/currency";

type AgingDistributionChartProps = {
  data: { amount: number; bucketLabel: string; count: number }[];
};

const CHART_COLORS = ["#0f666a", "#337f83", "#006767", "#5e979a", "#8ad3d7"];

export function AgingDistributionChart({ data }: AgingDistributionChartProps) {
  if (data.length === 0) {
    return <div className="flex h-[300px] items-center justify-center text-body-md text-on-surface-variant">لا توجد بيانات للعرض</div>;
  }

  return (
    <ResponsiveContainer height={300} width="100%">
      <PieChart>
        <Pie cx="50%" cy="50%" data={data} dataKey="amount" innerRadius={55} nameKey="bucketLabel" outerRadius={95}>
          {data.map((entry, index) => (
            <Cell fill={CHART_COLORS[index % CHART_COLORS.length]} key={`${entry.bucketLabel}-${index}`} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            const item = payload?.[0]?.payload as AgingDistributionChartProps["data"][number] | undefined;

            if (!active || !item) {
              return null;
            }

            return (
              <div className="rounded-xl bg-surface-container-lowest px-4 py-3 text-body-md ambient-shadow">
                <div className="font-semibold text-on-surface">{item.bucketLabel}</div>
                <div className="mt-1 text-on-surface-variant">القيمة: {formatCurrency(item.amount)}</div>
                <div className="mt-1 text-on-surface-variant">عدد الأقساط: {item.count}</div>
              </div>
            );
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
