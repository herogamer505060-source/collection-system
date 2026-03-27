"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { formatCurrency } from "@/lib/formatting/currency";

type InstallmentEditFormProps = {
  installmentId: string;
  initialValues: {
    amountCollected: number;
    amountDue: number;
    paymentDate?: string | null;
    penaltyAmount?: number | null;
    receiptReference?: string | null;
  };
  onCancel?: () => void;
  onSuccess?: () => void;
};

type InstallmentEditFormState = {
  amountCollected: string;
  paymentDate: string;
  penaltyAmount: string;
  receiptReference: string;
};

const fieldClassName =
  "w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface outline-none transition-all placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30";

const primaryButtonClassName =
  "gradient-primary rounded-xl px-5 py-3 text-body-md font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-60";

const secondaryButtonClassName =
  "rounded-xl bg-surface-container-high px-5 py-3 text-body-md font-semibold text-on-surface transition-all hover:bg-surface-container-highest";

export function InstallmentEditForm({
  installmentId,
  initialValues,
  onCancel,
  onSuccess,
}: InstallmentEditFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState<InstallmentEditFormState>({
    amountCollected: String(initialValues.amountCollected),
    paymentDate: initialValues.paymentDate ?? "",
    penaltyAmount: initialValues.penaltyAmount === null || initialValues.penaltyAmount === undefined
      ? ""
      : String(initialValues.penaltyAmount),
    receiptReference: initialValues.receiptReference ?? "",
  });

  const approximateOutstanding = useMemo(() => {
    const amountCollected = Number(formState.amountCollected);
    return Math.max(0, initialValues.amountDue - (Number.isFinite(amountCollected) ? amountCollected : 0));
  }, [formState.amountCollected, initialValues.amountDue]);

  function updateField<Key extends keyof InstallmentEditFormState>(
    key: Key,
    value: InstallmentEditFormState[Key],
  ) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        setError(null);

        const response = await fetch(`/api/installments/${installmentId}`, {
          body: JSON.stringify({
            amountCollected: toOptionalNumber(formState.amountCollected),
            paymentDate: formState.paymentDate || null,
            penaltyAmount: toNullableNumber(formState.penaltyAmount),
            receiptReference: formState.receiptReference.trim() || null,
          }),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        });
        const responsePayload = await response.json();

        if (!response.ok) {
          throw new Error(responsePayload.error?.message ?? "تعذر تحديث القسط");
        }

        onSuccess?.();
        router.refresh();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "حدث خطأ غير متوقع");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-5 rounded-2xl bg-surface-container-lowest p-5 ambient-shadow">
        <div>
          <h3 className="font-display text-title-lg text-on-surface">تسجيل دفعة</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">حدّث قيمة التحصيل وبيانات الدفع ليتم إعادة احتساب حالة القسط تلقائيا.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-surface-container-low p-4 text-body-md text-on-surface-variant">
            <div className="font-semibold text-on-surface">المستحق</div>
            <div className="mt-2 text-title-lg font-bold text-on-surface">{formatCurrency(initialValues.amountDue)}</div>
          </div>
          <div className="rounded-xl bg-surface-container-low p-4 text-body-md text-on-surface-variant">
            <div className="font-semibold text-on-surface">المتبقي (تقريبي)</div>
            <div className="mt-2 text-title-lg font-bold text-on-surface">{formatCurrency(approximateOutstanding)}</div>
          </div>

          <label className="space-y-2">
            <span className="text-label-lg font-semibold text-on-surface">المبلغ المحصل</span>
            <input
              className={fieldClassName}
              min={0}
              onChange={(event) => updateField("amountCollected", event.target.value)}
              step="0.01"
              type="number"
              value={formState.amountCollected}
            />
          </label>

          <label className="space-y-2">
            <span className="text-label-lg font-semibold text-on-surface">تاريخ الدفع</span>
            <input
              className={fieldClassName}
              onChange={(event) => updateField("paymentDate", event.target.value)}
              type="date"
              value={formState.paymentDate}
            />
          </label>

          <label className="space-y-2">
            <span className="text-label-lg font-semibold text-on-surface">مرجع الإيصال</span>
            <input
              className={fieldClassName}
              onChange={(event) => updateField("receiptReference", event.target.value)}
              value={formState.receiptReference}
            />
          </label>

          <label className="space-y-2">
            <span className="text-label-lg font-semibold text-on-surface">الغرامة</span>
            <input
              className={fieldClassName}
              min={0}
              onChange={(event) => updateField("penaltyAmount", event.target.value)}
              step="0.01"
              type="number"
              value={formState.penaltyAmount}
            />
          </label>
        </div>

        {error ? (
          <div className="rounded-xl bg-error-container px-4 py-3 text-body-md text-[#93000a]">{error}</div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button className={primaryButtonClassName} disabled={isPending} type="submit">
            {isPending ? "جار الحفظ..." : "حفظ الدفعة"}
          </button>
          {onCancel ? (
            <button className={secondaryButtonClassName} onClick={onCancel} type="button">
              إلغاء
            </button>
          ) : null}
        </div>
      </div>
    </form>
  );
}

function toOptionalNumber(value: string): number | undefined {
  const normalized = value.trim();

  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toNullableNumber(value: string): number | null {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
