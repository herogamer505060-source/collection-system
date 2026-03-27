"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ImportIssuesTable } from "@/components/imports/import-issues-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getImportBatchTypeLabel } from "@/features/imports/presentation";
import type { ImportBatchType, ImportPreviewPayload } from "@/features/imports/types";
import { formatInteger } from "@/lib/formatting/numbers";

type ImportPreviewCardProps = {
  batchType: ImportBatchType;
  preview: ImportPreviewPayload;
};

export function ImportPreviewCard({ batchType, preview }: ImportPreviewCardProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runAction(action: "approve" | "reject") {
    startTransition(async () => {
      try {
        setFeedback(null);

        const response = await fetch(`/api/imports/${preview.batchId}/${action}`, {
          body: action === "reject" ? JSON.stringify({ reason: window.prompt("سبب الرفض") ?? undefined }) : undefined,
          headers: action === "reject" ? { "Content-Type": "application/json" } : undefined,
          method: "POST",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error?.message ?? "تعذر تنفيذ الإجراء المطلوب");
        }

        setFeedback(action === "approve" ? "تم اعتماد الدفعة" : "تم رفض الدفعة");
        router.push(`/imports/${preview.batchId}`);
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
            <h3 className="font-display text-headline-sm font-bold text-on-surface">معاينة الدفعة {preview.batchId.slice(0, 8)}</h3>
            <StatusBadge variant="info">{getImportBatchTypeLabel(batchType)}</StatusBadge>
            <StatusBadge variant="success">جاهز للمراجعة</StatusBadge>
          </div>
          <p className="mt-2 text-body-md text-on-surface-variant">
            راجع العينة والمشكلات، ثم اعتمد الدفعة أو انتقل إلى صفحة التفاصيل للمراجعة الكاملة.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="gradient-primary rounded-xl px-4 py-3 text-body-md font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-60"
            disabled={isPending}
            onClick={() => runAction("approve")}
            type="button"
          >
            اعتماد الآن
          </button>
          <button
            className="rounded-xl bg-error-container px-4 py-3 text-body-md font-semibold text-[#93000a] transition-all hover:opacity-90 disabled:opacity-60"
            disabled={isPending}
            onClick={() => runAction("reject")}
            type="button"
          >
            رفض الدفعة
          </button>
          <Link
            className="rounded-xl bg-surface-container-high px-4 py-3 text-body-md font-semibold text-on-surface transition-all hover:bg-surface-container-highest"
            href={`/imports/${preview.batchId}`}
          >
            فتح التفاصيل
          </Link>
        </div>
      </div>

      {feedback ? (
        <div className="rounded-xl bg-surface-container-low px-4 py-3 text-body-md text-on-surface-variant">
          {feedback}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PreviewMetric label="إجمالي الصفوف" value={preview.counts.totalRows} />
        <PreviewMetric label="صفوف صالحة" value={preview.counts.validRows} />
        <PreviewMetric label="صفوف متخطاة" value={preview.counts.skippedRows} />
        <PreviewMetric label="صفوف بها مشكلات" value={preview.counts.issueRows} />
      </div>

      <div className="rounded-xl bg-surface-container-low p-4">
        <h4 className="font-display text-title-lg text-on-surface">عينة من الصفوف</h4>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {preview.sampleRows.map((row) => (
            <div className="rounded-xl bg-surface-container-lowest px-4 py-3 ambient-shadow" key={row.sourceRowNumber}>
              <div className="text-label-lg font-semibold text-on-surface-variant">الصف {row.sourceRowNumber}</div>
              <div className="mt-2 font-semibold text-on-surface">{row.project ?? "بدون مشروع"}</div>
              <div className="mt-1 text-body-md text-on-surface-variant">{row.customerName ?? "بدون عميل"}</div>
              <div className="mt-2 text-body-md text-on-surface">الوحدة: {row.unitCode ?? "-"}</div>
              <div className="mt-1 text-body-md text-on-surface">القيمة: {formatInteger(row.amountDue ?? 0)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-surface-container-low p-4">
        <h4 className="font-display text-title-lg text-on-surface">ملخص التغييرات المتوقعة</h4>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(preview.changeSummary).map(([key, value]) => (
            <StatusBadge key={key} variant="neutral">
              {formatPreviewChangeKey(key)}: {formatInteger(value ?? 0)}
            </StatusBadge>
          ))}
        </div>
      </div>

      <ImportIssuesTable
        issues={preview.issues.map((issue) => ({
          id: issue.id,
          issueType: issue.issueType,
          messageAr: issue.messageAr,
          rawValue: issue.rawValue,
          severity: issue.severity,
          sourceRowNumber: issue.sourceRowNumber,
        }))}
      />
    </section>
  );
}

function PreviewMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface-container-low p-4">
      <div className="text-label-lg text-on-surface-variant">{label}</div>
      <div className="mt-2 font-display text-headline-sm text-on-surface">{formatInteger(value)}</div>
    </div>
  );
}

function formatPreviewChangeKey(key: string): string {
  const labels: Record<string, string> = {
    contractsToCreate: "عقود جديدة",
    contractsToUpdate: "عقود محدثة",
    customersToCreate: "عملاء جدد",
    customersToMatch: "عملاء مطابقون",
    installmentsToCreate: "أقساط جديدة",
    installmentsToUpdate: "أقساط محدثة",
    linksToCreate: "روابط جديدة",
    unitsToCreate: "وحدات جديدة",
    unitsToUpdate: "وحدات محدثة",
  };

  return labels[key] ?? key;
}
