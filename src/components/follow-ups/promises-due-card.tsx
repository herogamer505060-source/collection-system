import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/formatting/currency";
import type { PromiseDueItem } from "@/server/queries/follow-ups/get-promises-due";

type PromisesDueCardProps = {
  asOfDate: string;
  items: PromiseDueItem[];
};

export function PromisesDueCard({ asOfDate, items }: PromisesDueCardProps) {
  return (
    <section className="space-y-4 rounded-2xl bg-surface-container-lowest p-5 ambient-shadow">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-title-lg text-on-surface">وعود السداد القادمة</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">القائمة محسوبة اعتبارا من {asOfDate} وتوضح الرصيد المفتوح لكل وعد.</p>
        </div>
        <StatusBadge variant="warning">{items.length} وعد</StatusBadge>
      </div>

      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <article className="rounded-xl bg-surface-container-low p-4" key={item.followUpId}>
              <div className="flex flex-wrap items-center gap-2">
                <Link className="font-semibold text-primary hover:underline" href={`/customers/${item.customerId}`}>
                  {item.customerName}
                </Link>
                {item.contractId ? (
                  <Link className="text-label-lg text-on-surface-variant hover:text-primary" href={`/contracts/${item.contractId}`}>
                    {item.contractCode ?? `عقد ${item.contractId.slice(0, 8)}`}
                  </Link>
                ) : null}
              </div>
              <p className="mt-3 text-body-md leading-7 text-on-surface-variant">{item.note}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-label-lg text-on-surface-variant">
                <span>الوعد: {item.promiseDate}</span>
                {item.projectName ? <span>المشروع: {item.projectName}</span> : null}
                <span>الرصيد المفتوح: {formatCurrency(item.outstandingAmount)}</span>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-xl bg-surface-container-low px-4 py-6 text-body-md text-on-surface-variant">
            لا توجد وعود سداد مفتوحة في الفترة الحالية.
          </div>
        )}
      </div>
    </section>
  );
}
