import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/formatting/currency";
import { formatInteger, formatPercentage } from "@/lib/formatting/numbers";
import type { DashboardKpisResult } from "@/server/queries/dashboard/get-dashboard-kpis";

type KpiGridProps = {
  kpis: DashboardKpisResult;
};

export function KpiGrid({ kpis }: KpiGridProps) {
  const primaryCards = [
    {
      accentClassName: "bg-primary",
      label: "إجمالي المستحق",
      value: formatCurrency(kpis.totalDue),
    },
    {
      accentClassName: "bg-primary-container",
      label: "إجمالي المحصل",
      value: formatCurrency(kpis.totalCollected),
    },
    {
      accentClassName: "bg-[#e89a00]",
      label: "إجمالي المتبقي",
      value: formatCurrency(kpis.totalOutstanding),
    },
    {
      accentClassName: "bg-error",
      label: "إجمالي المتأخر",
      value: formatCurrency(kpis.totalOverdue),
    },
  ];
  const secondaryCards = [
    { label: "إجمالي الغرامات", value: formatCurrency(kpis.totalPenalties) },
    { label: "نسبة التحصيل", value: formatPercentage(kpis.collectionPercentage / 100) },
    { label: "عملاء منتظمون", value: formatInteger(kpis.customersPaid) },
    { label: "عملاء عليهم رصيد", value: formatInteger(kpis.customersUnpaid) },
    { label: "عملاء متأخرون", value: formatInteger(kpis.customersOverdue) },
    { label: "وعود سداد مفتوحة", value: formatInteger(kpis.openPromises) },
  ];

  return (
    <section className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-4">
        {primaryCards.map((card) => (
          <article className="rounded-2xl bg-surface-container-lowest p-6 ambient-shadow" key={card.label}>
            <div className={`mb-4 h-1 w-12 rounded-full ${card.accentClassName}`} />
            <div className="flex items-center justify-between gap-3">
              <span className="text-label-lg text-on-surface-variant">{card.label}</span>
              <StatusBadge variant="neutral">KPI</StatusBadge>
            </div>
            <div className="mt-5 font-display text-display-sm text-on-surface">{card.value}</div>
          </article>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {secondaryCards.map((card) => (
          <article className="rounded-xl bg-surface-container-low p-4" key={card.label}>
            <div className="text-label-lg text-on-surface-variant">{card.label}</div>
            <div className="mt-3 font-display text-headline-sm text-on-surface">{card.value}</div>
          </article>
        ))}
      </div>
    </section>
  );
}
