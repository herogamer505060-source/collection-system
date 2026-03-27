"use client";

export function PrintButton() {
  return (
    <button
      className="no-print rounded-xl bg-surface-container-high px-4 py-2 text-label-lg font-semibold text-on-surface transition-all hover:bg-surface-container-highest"
      onClick={() => window.print()}
      type="button"
    >
      طباعة / PDF
    </button>
  );
}
