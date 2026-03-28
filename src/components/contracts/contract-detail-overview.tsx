"use client";

import { useState } from "react";

import { ContractEditForm } from "@/components/contracts/contract-edit-form";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getContractDerivedStatusLabel,
  getContractDerivedStatusVariant,
} from "@/features/customers/presentation";
import { formatCurrency } from "@/lib/formatting/currency";

type ContractDetailOverviewProps = {
  canEdit: boolean;
  contract: {
    collectorName: string | null;
    collectorUserId: string | null;
    contractCode: string | null;
    contractId: string;
    contractNotes: string | null;
    contractStatus: string;
    customer: {
      customerName: string;
    };
    deliveryDate: string | null;
    project: {
      projectName: string;
    };
    totals: {
      amountCollected: number;
      amountDue: number;
      amountOutstanding: number;
      derivedStatus: "outstanding" | "overdue" | "paid" | "partial";
      followUpCount: number;
      penaltyAmount: number;
    };
  };
  profileOptions: { id: string; label: string }[];
};

export function ContractDetailOverview({ canEdit, contract, profileOptions }: ContractDetailOverviewProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <section className="executive-panel rounded-[32px] p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="text-label-lg uppercase tracking-[0.18em] text-primary/65">Contract overview</div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-headline-sm font-bold tracking-[-0.03em] text-[hsl(var(--premium-ink))]">
              {contract.contractCode ?? `عقد ${contract.contractId.slice(0, 8)}`}
            </h2>
            <StatusBadge variant={getContractDerivedStatusVariant(contract.totals.derivedStatus)}>
              {getContractDerivedStatusLabel(contract.totals.derivedStatus)}
            </StatusBadge>
          </div>
          <p className="mt-2 text-body-md text-on-surface-variant">
            {contract.customer.customerName} - {contract.project.projectName}
          </p>
        </div>
        <div className="space-y-3 lg:max-w-md">
          {canEdit ? (
            <button
              className="rounded-2xl border border-[rgba(188,201,200,0.55)] bg-white/80 px-5 py-3 text-body-md font-semibold text-on-surface transition-all duration-200 hover:-translate-y-0.5 hover:bg-white"
              onClick={() => setIsEditing(true)}
              type="button"
            >
              تعديل بيانات العقد
            </button>
          ) : null}
          <div className="executive-soft-panel rounded-2xl px-4 py-4 text-body-md text-on-surface-variant">
            <div className="font-semibold text-on-surface">ملخص التعيين والتسليم</div>
            <div className="mt-1">المحصل المسؤول: {contract.collectorName ?? "غير محدد"}</div>
            <div className="mt-1">تاريخ التسليم: {contract.deliveryDate ?? "غير محدد"}</div>
            <div className="mt-1">حالة العقد: {contract.contractStatus}</div>
            <div className="mt-3 font-semibold text-on-surface">ملاحظات العقد</div>
            <div className="mt-1">{contract.contractNotes ?? "لا توجد ملاحظات على العقد"}</div>
          </div>
        </div>
      </div>

      {canEdit && isEditing ? (
        <div className="mt-5">
          <ContractEditForm
            contractId={contract.contractId}
            initialValues={{
              collectorUserId: contract.collectorUserId,
              contractNotes: contract.contractNotes,
              contractStatus: contract.contractStatus,
              deliveryDate: contract.deliveryDate,
            }}
            onCancel={() => setIsEditing(false)}
            onSuccess={() => setIsEditing(false)}
            profileOptions={profileOptions}
          />
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="إجمالي المستحق" value={formatCurrency(contract.totals.amountDue)} />
        <MetricCard label="إجمالي المحصل" value={formatCurrency(contract.totals.amountCollected)} />
        <MetricCard label="إجمالي المتبقي" value={formatCurrency(contract.totals.amountOutstanding)} />
        <MetricCard label="الغرامات" value={formatCurrency(contract.totals.penaltyAmount)} />
        <MetricCard label="عدد المتابعات" value={String(contract.totals.followUpCount)} />
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="executive-soft-panel rounded-2xl p-4">
      <div className="text-label-lg text-on-surface-variant">{label}</div>
      <div className="mt-2 font-display text-headline-sm tracking-[-0.02em] text-[hsl(var(--premium-ink))]">{value}</div>
    </div>
  );
}
