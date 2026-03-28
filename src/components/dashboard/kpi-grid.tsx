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
      eyebrow: "الالتزامات الكلية",
      label: "إجمالي المستحق",
      tag: "محوري",
      value: formatCurrency(kpis.totalDue),
    },
    {
      accentClassName: "bg-primary-container",
      eyebrow: "السيولة المحققة",
      label: "إجمالي المحصل",
      tag: "تحصيل",
      value: formatCurrency(kpis.totalCollected),
    },
    {
      accentClassName: "bg-[#e89a00]",
      eyebrow: "الرصيد المفتوح",
      label: "إجمالي المتبقي",
      tag: "مستحقات",
      value: formatCurrency(kpis.totalOutstanding),
    },
    {
      accentClassName: "bg-error",
      eyebrow: "أولوية التدخل",
      label: "إجمالي المتأخر",
      tag: "مخاطر",
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
      <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
        {primaryCards.map((card) => (
          <article className="executive-panel relative overflow-hidden rounded-[28px] p-6" key={card.label}>
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/80 to-transparent" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="space-y-2">
                <span className="text-label-lg font-semibold tracking-[0.08em] text-on-surface-variant/80">
                  {card.eyebrow}
                </span>
                <div className="text-title-md text-on-surface">{card.label}</div>
              </div>
              <div className={`h-3 w-14 rounded-full ${card.accentClassName}`} />
            </div>
            <div className="relative mt-8 font-display text-[clamp(2rem,3vw,3rem)] leading-none tracking-[-0.03em] text-[hsl(var(--premium-ink))]">
              {card.value}
            </div>
            <div className="relative mt-4 flex items-center justify-between gap-3">
              <StatusBadge variant="neutral">{card.tag}</StatusBadge>
              <span className="text-label-lg text-on-surface-variant">ضمن النطاق الحالي</span>
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {secondaryCards.map((card) => (
          <article className="executive-soft-panel rounded-2xl p-4" key={card.label}>
            <div className="text-label-lg text-on-surface-variant">{card.label}</div>
            <div className="mt-3 font-display text-headline-sm tracking-[-0.02em] text-[hsl(var(--premium-ink))]">
              {card.value}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
