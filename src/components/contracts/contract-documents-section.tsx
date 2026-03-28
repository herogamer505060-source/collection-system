"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { StatusBadge } from "@/components/ui/status-badge";
import { formatEgyptDateTime } from "@/lib/dates/egypt";
import type { ContractDocumentListItem } from "@/server/queries/contracts/get-contract-documents";

import { DocumentUploadForm } from "./document-upload-form";

type ContractDocumentsSectionProps = {
  canUpload: boolean;
  contractId: string;
  documents: ContractDocumentListItem[];
};

export function ContractDocumentsSection({ canUpload, contractId, documents }: ContractDocumentsSectionProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busyDocumentId, setBusyDocumentId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDownload(documentId: string) {
    startTransition(async () => {
      try {
        setFeedback(null);
        setBusyDocumentId(documentId);

        const response = await fetch(`/api/contracts/${contractId}/documents/${documentId}`);
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error?.message ?? "تعذر تحميل المستند");
        }

        if (payload?.signedUrl) {
          window.open(payload.signedUrl, "_blank", "noopener,noreferrer");
        }
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
      } finally {
        setBusyDocumentId(null);
      }
    });
  }

  function handleDelete(documentId: string) {
    if (!window.confirm("هل أنت متأكد من حذف هذا المستند؟")) {
      return;
    }

    startTransition(async () => {
      try {
        setFeedback(null);
        setBusyDocumentId(documentId);

        const response = await fetch(`/api/contracts/${contractId}/documents/${documentId}`, {
          method: "DELETE",
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error?.message ?? "تعذر حذف المستند");
        }

        setFeedback("تم حذف المستند بنجاح");
        router.refresh();
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
      } finally {
        setBusyDocumentId(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      {canUpload ? <DocumentUploadForm contractId={contractId} /> : null}

      {feedback ? (
        <div className="rounded-xl bg-surface-container-low px-4 py-3 text-body-md text-on-surface-variant">
          {feedback}
        </div>
      ) : null}

      <div className="space-y-3">
        {documents.length > 0 ? (
          documents.map((document) => {
            const isBusy = isPending && busyDocumentId === document.documentId;

            return (
              <article className="rounded-2xl bg-surface-container-low p-4" key={document.documentId}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge variant={getDocumentTypeVariant(document.documentType)}>
                        {getDocumentTypeLabel(document.documentType)}
                      </StatusBadge>
                      <span className="font-semibold text-on-surface">{document.fileName}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-label-lg text-on-surface-variant">
                      <span>الحجم: {formatFileSize(document.fileSizeBytes)}</span>
                      <span>رُفع بواسطة: {document.uploadedByName}</span>
                      <span>التاريخ: {formatEgyptDateTime(document.createdAt)}</span>
                    </div>
                    {document.notes ? (
                      <p className="text-body-md leading-7 text-on-surface">{document.notes}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      className="rounded-xl bg-surface-container-high px-4 py-3 text-body-md font-semibold text-on-surface transition-all hover:bg-surface-container-highest disabled:opacity-60"
                      disabled={isBusy}
                      onClick={() => handleDownload(document.documentId)}
                      type="button"
                    >
                      {isBusy ? "جار التحميل..." : "تحميل"}
                    </button>
                    {canUpload ? (
                      <button
                        className="rounded-xl bg-error-container px-4 py-3 text-body-md font-semibold text-[#93000a] disabled:opacity-60"
                        disabled={isBusy}
                        onClick={() => handleDelete(document.documentId)}
                        type="button"
                      >
                        {isBusy ? "جار الحذف..." : "حذف"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-xl bg-surface-container-low px-4 py-6 text-body-md text-on-surface-variant">
            لا توجد مستندات مرفقة لهذا العقد بعد.
          </div>
        )}
      </div>
    </div>
  );
}

function getDocumentTypeLabel(documentType: string): string {
  switch (documentType) {
    case "contract":
      return "عقد";
    case "amendment":
      return "ملحق";
    case "receipt":
      return "إيصال";
    default:
      return "أخرى";
  }
}

function getDocumentTypeVariant(documentType: string): "danger" | "info" | "neutral" | "success" | "warning" {
  switch (documentType) {
    case "contract":
      return "info";
    case "amendment":
      return "warning";
    case "receipt":
      return "success";
    default:
      return "neutral";
  }
}

function formatFileSize(fileSizeBytes: number): string {
  if (fileSizeBytes >= 1024 * 1024) {
    return `${(fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  if (fileSizeBytes >= 1024) {
    return `${(fileSizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${fileSizeBytes} B`;
}
