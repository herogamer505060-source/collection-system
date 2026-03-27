"use client";

import { useState } from "react";

import type { ExportType } from "@/features/exports/column-definitions";

type ExportButtonProps = {
  exportType: ExportType;
  filters?: Record<string, string | undefined>;
};

export function ExportButton({ exportType, filters }: ExportButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [loadingFormat, setLoadingFormat] = useState<"csv" | "xlsx" | null>(null);

  async function handleExport(format: "csv" | "xlsx") {
    try {
      setError(null);
      setLoadingFormat(format);

      const response = await fetch("/api/export", {
        body: JSON.stringify({
          filters: sanitizeFilters(filters),
          format,
          type: exportType,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error?.message ?? "تعذر تنفيذ التصدير");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fileName = getFileName(response.headers.get("Content-Disposition"), exportType, format);

      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "حدث خطأ غير متوقع أثناء التصدير");
    } finally {
      setLoadingFormat(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-xl bg-surface-container-high px-4 py-2 text-label-lg font-semibold text-on-surface transition-all hover:bg-surface-container-highest disabled:opacity-60"
          disabled={loadingFormat !== null}
          onClick={() => void handleExport("xlsx")}
          type="button"
        >
          {loadingFormat === "xlsx" ? "جاري التصدير..." : "تصدير Excel"}
        </button>
        <button
          className="rounded-xl bg-surface-container-high px-4 py-2 text-label-lg font-semibold text-on-surface transition-all hover:bg-surface-container-highest disabled:opacity-60"
          disabled={loadingFormat !== null}
          onClick={() => void handleExport("csv")}
          type="button"
        >
          {loadingFormat === "csv" ? "جاري التصدير..." : "CSV"}
        </button>
      </div>
      {error ? <div className="text-label-lg text-[#93000a]">{error}</div> : null}
    </div>
  );
}

function sanitizeFilters(filters?: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(filters ?? {}).filter((entry): entry is [string, string] => Boolean(entry[1] && entry[1].trim())),
  );
}

function getFileName(
  disposition: string | null,
  exportType: ExportType,
  format: "csv" | "xlsx",
): string {
  const matchedFileName = disposition?.match(/filename="?([^";]+)"?/)?.[1];

  if (matchedFileName) {
    return matchedFileName;
  }

  return `${exportType}-${new Date().toISOString().slice(0, 10)}.${format}`;
}
