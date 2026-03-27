"use client";

import { PageErrorState } from "@/components/ui/page-state";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  return (
    <PageErrorState
      action={
        <button
          className="gradient-primary rounded-xl px-5 py-3 text-body-md font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90"
          onClick={() => reset()}
          type="button"
        >
          إعادة المحاولة
        </button>
      }
      message={error.message || "تعذر تحميل الصفحة الحالية. حاول مرة أخرى أو راجع سجل الخادم."}
      title="حدث خطأ أثناء تحميل الصفحة"
    />
  );
}
