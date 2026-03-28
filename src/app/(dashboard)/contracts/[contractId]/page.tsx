import { notFound } from "next/navigation";

import { ContractDetailOverview } from "@/components/contracts/contract-detail-overview";
import { ContractDocumentsSection } from "@/components/contracts/contract-documents-section";
import { InstallmentsTable } from "@/components/installments/installments-table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getContactTypeLabel,
  getFollowUpStatusLabel,
  getFollowUpStatusVariant,
  getUnitStatusLabel,
} from "@/features/customers/presentation";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { formatEgyptDateTime } from "@/lib/dates/egypt";
import { formatCurrency } from "@/lib/formatting/currency";
import { getContractDetail } from "@/server/queries/contracts/get-contract-detail";
import { getContractDocuments } from "@/server/queries/contracts/get-contract-documents";
import { loadReadModelData } from "@/server/queries/read-model-helpers";

export const dynamic = "force-dynamic";

type ContractDetailPageProps = {
  params: Promise<{ contractId: string }>;
};

export default async function ContractDetailPage({ params }: ContractDetailPageProps) {
  const sessionUser = await getRequiredSessionUser();
  const { contractId } = await params;
  const [detail, profileOptions] = await Promise.all([
    getContractDetail({ contractId, sessionUser }),
    getCollectorProfileOptions(),
  ]);
  const canEdit = sessionUser.roles.some(
    (assignment) => assignment.role === "admin" || assignment.role === "manager",
  );

  if (!detail) {
    notFound();
  }

  const documents = await getContractDocuments({ contractId, sessionUser });
  const sharedUnitCodes = detail.units.map((unit) => unit.unitCode);

  return (
    <section className="space-y-6">
      <ContractDetailOverview canEdit={canEdit} contract={detail.contract} profileOptions={profileOptions} />

      <section className="space-y-4 rounded-2xl bg-surface-container-lowest p-5 ambient-shadow">
        <div>
          <h3 className="font-display text-title-lg text-on-surface">الوحدات المرتبطة</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">كل وحدة تعرض الحالة الحالية والأسعار والمساحات المرتبطة بالعقد.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {detail.units.map((unit) => (
            <article className="rounded-xl bg-surface-container-low p-4" key={unit.unitId}>
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold text-on-surface">{unit.unitCode}</div>
                <StatusBadge variant="neutral">{getUnitStatusLabel(unit.unitStatus)}</StatusBadge>
              </div>
              <div className="mt-3 space-y-1 text-body-md text-on-surface-variant">
                <div>الدور: {unit.floorName ?? "غير محدد"}</div>
                <div>المساحة: {unit.builtUpArea ?? 0} م2</div>
                <div>حديقة: {unit.gardenArea ?? 0} م2</div>
                <div>سعر القائمة: {formatCurrency(unit.listPrice ?? 0)}</div>
                <div>سعر التعاقد: {formatCurrency(unit.contractPrice ?? 0)}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="font-display text-title-lg text-on-surface">جدول الأقساط</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">المواعيد والمبالغ وحالة التحصيل لكل قسط داخل العقد.</p>
        </div>
        <InstallmentsTable
          canEdit={canEdit}
          rows={detail.installments.map((installment) => ({
            ...installment,
            contractCode: detail.contract.contractCode,
            contractId: detail.contract.contractId,
            customerId: detail.contract.customer.customerId,
            customerName: detail.contract.customer.customerName,
            projectId: detail.contract.project.projectId,
            projectName: detail.contract.project.projectName,
            unitCodes: sharedUnitCodes,
          }))}
          showCustomer={false}
          showProject={false}
        />
      </section>

      <section className="space-y-4 rounded-2xl bg-surface-container-lowest p-5 ambient-shadow">
        <div>
          <h3 className="font-display text-title-lg text-on-surface">المتابعات المرتبطة</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">التسلسل الزمني الكامل لآخر تواصلات التحصيل الخاصة بهذا العقد.</p>
        </div>
        <div className="space-y-3">
          {detail.followUps.length > 0 ? (
            detail.followUps.map((followUp) => (
              <article className="rounded-xl bg-surface-container-low p-4" key={followUp.id}>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge variant={getFollowUpStatusVariant(followUp.followUpStatus)}>
                    {getFollowUpStatusLabel(followUp.followUpStatus)}
                  </StatusBadge>
                  <StatusBadge variant="neutral">{getContactTypeLabel(followUp.contactType)}</StatusBadge>
                  {followUp.promisedToPay ? <StatusBadge variant="warning">وعد سداد</StatusBadge> : null}
                </div>
                <p className="mt-3 text-body-md leading-7 text-on-surface">{followUp.note}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-label-lg text-on-surface-variant">
                  <span>{formatEgyptDateTime(followUp.followUpDate)}</span>
                  {followUp.promiseDate ? <span>الوعد: {followUp.promiseDate}</span> : null}
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-xl bg-surface-container-low px-4 py-6 text-body-md text-on-surface-variant">
              لا توجد متابعات مرتبطة بهذا العقد.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl bg-surface-container-lowest p-5 ambient-shadow">
        <div>
          <h3 className="font-display text-title-lg text-on-surface">المستندات المرفقة</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">
            ارفع نسخ PDF للعقد أو الملحقات أو الإيصالات وشاركها مع الإدارة عند الحاجة.
          </p>
        </div>
        <ContractDocumentsSection canUpload={canEdit} contractId={contractId} documents={documents} />
      </section>
    </section>
  );
}

async function getCollectorProfileOptions(): Promise<Array<{ id: string; label: string }>> {
  const data = await loadReadModelData();

  return data.profiles
    .filter((profile) => profile.is_active)
    .map((profile) => ({ id: profile.id, label: profile.full_name }))
    .sort((left, right) => left.label.localeCompare(right.label, "ar"));
}
