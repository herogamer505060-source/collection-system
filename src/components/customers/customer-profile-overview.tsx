"use client";

import { useState } from "react";

import { CustomerEditForm } from "@/components/customers/customer-edit-form";
import { CustomerFollowUpHistory } from "@/components/customers/customer-follow-up-history";
import { ContractsTable } from "@/components/contracts/contracts-table";
import { InstallmentsTable } from "@/components/installments/installments-table";
import { formatCurrency } from "@/lib/formatting/currency";
import { formatInteger } from "@/lib/formatting/numbers";
import type { CustomerProfileResult } from "@/server/queries/customers/get-customer-profile";

type CustomerProfileOverviewProps = {
  canEditCustomer: boolean;
  canManageFollowUps: boolean;
  defaultCollectorUserId?: string | null;
  profile: CustomerProfileResult;
};

export function CustomerProfileOverview({
  canEditCustomer,
  canManageFollowUps,
  defaultCollectorUserId,
  profile,
}: CustomerProfileOverviewProps) {
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);

  return (
    <section className="space-y-6">
      <section className="rounded-2xl bg-surface-container-lowest p-5 ambient-shadow">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="font-display text-headline-sm font-bold text-on-surface">{profile.customer.customerName}</h2>
            <p className="mt-2 text-body-md text-on-surface-variant">
              الملف المجمع يعرض كل العقود والوحدات والأقساط والمتابعات المرتبطة بهذا العميل.
            </p>
            {profile.customer.notes ? (
              <p className="mt-3 max-w-3xl text-body-md leading-7 text-on-surface">{profile.customer.notes}</p>
            ) : null}
          </div>
          <div className="space-y-3">
            {canEditCustomer ? (
              <button
                className="rounded-xl bg-surface-container-high px-5 py-3 text-body-md font-semibold text-on-surface transition-all hover:bg-surface-container-highest"
                onClick={() => setIsEditingCustomer(true)}
                type="button"
              >
                تعديل بيانات العميل
              </button>
            ) : null}
            <div className="rounded-xl bg-surface-container-low px-4 py-3 text-body-md text-on-surface-variant">
              <div className="font-semibold text-on-surface">الاسم المعياري</div>
              <div className="mt-1">{profile.customer.normalizedName}</div>
              <div className="mt-3 space-y-1">
                <div>رقم الجوال: {profile.customer.mobile ?? "غير متوفر"}</div>
                <div>البريد الإلكتروني: {profile.customer.email ?? "غير متوفر"}</div>
                <div>الرقم القومي: {profile.customer.nationalId ?? "غير متوفر"}</div>
              </div>
            </div>
          </div>
        </div>

        {canEditCustomer && isEditingCustomer ? (
          <div className="mt-5">
            <CustomerEditForm
              customerId={profile.customer.customerId}
              initialValues={{
                customerName: profile.customer.customerName,
                email: profile.customer.email,
                mobile: profile.customer.mobile,
                nationalId: profile.customer.nationalId,
                notes: profile.customer.notes,
              }}
              onCancel={() => setIsEditingCustomer(false)}
              onSuccess={() => setIsEditingCustomer(false)}
            />
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="إجمالي المستحق" value={formatCurrency(profile.totals.amountDue)} />
          <MetricCard label="إجمالي المحصل" value={formatCurrency(profile.totals.amountCollected)} />
          <MetricCard label="إجمالي المتبقي" value={formatCurrency(profile.totals.amountOutstanding)} />
          <MetricCard label="الغرامات" value={formatCurrency(profile.totals.penaltyAmount)} />
          <MetricCard
            label="العقود / المتابعات / المتأخرات"
            value={`${formatInteger(profile.totals.contractCount)} / ${formatInteger(profile.totals.followUpCount)} / ${formatInteger(profile.totals.overdueInstallments)}`}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="font-display text-title-lg text-on-surface">العقود المرتبطة</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">كل عقد يعرض المشروع والوحدات وإجماليات التحصيل والحالة المشتقة.</p>
        </div>
        <ContractsTable rows={profile.contracts} showCustomer={false} />
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="font-display text-title-lg text-on-surface">جدول الأقساط</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">الجدول يجمع أقساط كل العقود مع توضيح الحالة والتأخير والوحدات المرتبطة.</p>
        </div>
        <InstallmentsTable rows={profile.installments} showCustomer={false} />
      </section>

      <CustomerFollowUpHistory
        canManage={canManageFollowUps}
        contractOptions={profile.contracts.map((contract) => ({
          id: contract.contractId,
          label: `${contract.contractCode ?? contract.contractId.slice(0, 8)} - ${contract.projectName}`,
        }))}
        customerId={profile.customer.customerId}
        customerLabel={profile.customer.customerName}
        defaultCollectorUserId={defaultCollectorUserId}
        followUps={profile.followUps}
      />
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-container-low p-4">
      <div className="text-label-lg text-on-surface-variant">{label}</div>
      <div className="mt-2 font-display text-headline-sm text-on-surface">{value}</div>
    </div>
  );
}
