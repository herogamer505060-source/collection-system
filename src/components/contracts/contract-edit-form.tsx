"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ContractEditFormProps = {
  contractId: string;
  initialValues: {
    collectorUserId?: string | null;
    contractNotes?: string | null;
    contractStatus: string;
    deliveryDate?: string | null;
  };
  onCancel?: () => void;
  onSuccess?: () => void;
  profileOptions: { id: string; label: string }[];
};

type ContractEditFormState = {
  collectorUserId: string;
  contractNotes: string;
  contractStatus: string;
  deliveryDate: string;
};

const CONTRACT_STATUS_OPTIONS = [
  { label: "نشط", value: "active" },
  { label: "مغلق", value: "closed" },
  { label: "ملغي", value: "cancelled" },
  { label: "معلق", value: "suspended" },
] as const;

const fieldClassName =
  "w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface outline-none transition-all placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30";

const primaryButtonClassName =
  "gradient-primary rounded-xl px-5 py-3 text-body-md font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-60";

const secondaryButtonClassName =
  "rounded-xl bg-surface-container-high px-5 py-3 text-body-md font-semibold text-on-surface transition-all hover:bg-surface-container-highest";

export function ContractEditForm({
  contractId,
  initialValues,
  onCancel,
  onSuccess,
  profileOptions,
}: ContractEditFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState<ContractEditFormState>({
    collectorUserId: initialValues.collectorUserId ?? "",
    contractNotes: initialValues.contractNotes ?? "",
    contractStatus: initialValues.contractStatus,
    deliveryDate: initialValues.deliveryDate ?? "",
  });

  function updateField<Key extends keyof ContractEditFormState>(
    key: Key,
    value: ContractEditFormState[Key],
  ) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        setError(null);

        const response = await fetch(`/api/contracts/${contractId}`, {
          body: JSON.stringify({
            collectorUserId: formState.collectorUserId || null,
            contractNotes: formState.contractNotes.trim() || null,
            contractStatus: formState.contractStatus,
            deliveryDate: formState.deliveryDate || null,
          }),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        });
        const responsePayload = await response.json();

        if (!response.ok) {
          throw new Error(responsePayload.error?.message ?? "تعذر تحديث بيانات العقد");
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
          <h3 className="font-display text-title-lg text-on-surface">تعديل بيانات العقد</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">يمكنك تحديث الملاحظات وتاريخ التسليم والمحصل المسؤول وحالة العقد.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-label-lg font-semibold text-on-surface">ملاحظات العقد</span>
            <textarea
              className={`min-h-[120px] ${fieldClassName}`}
              onChange={(event) => updateField("contractNotes", event.target.value)}
              value={formState.contractNotes}
            />
          </label>

          <label className="space-y-2">
            <span className="text-label-lg font-semibold text-on-surface">تاريخ التسليم</span>
            <input
              className={fieldClassName}
              onChange={(event) => updateField("deliveryDate", event.target.value)}
              type="date"
              value={formState.deliveryDate}
            />
          </label>

          <label className="space-y-2">
            <span className="text-label-lg font-semibold text-on-surface">المحصل المسؤول</span>
            <select
              className={fieldClassName}
              onChange={(event) => updateField("collectorUserId", event.target.value)}
              value={formState.collectorUserId}
            >
              <option value="">بدون تعيين</option>
              {profileOptions.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-label-lg font-semibold text-on-surface">حالة العقد</span>
            <select
              className={fieldClassName}
              onChange={(event) => updateField("contractStatus", event.target.value)}
              value={formState.contractStatus}
            >
              {CONTRACT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error ? (
          <div className="rounded-xl bg-error-container px-4 py-3 text-body-md text-[#93000a]">{error}</div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button className={primaryButtonClassName} disabled={isPending} type="submit">
            حفظ التعديلات
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
