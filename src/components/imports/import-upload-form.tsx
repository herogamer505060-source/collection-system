"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { ImportPreviewCard } from "@/components/imports/import-preview-card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getImportBatchTypeLabel,
  getImportStatusLabel,
  getImportStatusVariant,
} from "@/features/imports/presentation";
import type { ImportBatchType, ImportPreviewPayload } from "@/features/imports/types";
import { formatEgyptDateTime } from "@/lib/dates/egypt";

type RecentBatch = {
  batchId: string;
  batchType: ImportBatchType;
  startedAt: string;
  status: string;
};

type ImportUploadFormProps = {
  canManage: boolean;
  recentBatches: RecentBatch[];
};

const importTypeOptions: Array<{ description: string; value: ImportBatchType }> = [
  { description: "رفع ملف الأقساط والتعامل مع المطابقة والعقود", value: "installments" },
  { description: "تحديث مرجع الوحدات المباعة وأسعار التعاقد", value: "sold_units" },
  { description: "تحديث مرجع الوحدات المتاحة وأسعار القائمة", value: "available_units" },
];

export function ImportUploadForm({ canManage, recentBatches }: ImportUploadFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreviewPayload | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImportType, setSelectedImportType] = useState<ImportBatchType>("installments");
  const [isPending, startTransition] = useTransition();
  const selectedOption = useMemo(
    () => importTypeOptions.find((option) => option.value === selectedImportType),
    [selectedImportType],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setError("اختر ملف Excel قبل المتابعة");
      return;
    }

    startTransition(async () => {
      try {
        setError(null);
        setPreview(null);

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("importType", selectedImportType);

        const uploadResponse = await fetch("/api/imports/upload", {
          body: formData,
          method: "POST",
        });
        const uploadPayload = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadPayload.error?.message ?? "تعذر رفع الملف");
        }

        const previewResponse = await fetch(`/api/imports/${uploadPayload.batchId}/preview`, {
          method: "POST",
        });
        const previewPayload = await previewResponse.json();

        if (!previewResponse.ok) {
          throw new Error(previewPayload.error?.message ?? "تعذر إنشاء المعاينة");
        }

        setPreview(previewPayload);
        router.refresh();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "حدث خطأ غير متوقع");
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-surface-container-lowest p-5 ambient-shadow">
        {canManage ? (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
              <label className="space-y-2">
                <span className="text-label-lg font-semibold text-on-surface">نوع الاستيراد</span>
                <select
                  className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30"
                  onChange={(event) => setSelectedImportType(event.target.value as ImportBatchType)}
                  value={selectedImportType}
                >
                  {importTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {getImportBatchTypeLabel(option.value)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-label-lg font-semibold text-on-surface">ملف Excel</span>
                <input
                  accept=".xlsx"
                  className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface file:ml-4 file:rounded-lg file:border-0 file:bg-surface-container-high file:px-4 file:py-2 file:text-label-lg file:font-semibold file:text-on-surface focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                  type="file"
                />
              </label>
            </div>

            <div className="rounded-xl bg-surface-container-low px-4 py-3 text-body-md text-on-surface-variant">
              {selectedOption?.description}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                className="gradient-primary rounded-xl px-5 py-3 text-body-md font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-60"
                disabled={isPending}
                type="submit"
              >
                {isPending ? "جار رفع الملف ومعالجة المعاينة..." : "رفع الملف وإنشاء المعاينة"}
              </button>
              <Link
                className="rounded-xl bg-surface-container-high px-5 py-3 text-body-md font-semibold text-on-surface transition-all hover:bg-surface-container-highest"
                href="/import-issues"
              >
                فتح سجل المشكلات
              </Link>
            </div>

            {error ? (
              <div className="rounded-xl bg-error-container px-4 py-3 text-body-md text-[#93000a]">{error}</div>
            ) : null}
          </form>
        ) : (
          <div className="rounded-xl bg-surface-container-low px-4 py-4 text-body-md text-on-surface-variant">
            لديك صلاحية قراءة فقط. يمكنك متابعة الدفعات السابقة وسجل المشكلات دون رفع ملفات جديدة.
          </div>
        )}
      </section>

      {preview ? <ImportPreviewCard batchType={selectedImportType} preview={preview} /> : null}

      <section className="rounded-2xl bg-surface-container-lowest p-5 ambient-shadow">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-title-lg text-on-surface">أحدث الدفعات</h3>
            <p className="mt-2 text-body-md text-on-surface-variant">افتح أي دفعة لمراجعة التفاصيل أو متابعة حالتها.</p>
          </div>
          <StatusBadge variant="neutral">{recentBatches.length} دفعة</StatusBadge>
        </div>

        <div className="mt-4 grid gap-3">
          {recentBatches.length > 0 ? (
            recentBatches.map((batch) => (
              <Link
                className="flex flex-col gap-3 rounded-xl bg-surface-container-low px-4 py-4 transition hover:bg-surface-container-high"
                href={`/imports/${batch.batchId}`}
                key={batch.batchId}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-on-surface">دفعة {batch.batchId.slice(0, 8)}</span>
                  <StatusBadge variant={getImportStatusVariant(batch.status)}>
                    {getImportStatusLabel(batch.status)}
                  </StatusBadge>
                  <StatusBadge variant="info">{getImportBatchTypeLabel(batch.batchType)}</StatusBadge>
                </div>
                <div className="text-body-md text-on-surface-variant">بدأت في {formatEgyptDateTime(batch.startedAt)}</div>
              </Link>
            ))
          ) : (
            <div className="rounded-xl bg-surface-container-low px-4 py-6 text-body-md text-on-surface-variant">
              لا توجد دفعات استيراد حتى الآن.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
