"use client";

import type { ExportType } from "@/features/exports/column-definitions";

type PrintButtonProps = {
  exportType?: ExportType;
  filters?: Record<string, string | undefined>;
};

export function PrintButton({ exportType, filters }: PrintButtonProps) {
  function handleClick() {
    if (!exportType) {
      window.print();
      return;
    }

    const searchParams = new URLSearchParams({ type: exportType, autoprint: "1" });

    Object.entries(filters ?? {}).forEach(([key, value]) => {
      if (value && value.trim()) {
        searchParams.set(key, value);
      }
    });

    window.open(`/report-print?${searchParams.toString()}`, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      className="no-print rounded-xl bg-surface-container-high px-4 py-2 text-label-lg font-semibold text-on-surface transition-all hover:bg-surface-container-highest"
      onClick={handleClick}
      type="button"
    >
      {exportType ? "نسخة للطباعة" : "طباعة / PDF"}
    </button>
  );
}
