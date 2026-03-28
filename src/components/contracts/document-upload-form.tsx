"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type DocumentType = "amendment" | "contract" | "other" | "receipt";

type DocumentUploadFormProps = {
  contractId: string;
};

const DOCUMENT_TYPE_OPTIONS: Array<{ label: string; value: DocumentType }> = [
  { label: "عقد", value: "contract" },
  { label: "ملحق", value: "amendment" },
  { label: "إيصال", value: "receipt" },
  { label: "أخرى", value: "other" },
];

const fieldClassName =
  "w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30";

export function DocumentUploadForm({ contractId }: DocumentUploadFormProps) {
  const router = useRouter();
  const [documentType, setDocumentType] = useState<DocumentType>("contract");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setError("اختر ملف PDF قبل الرفع");
      return;
    }

    const form = event.currentTarget;

    startTransition(async () => {
      try {
        setError(null);
        setFeedback(null);

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("documentType", documentType);
        formData.append("notes", notes);

        const response = await fetch(`/api/contracts/${contractId}/documents/upload`, {
          body: formData,
          method: "POST",
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error?.message ?? "تعذر رفع المستند");
        }

        setFeedback("تم رفع المستند بنجاح");
        setDocumentType("contract");
        setNotes("");
        setSelectedFile(null);
        form.reset();
        router.refresh();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "حدث خطأ غير متوقع");
      }
    });
  }

  return (
    <form className="space-y-4 rounded-2xl bg-surface-container-low p-4" onSubmit={handleSubmit}>
      <div>
        <h3 className="font-display text-title-lg text-on-surface">رفع مستند جديد</h3>
        <p className="mt-1 text-body-md text-on-surface-variant">
          ارفع نسخة PDF للعقد أو الملحقات أو الإيصالات مع إمكانية إضافة ملاحظات مرجعية.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-label-lg font-semibold text-on-surface">نوع المستند</span>
          <select className={fieldClassName} onChange={(event) => setDocumentType(event.target.value as DocumentType)} value={documentType}>
            {DOCUMENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-label-lg font-semibold text-on-surface">ملف PDF</span>
          <input
            accept=".pdf,application/pdf"
            className={`${fieldClassName} file:ml-4 file:rounded-lg file:border-0 file:bg-surface-container-high file:px-4 file:py-2 file:text-label-lg file:font-semibold file:text-on-surface`}
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            type="file"
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-label-lg font-semibold text-on-surface">ملاحظات</span>
        <textarea
          className={`min-h-[96px] ${fieldClassName}`}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="ملاحظة اختيارية عن هذا المستند"
          value={notes}
        />
      </label>

      {error ? <div className="rounded-xl bg-error-container px-4 py-3 text-body-md text-[#93000a]">{error}</div> : null}
      {feedback ? <div className="rounded-xl bg-[#d0f5f5] px-4 py-3 text-body-md text-[#004f4f]">{feedback}</div> : null}

      <button
        className="gradient-primary rounded-xl px-5 py-3 text-body-md font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "جار رفع المستند..." : "رفع المستند"}
      </button>
    </form>
  );
}
