import Link from "next/link";

import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getImportIssueTypeLabel,
  getImportSeverityLabel,
  getImportSeverityVariant,
} from "@/features/imports/presentation";
import type { ImportIssueSeverity, ImportIssueType } from "@/features/imports/types";

export type ImportIssueTableRow = {
  batchId?: string;
  fileName?: string | null;
  id: string;
  issueType: ImportIssueType;
  messageAr: string;
  rawValue?: string | null;
  severity: ImportIssueSeverity;
  sourceRowNumber?: number | null;
};

const columns: DataTableColumn<ImportIssueTableRow>[] = [
  {
      cell: (row) => (
        <div className="space-y-2">
          <StatusBadge variant={getImportSeverityVariant(row.severity)}>
            {getImportSeverityLabel(row.severity)}
          </StatusBadge>
          <div className="text-body-md font-semibold text-on-surface">{getImportIssueTypeLabel(row.issueType)}</div>
        </div>
      ),
    header: "التصنيف",
  },
  {
      cell: (row) => (
        <div className="space-y-2">
          <p className="text-body-md text-on-surface">{row.messageAr}</p>
          {row.rawValue ? <p className="text-label-lg text-on-surface-variant">القيمة الخام: {row.rawValue}</p> : null}
        </div>
      ),
    header: "الوصف",
  },
  {
      cell: (row) => (
        <div className="space-y-2 text-body-md text-on-surface-variant">
          {row.sourceRowNumber ? <div>الصف: {row.sourceRowNumber}</div> : <div>بدون رقم صف</div>}
          {row.fileName ? <div>الملف: {row.fileName}</div> : null}
          {row.batchId ? (
          <Link className="font-semibold text-primary hover:underline" href={`/imports/${row.batchId}`}>
            فتح الدفعة
          </Link>
        ) : null}
      </div>
    ),
    header: "السياق",
  },
];

type ImportIssuesTableProps = {
  caption?: string;
  emptyState?: string;
  issues: ImportIssueTableRow[];
};

export function ImportIssuesTable({
  caption = "مشكلات الاستيراد",
  emptyState = "لا توجد مشكلات مطابقة للمرشحات الحالية",
  issues,
}: ImportIssuesTableProps) {
  return (
    <DataTable
      caption={caption}
      columns={columns}
      data={issues}
      emptyState={emptyState}
      getRowId={(row) => row.id}
    />
  );
}
