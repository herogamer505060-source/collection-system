"use client";

import { useMemo, useState, useTransition } from "react";

type ProjectOption = { id: string; label: string };
type ContractOption = { id: string; label: string };

type WhatsAppManualSendFormProps = {
  contractOptions: ContractOption[];
  customerId: string;
  customerName: string;
  projectOptions: ProjectOption[];
};

const fieldClassName =
  "w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30";

export function WhatsAppManualSendForm({
  contractOptions,
  customerId,
  customerName,
  projectOptions,
}: WhatsAppManualSendFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [projectId, setProjectId] = useState(projectOptions[0]?.id ?? "");
  const [contractId, setContractId] = useState(contractOptions[0]?.id ?? "");
  const [templateName, setTemplateName] = useState("manual_follow_up");
  const [messagePurpose, setMessagePurpose] = useState<"installment_due_7d" | "manual_follow_up" | "other">("manual_follow_up");
  const [languageCode, setLanguageCode] = useState("ar");
  const [paramOne, setParamOne] = useState(customerName);
  const [paramTwo, setParamTwo] = useState("");
  const [paramThree, setParamThree] = useState("");
  const [paramFour, setParamFour] = useState("");

  const templateParams = useMemo(
    () =>
      [paramOne, paramTwo, paramThree, paramFour]
        .map((text) => text.trim())
        .filter(Boolean)
        .map((text) => ({ text, type: "text" as const })),
    [paramFour, paramOne, paramThree, paramTwo],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        setError(null);
        setFeedback(null);

        if (!projectId) throw new Error("اختر المشروع المرتبط بالرسالة");
        if (!templateName.trim()) throw new Error("اكتب اسم Template معتمد في Meta");

        const response = await fetch("/api/whatsapp/send", {
          body: JSON.stringify({
            contractId: contractId || null,
            customerId,
            languageCode,
            messagePurpose,
            projectId,
            templateName: templateName.trim(),
            templateParams,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error?.message ?? "تعذر إرسال رسالة واتساب");
        }

        setFeedback(payload?.deduped ? "تم تجاهل الرسالة لأنها مكررة بالفعل." : "تم إرسال الرسالة بنجاح.");
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "حدث خطأ غير متوقع");
      }
    });
  }

  return (
    <div className="space-y-3">
      {isOpen ? (
        <form className="space-y-4 rounded-2xl bg-surface-container-low p-4" onSubmit={handleSubmit}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-title-lg text-on-surface">إرسال واتساب مباشر</h3>
              <p className="mt-1 text-body-md text-on-surface-variant">استخدم Template معتمد لإرسال تذكير أو متابعة مباشرة للعميل.</p>
            </div>
            <button className="rounded-xl bg-surface-container-high px-3 py-2 text-label-lg font-semibold text-on-surface" onClick={() => setIsOpen(false)} type="button">
              إغلاق
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-label-lg font-semibold text-on-surface">المشروع</span>
              <select className={fieldClassName} onChange={(event) => setProjectId(event.target.value)} value={projectId}>
                {projectOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-label-lg font-semibold text-on-surface">العقد المرتبط</span>
              <select className={fieldClassName} onChange={(event) => setContractId(event.target.value)} value={contractId}>
                <option value="">بدون عقد محدد</option>
                {contractOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-label-lg font-semibold text-on-surface">اسم الـ Template</span>
              <input className={fieldClassName} onChange={(event) => setTemplateName(event.target.value)} value={templateName} />
            </label>
            <label className="space-y-2">
              <span className="text-label-lg font-semibold text-on-surface">الغرض</span>
              <select className={fieldClassName} onChange={(event) => setMessagePurpose(event.target.value as typeof messagePurpose)} value={messagePurpose}>
                <option value="manual_follow_up">متابعة يدوية</option>
                <option value="installment_due_7d">تذكير قبل الاستحقاق</option>
                <option value="other">أخرى</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-label-lg font-semibold text-on-surface">لغة القالب</span>
              <input className={fieldClassName} onChange={(event) => setLanguageCode(event.target.value)} value={languageCode} />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2"><span className="text-label-lg font-semibold text-on-surface">المتغير 1</span><input className={fieldClassName} onChange={(event) => setParamOne(event.target.value)} value={paramOne} /></label>
            <label className="space-y-2"><span className="text-label-lg font-semibold text-on-surface">المتغير 2</span><input className={fieldClassName} onChange={(event) => setParamTwo(event.target.value)} value={paramTwo} /></label>
            <label className="space-y-2"><span className="text-label-lg font-semibold text-on-surface">المتغير 3</span><input className={fieldClassName} onChange={(event) => setParamThree(event.target.value)} value={paramThree} /></label>
            <label className="space-y-2"><span className="text-label-lg font-semibold text-on-surface">المتغير 4</span><input className={fieldClassName} onChange={(event) => setParamFour(event.target.value)} value={paramFour} /></label>
          </div>

          {error ? <div className="rounded-xl bg-error-container px-4 py-3 text-body-md text-[#93000a]">{error}</div> : null}
          {feedback ? <div className="rounded-xl bg-[#d0f5f5] px-4 py-3 text-body-md text-[#004f4f]">{feedback}</div> : null}

          <button className="gradient-primary rounded-xl px-5 py-3 text-body-md font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-60" disabled={isPending} type="submit">
            {isPending ? "جار الإرسال..." : "إرسال واتساب"}
          </button>
        </form>
      ) : (
        <button className="rounded-xl bg-[#e8f7f5] px-5 py-3 text-body-md font-semibold text-[#0f666a] transition-all hover:bg-[#d9f2ee]" onClick={() => setIsOpen(true)} type="button">
          إرسال واتساب مباشر
        </button>
      )}
    </div>
  );
}
