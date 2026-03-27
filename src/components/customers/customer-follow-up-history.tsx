import { AddFollowUpButton } from "@/components/customers/add-follow-up-button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getContactTypeLabel,
  getFollowUpStatusLabel,
  getFollowUpStatusVariant,
} from "@/features/customers/presentation";
import { formatEgyptDateTime } from "@/lib/dates/egypt";
import type { CustomerProfileFollowUp } from "@/server/queries/customers/get-customer-profile";

type CustomerFollowUpHistoryProps = {
  canManage: boolean;
  contractOptions: Array<{ id: string; label: string }>;
  customerId: string;
  customerLabel: string;
  defaultCollectorUserId?: string | null;
  followUps: CustomerProfileFollowUp[];
};

export function CustomerFollowUpHistory({
  canManage,
  contractOptions,
  customerId,
  customerLabel,
  defaultCollectorUserId,
  followUps,
}: CustomerFollowUpHistoryProps) {
  return (
    <section className="space-y-4 rounded-2xl bg-surface-container-lowest p-5 ambient-shadow">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="font-display text-title-lg text-on-surface">سجل المتابعات</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">
            الملاحظات التشغيلية محفوظة بالكامل وتظهر هنا بترتيب زمني من الأحدث إلى الأقدم.
          </p>
        </div>
        <AddFollowUpButton
          canManage={canManage}
          contractOptions={contractOptions}
          customerId={customerId}
          customerLabel={customerLabel}
          defaultCollectorUserId={defaultCollectorUserId}
        />
      </div>

      <div className="space-y-3">
        {followUps.length > 0 ? (
          followUps.map((followUp) => (
            <article className="rounded-xl bg-surface-container-low p-4" key={followUp.id}>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge variant={getFollowUpStatusVariant(followUp.followUpStatus)}>
                  {getFollowUpStatusLabel(followUp.followUpStatus)}
                </StatusBadge>
                <StatusBadge variant="neutral">{getContactTypeLabel(followUp.contactType)}</StatusBadge>
                {followUp.promisedToPay ? <StatusBadge variant="warning">يوجد وعد سداد</StatusBadge> : null}
              </div>
              <p className="mt-3 text-body-md leading-7 text-on-surface">{followUp.note}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-label-lg text-on-surface-variant">
                <span>تاريخ المتابعة: {formatEgyptDateTime(followUp.followUpDate)}</span>
                {followUp.collectorName ? <span>المحصل: {followUp.collectorName}</span> : null}
                {followUp.promiseDate ? <span>تاريخ الوعد: {followUp.promiseDate}</span> : null}
                {followUp.nextActionDate ? <span>الإجراء التالي: {followUp.nextActionDate}</span> : null}
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-xl bg-surface-container-low px-4 py-6 text-body-md text-on-surface-variant">
            لا توجد متابعات مسجلة لهذا العميل بعد.
          </div>
        )}
      </div>
    </section>
  );
}
