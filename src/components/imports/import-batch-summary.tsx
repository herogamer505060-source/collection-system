"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { StatusBadge } from "@/components/ui/status-badge";
import {
  getImportBatchTypeLabel,
  getImportStatusLabel,
  getImportStatusVariant,
} from "@/features/imports/presentation";
import type { ImportBatchDetail } from "@/server/queries/imports/get-import-batch-detail";
import { formatInteger } from "@/lib/formatting/numbers";

type ImportBatchSummaryProps = {
  batch: ImportBatchDetail;
  canManage: boolean;
};

export function ImportBatchSummary({ batch, canManage }: ImportBatchSummaryProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runBatchAction(action: "approve" | "preview" | "reject") {
    if (action === "approve" && !window.confirm("هل أنت متأكد من اعتماد هذه الدفعة؟ سيتم تطبيق جميع الصفوف الصالحة على قاعدة البيانات.")) {
      return;
    }

    startTransition(async () => {
      try {
        setFeedback(null);

        const response = await fetch(`/api/imports/${batch.batchId}/${action}`, {
          body: action === "reject" ? JSON.stringify({ reason: window.prompt("سبب الرفض") ?? undefined }) : undefined,
          headers: action === "reject" ? { "Content-Type": "application/json" } : undefined,
          method: "POST",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error?.message ?? "تعذر تنفيذ الإجراء المطلوب");
        }

        setFeedback(
          action === "approve"
            ? "تم اعتماد الدفعة بنجاح"
            : action === "reject"
              ? "تم رفض الدفعة"
              : "تم تحديث المعاينة بنجاح",
        );
        router.refresh();
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
      }
    });
  }

  return (
    <section className="space-y-5 rounded-2xl bg-surface-container-lowest p-5 ambient-shadow">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-headline-sm font-bold text-on-surface">دفعة {batch.batchId.slice(0, 8)}</h2>
            <StatusBadge variant={getImportStatusVariant(batch.status)}>
              {getImportStatusLabel(batch.status)}
            </StatusBadge>
            <StatusBadge variant="info">{getImportBatchTypeLabel(batch.batchType)}</StatusBadge>
          </div>
          <p className="mt-2 text-body-md text-on-surface-variant">
            عدد الملفات: {formatInteger(batch.files.length)} - الأعمدة المكتشفة: {formatInteger(batch.detectedColumns?.length ?? 0)}
          </p>
        </div>

        {canManage ? (
          <div className="flex flex-wrap gap-3">
            {batch.status === "uploaded" ? (
              <button
                className="gradient-primary rounded-xl px-4 py-3 text-body-md font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-60"
                disabled={isPending}
                onClick={() => runBatchAction("preview")}
                type="button"
              >
                تشغيل المعاينة
              </button>
            ) : null}
            {batch.status === "ready_for_review" ? (
              <>
                <button
                  className="gradient-primary rounded-xl px-4 py-3 text-body-md font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-60"
                  disabled={isPending}
                  onClick={() => runBatchAction("approve")}
                  type="button"
                >
                  اعتماد الدفعة
                </button>
                <button
                  className="rounded-xl bg-error-container px-4 py-3 text-body-md font-semibold text-[#93000a] transition-all hover:opacity-90 disabled:opacity-60"
                  disabled={isPending}
                  onClick={() => runBatchAction("reject")}
                  type="button"
                >
                  رفض الدفعة
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {feedback ? (
        <div className="rounded-xl bg-surface-container-low px-4 py-3 text-body-md text-on-surface-variant">
          {feedback}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="إجمالي الصفوف" value={batch.counts.rowsTotal} />
        <MetricCard label="صفوف صالحة" value={batch.counts.rowsValid} />
        <MetricCard label="صفوف مستوردة" value={batch.counts.rowsImported} />
        <MetricCard label="صفوف محدثة" value={batch.counts.rowsUpdated} />
        <MetricCard label="صفوف متخطاة" value={batch.counts.rowsSkipped} />
        <MetricCard label="عدد المشكلات" value={batch.counts.issueCount} />
      </div>

      {batch.changeSummary && typeof batch.changeSummary === "object" ? (
        <div className="rounded-xl bg-surface-container-low p-4">
          <h3 className="font-display text-title-lg text-on-surface">ملخص التغييرات المتوقعة</h3>
          <dl className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Object.entries(batch.changeSummary as Record<string, unknown>).map(([key, value]) => (
              <div className="rounded-xl bg-surface-container-lowest px-4 py-3 ambient-shadow" key={key}>
                <dt className="text-label-lg font-semibold text-on-surface-variant">{formatChangeSummaryKey(key)}</dt>
                <dd className="mt-2 text-title-lg font-bold text-on-surface">{formatInteger(Number(value ?? 0))}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl bg-surface-container-low p-4">
          <h3 className="font-display text-title-lg text-on-surface">الأعمدة المكتشفة</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {(batch.detectedColumns ?? []).map((column) => (
              <StatusBadge key={column} variant="neutral">
                {column}
              </StatusBadge>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-low p-4">
          <h3 className="font-display text-title-lg text-on-surface">الملفات المرتبطة</h3>
          <div className="mt-4 space-y-3">
            {batch.files.map((file) => (
              <div className="rounded-xl bg-surface-container-lowest px-4 py-3 ambient-shadow" key={file.fileId}>
                <div className="font-semibold text-on-surface">{file.fileName}</div>
                <div className="mt-1 text-body-md text-on-surface-variant">الشيت: {file.sheetName ?? "غير محدد"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface-container-low p-4">
      <div className="text-label-lg text-on-surface-variant">{label}</div>
      <div className="mt-2 font-display text-headline-sm text-on-surface">{formatInteger(value)}</div>
    </div>
  );
}

function formatChangeSummaryKey(key: string): string {
  const labels: Record<string, string> = {
    contractsToCreate: "عقود جديدة",
    contractsToUpdate: "عقود محدثة",
    customersToCreate: "عملاء جدد",
    customersToMatch: "عملاء مطابقون",
    installmentsToCreate: "أقساط جديدة",
    installmentsToUpdate: "أقساط محدثة",
    linksToCreate: "روابط وحدات جديدة",
    unitsToCreate: "وحدات جديدة",
    unitsToUpdate: "وحدات محدثة",
  };

  return labels[key] ?? key;
}
