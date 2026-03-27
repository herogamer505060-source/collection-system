"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type CustomerEditFormProps = {
  customerId: string;
  initialValues: {
    customerName: string;
    email?: string | null;
    mobile?: string | null;
    nationalId?: string | null;
    notes?: string | null;
  };
  onCancel?: () => void;
  onSuccess?: () => void;
};

type CustomerEditFormState = {
  customerName: string;
  email: string;
  mobile: string;
  nationalId: string;
  notes: string;
};

const fieldClassName =
  "w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface outline-none transition-all placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30";

const primaryButtonClassName =
  "gradient-primary rounded-xl px-5 py-3 text-body-md font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-60";

const secondaryButtonClassName =
  "rounded-xl bg-surface-container-high px-5 py-3 text-body-md font-semibold text-on-surface transition-all hover:bg-surface-container-highest";

export function CustomerEditForm({ customerId, initialValues, onCancel, onSuccess }: CustomerEditFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState<CustomerEditFormState>({
    customerName: initialValues.customerName,
    email: initialValues.email ?? "",
    mobile: initialValues.mobile ?? "",
    nationalId: initialValues.nationalId ?? "",
    notes: initialValues.notes ?? "",
  });

  function updateField<Key extends keyof CustomerEditFormState>(
    key: Key,
    value: CustomerEditFormState[Key],
  ) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        setError(null);

        const response = await fetch(`/api/customers/${customerId}`, {
          body: JSON.stringify({
            customerName: formState.customerName,
            email: formState.email.trim() || null,
            mobile: formState.mobile.trim() || null,
            nationalId: formState.nationalId.trim() || null,
            notes: formState.notes.trim() || null,
          }),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        });
        const responsePayload = await response.json();

        if (!response.ok) {
          throw new Error(responsePayload.error?.message ?? "تعذر تحديث بيانات العميل");
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
          <h3 className="font-display text-title-lg text-on-surface">تعديل بيانات العميل</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">حدّث بيانات التواصل والملاحظات المرتبطة بملف العميل.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-label-lg font-semibold text-on-surface">اسم العميل</span>
            <input
              className={fieldClassName}
              onChange={(event) => updateField("customerName", event.target.value)}
              value={formState.customerName}
            />
          </label>

          <label className="space-y-2">
            <span className="text-label-lg font-semibold text-on-surface">رقم الجوال</span>
            <input
              className={fieldClassName}
              onChange={(event) => updateField("mobile", event.target.value)}
              value={formState.mobile}
            />
          </label>

          <label className="space-y-2">
            <span className="text-label-lg font-semibold text-on-surface">البريد الإلكتروني</span>
            <input
              className={fieldClassName}
              onChange={(event) => updateField("email", event.target.value)}
              type="email"
              value={formState.email}
            />
          </label>

          <label className="space-y-2">
            <span className="text-label-lg font-semibold text-on-surface">الرقم القومي</span>
            <input
              className={fieldClassName}
              onChange={(event) => updateField("nationalId", event.target.value)}
              value={formState.nationalId}
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-label-lg font-semibold text-on-surface">ملاحظات</span>
            <textarea
              className={`min-h-[120px] ${fieldClassName}`}
              onChange={(event) => updateField("notes", event.target.value)}
              value={formState.notes}
            />
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
