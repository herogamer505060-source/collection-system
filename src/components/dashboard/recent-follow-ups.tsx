import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import { formatEgyptDateTime } from "@/lib/dates/egypt";
import type { RecentFollowUpItem } from "@/server/queries/dashboard/get-recent-follow-ups";

type RecentFollowUpsProps = {
  items: RecentFollowUpItem[];
  lastImportAt: string | null;
};

export function RecentFollowUps({ items, lastImportAt }: RecentFollowUpsProps) {
  return (
    <section className="space-y-4 rounded-2xl bg-surface-container-lowest p-5 ambient-shadow">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="font-display text-title-lg text-on-surface">آخر الأنشطة</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">
            سجل سريع لآخر المتابعات المسجلة، مع آخر وقت اعتماد ناجح لبيانات الاستيراد.
          </p>
        </div>
        <StatusBadge variant="info">
          {lastImportAt ? `آخر استيراد: ${formatEgyptDateTime(lastImportAt)}` : "لا يوجد استيراد معتمد"}
        </StatusBadge>
      </div>

      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <article className="rounded-xl bg-surface-container-low p-4" key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link className="font-semibold text-primary hover:underline" href={`/follow-ups`}>
                  {item.customerName}
                </Link>
                <div className="text-label-lg text-on-surface-variant">{formatEgyptDateTime(item.followUpDate)}</div>
              </div>
              <p className="mt-3 text-body-md leading-7 text-on-surface">{item.summary}</p>
            </article>
          ))
        ) : (
          <div className="rounded-xl bg-surface-container-low px-4 py-6 text-body-md text-on-surface-variant">
            لا توجد متابعات حديثة ضمن النطاق الحالي.
          </div>
        )}
      </div>
    </section>
  );
}
