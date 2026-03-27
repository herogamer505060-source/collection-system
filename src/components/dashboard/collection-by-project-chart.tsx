"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
    return <div className="flex h-[300px] items-center justify-center text-body-md text-on-surface-variant">لا توجد بيانات للعرض</div>;
  }

  return (
    <ResponsiveContainer height={300} width="100%">
      <BarChart data={data} margin={{ bottom: 12, left: 8, right: 8, top: 8 }}>
        <CartesianGrid stroke="rgba(188, 201, 200, 0.35)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="projectName" tick={{ fill: "#3d4949", fontSize: 12 }} />
        <YAxis tick={{ fill: "#3d4949", fontSize: 12 }} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) {
              return null;
            }

            return (
              <div className="rounded-xl bg-surface-container-lowest px-4 py-3 text-body-md ambient-shadow">
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
        <Legend />
        <Bar dataKey="collected" fill="#0f666a" name="المحصل" radius={[8, 8, 0, 0]} />
        <Bar dataKey="outstanding" fill="#337f83" name="المتبقي" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
