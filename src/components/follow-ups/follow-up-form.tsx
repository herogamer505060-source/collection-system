"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type ContractOption = {
  id: string;
  label: string;
};

type FollowUpFormMode = "create" | "update";

type FollowUpFormState = {
  collectorUserId: string;
  contactType: "call" | "email" | "meeting" | "other" | "whatsapp";
  contractId: string;
  customerResponse: string;
  followUpDate: string;
  followUpStatus: "done" | "missed" | "open";
  nextActionDate: string;
  note: string;
  promiseDate: string;
  promisedToPay: boolean;
};

type FollowUpFormProps = {
  className?: string;
  contractOptions?: ContractOption[];
  customerId: string;
  customerLabel: string;
  defaultCollectorUserId?: string | null;
  initialValues?: Partial<FollowUpFormState>;
  mode: FollowUpFormMode;
  onCancel?: () => void;
  onSuccess?: () => void;
  submitLabel?: string;
  title?: string;
  followUpId?: string;
};

const contactTypeOptions: Array<{ label: string; value: FollowUpFormState["contactType"] }> = [
  { label: "مكالمة", value: "call" },
  { label: "واتساب", value: "whatsapp" },
  { label: "اجتماع", value: "meeting" },
  { label: "بريد إلكتروني", value: "email" },
  { label: "أخرى", value: "other" },
];

const followUpStatusOptions: Array<{ label: string; value: FollowUpFormState["followUpStatus"] }> = [
  { label: "مفتوح", value: "open" },
  { label: "مغلق", value: "done" },
  { label: "فائت", value: "missed" },
];

const fieldClassName =
  "w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface outline-none transition-all placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30";

const primaryButtonClassName =
  "gradient-primary rounded-xl px-5 py-3 text-body-md font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-60";

const secondaryButtonClassName =
  "rounded-xl bg-surface-container-high px-5 py-3 text-body-md font-semibold text-on-surface transition-all hover:bg-surface-container-highest";

export function FollowUpForm({
  className,
  contractOptions = [],
  customerId,
  customerLabel,
  defaultCollectorUserId,
  followUpId,
  initialValues,
  mode,
  onCancel,
  onSuccess,
  submitLabel,
  title,
}: FollowUpFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const defaultState = useMemo<FollowUpFormState>(
    () => ({
      collectorUserId: initialValues?.collectorUserId ?? defaultCollectorUserId ?? "",
      contactType: initialValues?.contactType ?? "call",
      contractId: initialValues?.contractId ?? "",
      customerResponse: initialValues?.customerResponse ?? "",
      followUpDate: initialValues?.followUpDate
        ? toDateTimeLocalValue(initialValues.followUpDate)
        : new Date().toISOString().slice(0, 16),
      followUpStatus: initialValues?.followUpStatus ?? "open",
      nextActionDate: initialValues?.nextActionDate ?? "",
      note: initialValues?.note ?? "",
      promiseDate: initialValues?.promiseDate ?? "",
      promisedToPay: initialValues?.promisedToPay ?? false,
    }),
    [defaultCollectorUserId, initialValues],
  );
  const [formState, setFormState] = useState<FollowUpFormState>(defaultState);

  function updateField<Key extends keyof FollowUpFormState>(key: Key, value: FollowUpFormState[Key]) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        setError(null);

        const payload =
          mode === "create"
            ? {
                collectorUserId: formState.collectorUserId || null,
                contactType: formState.contactType,
                contractId: formState.contractId || null,
                customerId,
                customerResponse: formState.customerResponse.trim() || null,
                followUpDate: new Date(formState.followUpDate).toISOString(),
                nextActionDate: formState.nextActionDate || null,
                note: formState.note,
                promiseDate: formState.promisedToPay ? formState.promiseDate || null : null,
                promisedToPay: formState.promisedToPay,
              }
            : {
                collectorUserId: formState.collectorUserId || null,
                customerResponse: formState.customerResponse.trim() || null,
                followUpStatus: formState.followUpStatus,
                nextActionDate: formState.nextActionDate || null,
                note: formState.note,
                promiseDate: formState.promisedToPay ? formState.promiseDate || null : null,
                promisedToPay: formState.promisedToPay,
              };
        const response = await fetch(mode === "create" ? "/api/follow-ups" : `/api/follow-ups/${followUpId}`, {
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
          method: mode === "create" ? "POST" : "PATCH",
        });
        const responsePayload = await response.json();

        if (!response.ok) {
          throw new Error(responsePayload.error?.message ?? "تعذر حفظ المتابعة");
        }

        onSuccess?.();
        router.refresh();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "حدث خطأ غير متوقع");
      }
    });
  }

  return (
    <form className={className} onSubmit={handleSubmit}>
      <div className="space-y-5 rounded-2xl bg-surface-container-lowest p-5 ambient-shadow">
        <div>
          <h3 className="font-display text-title-lg text-on-surface">
            {title ?? (mode === "create" ? `إضافة متابعة للعميل ${customerLabel}` : `تعديل متابعة ${customerLabel}`)}
          </h3>
          <p className="mt-2 text-body-md text-on-surface-variant">
            {mode === "create"
              ? "سجل تفاصيل التواصل والوعد القادم وخطوة المتابعة التالية."
              : "حدث الملاحظات أو حالة المتابعة أو موعد الوعد والخطوة التالية."}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {mode === "create" ? (
            <label className="space-y-2">
              <span className="text-label-lg font-semibold text-on-surface">نوع التواصل</span>
              <select
                className={fieldClassName}
                onChange={(event) => updateField("contactType", event.target.value as FollowUpFormState["contactType"])}
                value={formState.contactType}
              >
                {contactTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="space-y-2">
              <span className="text-label-lg font-semibold text-on-surface">حالة المتابعة</span>
              <select
                className={fieldClassName}
                onChange={(event) => updateField("followUpStatus", event.target.value as FollowUpFormState["followUpStatus"])}
                value={formState.followUpStatus}
              >
                {followUpStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {mode === "create" ? (
            <label className="space-y-2">
              <span className="text-label-lg font-semibold text-on-surface">العقد المرتبط</span>
              <select
                className={fieldClassName}
                onChange={(event) => updateField("contractId", event.target.value)}
                value={formState.contractId}
              >
                <option value="">بدون عقد محدد</option>
                {contractOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="space-y-2 lg:col-span-2">
            <span className="text-label-lg font-semibold text-on-surface">ملاحظة المتابعة</span>
            <textarea
              className={`min-h-[120px] ${fieldClassName}`}
              onChange={(event) => updateField("note", event.target.value)}
              value={formState.note}
            />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-label-lg font-semibold text-on-surface">رد العميل</span>
            <textarea
              className={`min-h-[96px] ${fieldClassName}`}
              onChange={(event) => updateField("customerResponse", event.target.value)}
              value={formState.customerResponse}
            />
          </label>

          {mode === "create" ? (
            <label className="space-y-2">
              <span className="text-label-lg font-semibold text-on-surface">تاريخ ووقت المتابعة</span>
              <input
                className={fieldClassName}
                onChange={(event) => updateField("followUpDate", event.target.value)}
                type="datetime-local"
                value={formState.followUpDate}
              />
            </label>
          ) : null}

          <label className="space-y-2">
            <span className="text-label-lg font-semibold text-on-surface">تاريخ الإجراء التالي</span>
            <input
              className={fieldClassName}
              onChange={(event) => updateField("nextActionDate", event.target.value)}
              type="date"
              value={formState.nextActionDate}
            />
          </label>

          <label className="flex items-center gap-3 rounded-xl bg-surface-container-low px-4 py-3 text-body-md text-on-surface">
            <input
              className="h-4 w-4 rounded border-outline-variant/40 text-primary focus:ring-[#8ad3d7]/30"
              checked={formState.promisedToPay}
              onChange={(event) => {
                const nextValue = event.target.checked;
                updateField("promisedToPay", nextValue);

                if (!nextValue) {
                  updateField("promiseDate", "");
                }
              }}
              type="checkbox"
            />
            <span>وعد بالسداد</span>
          </label>

          <label className="space-y-2">
            <span className="text-label-lg font-semibold text-on-surface">تاريخ الوعد</span>
            <input
              className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-60`}
              disabled={!formState.promisedToPay}
              onChange={(event) => updateField("promiseDate", event.target.value)}
              type="date"
              value={formState.promiseDate}
            />
          </label>
        </div>

        {error ? (
          <div className="rounded-xl bg-error-container px-4 py-3 text-body-md text-[#93000a]">{error}</div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button className={primaryButtonClassName} disabled={isPending} type="submit">
            {submitLabel ?? (mode === "create" ? "حفظ المتابعة" : "تحديث المتابعة")}
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

function toDateTimeLocalValue(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 16);
  }

  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
