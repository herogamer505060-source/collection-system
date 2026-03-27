import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/formatting/currency";
import type { TopOverdueCustomer } from "@/server/queries/dashboard/get-top-overdue-customers";

type TopOverdueCustomersProps = {
  items: TopOverdueCustomer[];
};

export function TopOverdueCustomers({ items }: TopOverdueCustomersProps) {
  return (
    <section className="space-y-4 rounded-2xl bg-surface-container-lowest p-5 ambient-shadow">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-title-lg text-on-surface">أعلى العملاء المتأخرين</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">
            الترتيب يعتمد على إجمالي الرصيد المتأخر بعد تطبيق صلاحيات المستخدم ومرشح المشروع الحالي.
          </p>
        </div>
        <StatusBadge variant="danger">{items.length} عميل</StatusBadge>
      </div>

      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item, index) => (
            <article className="rounded-xl bg-surface-container-low p-4" key={item.customerId}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3">
                    <StatusBadge variant="neutral">#{index + 1}</StatusBadge>
                    <Link className="font-semibold text-primary hover:underline" href={`/customers/${item.customerId}`}>
                      {item.customerName}
                    </Link>
                  </div>
                  <div className="mt-2 text-body-md text-on-surface-variant">{item.projectName}</div>
                  <div className="mt-2 text-label-lg text-on-surface-variant">
                    آخر متابعة: {item.lastFollowUpDate ?? "لا توجد متابعة مسجلة"}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-label-lg font-semibold text-on-surface-variant">إجمالي المتأخر</div>
                  <div className="mt-2 font-display text-headline-sm text-error">
                    {formatCurrency(item.totalOverdue)}
                  </div>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-xl bg-surface-container-low px-4 py-6 text-body-md text-on-surface-variant">
            لا توجد حالات تأخير ضمن النطاق الحالي.
          </div>
        )}
      </div>
    </section>
  );
}
