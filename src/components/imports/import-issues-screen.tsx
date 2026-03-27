import Link from "next/link";

import { ImportIssuesTable } from "@/components/imports/import-issues-table";
import { FilterBar } from "@/components/ui/filter-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getImportIssueTypeLabel,
  getImportSeverityLabel,
} from "@/features/imports/presentation";
import type { ImportIssueListResult } from "@/server/queries/imports/get-import-issues-list";

type ImportIssuesScreenProps = {
  result: ImportIssueListResult;
};

export function ImportIssuesScreen({ result }: ImportIssuesScreenProps) {
  return (
    <section className="space-y-6">
      <FilterBar
        actions={<StatusBadge variant="warning">{result.issues.length} مشكلة مطابقة</StatusBadge>}
        description="فلترة المشكلات حسب الدفعة أو مستوى الشدة أو نوع الخطأ لتسريع المراجعة التشغيلية."
        title="سجل مشكلات الاستيراد"
      >
        <form action="/import-issues" className="flex w-full flex-wrap gap-3">
          <select
            className="min-w-[220px] rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30"
            defaultValue={result.filters.batchId ?? ""}
            name="batchId"
          >
            <option value="">كل الدفعات</option>
            {result.batchOptions.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.label}
              </option>
            ))}
          </select>
          <select
            className="min-w-[180px] rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30"
            defaultValue={result.filters.severity ?? ""}
            name="severity"
          >
            <option value="">كل المستويات</option>
            {result.severityOptions.map((severity) => (
              <option key={severity} value={severity}>
                {getImportSeverityLabel(severity)}
              </option>
            ))}
          </select>
          <select
            className="min-w-[220px] rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30"
            defaultValue={result.filters.issueType ?? ""}
            name="issueType"
          >
            <option value="">كل الأنواع</option>
            {result.issueTypeOptions.map((issueType) => (
              <option key={issueType} value={issueType}>
                {getImportIssueTypeLabel(issueType)}
              </option>
            ))}
          </select>
          <button className="gradient-primary rounded-xl px-4 py-3 text-body-md font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90" type="submit">
            تطبيق المرشحات
          </button>
          <Link
            className="rounded-xl bg-surface-container-high px-4 py-3 text-body-md font-semibold text-on-surface transition-all hover:bg-surface-container-highest"
            href="/import-issues"
          >
            مسح المرشحات
          </Link>
        </form>
      </FilterBar>

      <ImportIssuesTable
        issues={result.issues.map((issue) => ({
          batchId: issue.batchId,
          fileName: issue.fileName,
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
