"use client";

type PrintPageActionsProps = {
  title: string;
};

export function PrintPageActions({ title }: PrintPageActionsProps) {
  return (
    <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div>
        <div className="font-display text-title-lg text-slate-900">{title}</div>
        <div className="text-body-md text-slate-600">نسخة تجهيز للطباعة الكاملة أو حفظ PDF</div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-xl bg-slate-900 px-4 py-2 text-body-md font-semibold text-white"
          onClick={() => window.print()}
          type="button"
        >
          طباعة الآن
        </button>
        <button
          className="rounded-xl bg-slate-200 px-4 py-2 text-body-md font-semibold text-slate-900"
          onClick={() => window.close()}
          type="button"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
}
