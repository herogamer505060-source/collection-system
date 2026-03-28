"use client";

import { useState } from "react";

import { FollowUpForm } from "@/components/follow-ups/follow-up-form";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { formatEgyptDateTime, toEgyptDateString } from "@/lib/dates/egypt";
import { formatCurrency } from "@/lib/formatting/currency";
import type { AgingReportItem } from "@/server/queries/reports/get-aging-report";

type AgingReportTableProps = {
  canManageFollowUps: boolean;
  rows: AgingReportItem[];
};

export function AgingReportTable({ canManageFollowUps, rows }: AgingReportTableProps) {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const expandedRow = rows.find((row) => getRowId(row) === expandedRowId) ?? null;
  const columns = buildColumns({
    canManageFollowUps,
    expandedRowId,
    onToggleFollowUp: setExpandedRowId,
  });

  return (
    <DataTable
      caption="تقرير أعمار المديونية"
      columns={columns}
      data={rows}
      expandedContent={
        canManageFollowUps && expandedRow?.customerId
          ? () => (
              <div className="bg-surface-container-low p-5">
                <FollowUpForm
                  contractOptions={
                    expandedRow.contractId
                      ? [
                          {
                            id: expandedRow.contractId,
                            label:
                              expandedRow.contractCode ?? `عقد ${expandedRow.contractId.slice(0, 8)}`,
                          },
                        ]
                      : []
                  }
                  customerId={expandedRow.customerId!}
                  customerLabel={expandedRow.customerName}
                  defaultCollectorUserId={expandedRow.collectorUserId}
                  mode="create"
                  onCancel={() => setExpandedRowId(null)}
                  onSuccess={() => setExpandedRowId(null)}
                  title={`إضافة متابعة من تقرير أعمار المديونية - ${expandedRow.customerName}`}
                />
              </div>
            )
          : undefined
      }
      expandedRowId={expandedRowId}
      getRowId={getRowId}
    />
  );
}

function buildColumns(input: {
  canManageFollowUps: boolean;
  expandedRowId: string | null;
  onToggleFollowUp: (rowId: string | null) => void;
}): DataTableColumn<AgingReportItem>[] {
  const columns: DataTableColumn<AgingReportItem>[] = [
    { cell: (row) => row.customerName, header: "العميل" },
    { cell: (row) => row.contractCode ?? "—", header: "العقد" },
    { cell: (row) => row.projectName, header: "المشروع" },
    { cell: (row) => formatDate(row.dueDate), header: "تاريخ الاستحقاق" },
    { cell: (row) => formatCurrency(row.amountDue), header: "المستحق" },
    { cell: (row) => formatCurrency(row.amountOutstanding), header: "المتبقي" },
    { cell: (row) => `${row.delayDays} يوم`, header: "أيام التأخير" },
    { cell: (row) => row.delayBucket, header: "فئة التأخير" },
    {
      cell: (row) => (row.lastFollowUpDate ? formatEgyptDateTime(row.lastFollowUpDate) : "—"),
      header: "آخر متابعة",
    },
    {
      cell: (row) => (
        <div className="max-w-xs whitespace-pre-wrap text-body-md leading-6 text-on-surface line-clamp-2">
          {row.lastFollowUpNote ?? "—"}
        </div>
      ),
      header: "ملاحظة المتابعة",
    },
    {
      cell: (row) => (
        <div className="max-w-xs whitespace-pre-wrap text-body-md leading-6 text-on-surface line-clamp-2">
          {row.lastCustomerResponse ?? "—"}
        </div>
      ),
      header: "رد العميل",
    },
  ];

  if (input.canManageFollowUps) {
    columns.push({
      cell: (row) => {
        const rowId = getRowId(row);
        const isExpanded = input.expandedRowId === rowId;

        if (!row.customerId) {
          return <span className="text-label-lg text-on-surface-variant">غير متاح</span>;
        }

        return (
          <button
            className="rounded-xl bg-surface-container-high px-4 py-2 text-label-lg font-semibold text-on-surface transition-all hover:bg-surface-container-highest"
            onClick={() => input.onToggleFollowUp(isExpanded ? null : rowId)}
            type="button"
          >
            {isExpanded ? "إغلاق" : "إضافة متابعة"}
          </button>
        );
      },
      header: "إجراء",
    });
  }

  return columns;
}

function formatDate(value: string | null): string {
  return value ? toEgyptDateString(value) : "—";
}

function getRowId(row: AgingReportItem): string {
  return `${row.customerId ?? row.customerName}-${row.contractId ?? row.dueDate}-${row.delayDays}`;
}
