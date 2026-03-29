import { notFound } from "next/navigation";

import { AutoPrintOnLoad } from "@/components/ui/auto-print-on-load";
import { PrintPageActions } from "@/components/ui/print-page-actions";
import { EXPORT_TYPES, type ExportType } from "@/features/exports/column-definitions";
import {
  formatNumericTotal,
  getNumericColumnTotals,
  hasAnyNumericTotals,
} from "@/features/exports/report-table-totals";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { requirePermission } from "@/lib/auth/permissions";
import { getExportDataset } from "@/server/queries/exports/get-export-dataset";

export const dynamic = "force-dynamic";

type ReportPrintPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReportPrintPage({ searchParams }: ReportPrintPageProps) {
  const sessionUser = await getRequiredSessionUser();
  requirePermission(sessionUser, "reports.read");
  const params = (await searchParams) ?? {};
  const type = getExportType(readSearchParam(params, "type"));

  if (!type) {
    notFound();
  }

  const filters = sanitizeFilters(params);
  const dataset = await getExportDataset({ filters, sessionUser, type });
  const autoPrint = readSearchParam(params, "autoprint") === "1";
  const totals = getNumericColumnTotals(dataset.columns, dataset.rows);
  const hasTotals = hasAnyNumericTotals(totals);

  return (
    <main className="min-h-screen bg-white px-6 py-8 font-sans tracking-normal text-slate-950 [word-spacing:0]">
      <AutoPrintOnLoad enabled={autoPrint} />
      <PrintPageActions title={dataset.title} />

      <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="font-sans text-headline-sm font-bold leading-relaxed tracking-normal text-slate-950">{dataset.title}</h1>
            <p className="mt-2 text-body-md text-slate-600">تاريخ الإنشاء: {dataset.generatedAt}</p>
            <p className="mt-1 text-body-md text-slate-600">عدد الصفوف: {dataset.rows.length}</p>
          </div>
          {dataset.filterSummary.length > 0 ? (
            <div className="flex max-w-3xl flex-wrap gap-2 font-sans tracking-normal">
              {dataset.filterSummary.map((entry) => (
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-label-lg text-slate-700" key={`${entry.label}-${entry.value}`}>
                  <span className="font-semibold text-slate-900">{entry.label}:</span> {entry.value}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-right text-body-md leading-7 print:text-[10pt]">
            <thead>
              <tr>
                {dataset.columns.map((column) => (
                  <th className="border border-slate-300 bg-slate-100 px-3 py-2 font-sans font-semibold leading-7 tracking-normal text-slate-800 break-normal" key={column.key} scope="col">
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataset.rows.length > 0 ? (
                dataset.rows.map((row, rowIndex) => (
                  <tr className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/70"} key={rowIndex}>
                    {dataset.columns.map((column) => (
                      <td className="border border-slate-200 px-3 py-2 align-top font-sans leading-7 tracking-normal text-slate-900 break-normal" key={column.key}>
                        {formatCellValue(row[column.key])}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="border border-slate-200 px-3 py-6 text-center font-sans leading-7 tracking-normal text-slate-500" colSpan={dataset.columns.length}>
                    لا توجد بيانات ضمن النطاق الحالي.
                  </td>
                </tr>
              )}
            </tbody>
            {hasTotals ? (
              <tfoot>
                <tr className="bg-slate-100/90">
                  {dataset.columns.map((column, index) => (
                    <td className="border border-slate-300 px-3 py-2 text-center font-sans font-semibold leading-7 tracking-normal text-slate-900" key={column.key}>
                      {index === 0 ? "الإجمالي" : formatNumericTotal(totals[column.key] ?? null)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </section>
    </main>
  );
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatCellValue(item)).join("، ");
  }

  return String(value);
}

function getExportType(value: string | undefined): ExportType | null {
  return value && EXPORT_TYPES.includes(value as ExportType) ? (value as ExportType) : null;
}

function readSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function sanitizeFilters(searchParams: Record<string, string | string[] | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(searchParams)
      .filter(([key]) => key !== "autoprint" && key !== "type")
      .map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
      .filter((entry): entry is [string, string] => Boolean(entry[1] && entry[1].trim())),
  );
}
