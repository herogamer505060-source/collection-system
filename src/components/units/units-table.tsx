import Link from "next/link";

import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/formatting/currency";
import type { UnitsListItem } from "@/server/queries/units/get-units-list";

import { UnitRowActions } from "./unit-row-actions";
import { UnitStatusCell } from "./unit-status-cell";

type UnitsTableProps = {
  rows: UnitsListItem[];
};

export function UnitsTable({ rows }: UnitsTableProps) {
  const columns: DataTableColumn<UnitsListItem>[] = [
    {
      cell: (row) => (
        <div className="space-y-2">
          <div className="font-semibold text-on-surface">{row.unitCode}</div>
          <div className="text-label-lg text-on-surface-variant">{row.projectName}</div>
        </div>
      ),
      header: "الوحدة",
    },
    {
      cell: (row) => (
        <div className="space-y-1 text-body-md text-on-surface-variant">
          <div>الدور: {row.floorName ?? "غير محدد"}</div>
          <div>مساحة البناء: {row.builtUpArea ?? 0} م2</div>
          <div>الحديقة: {row.gardenArea ?? 0} م2</div>
        </div>
      ),
      header: "المساحات",
    },
    {
      cell: (row) => (
        <div className="space-y-1 text-body-md">
          <div>سعر القائمة: {formatCurrency(row.listPrice ?? 0)}</div>
          <div>سعر التعاقد: {row.contractPrice !== null ? formatCurrency(row.contractPrice) : "-"}</div>
        </div>
      ),
      header: "الأسعار",
    },
    {
      cell: (row) => <UnitStatusCell statusConflict={row.statusConflict} unitStatus={row.unitStatus} />,
      header: "الحالة",
    },
    {
      cell: (row) =>
        row.linkedContract ? (
          <div className="space-y-2">
            <Link className="font-semibold text-primary hover:underline" href={`/contracts/${row.linkedContract.contractId}`}>
              {row.linkedContract.contractCode ?? `عقد ${row.linkedContract.contractId.slice(0, 8)}`}
            </Link>
            <StatusBadge variant="neutral">{row.linkedContract.customerName}</StatusBadge>
          </div>
        ) : (
          <span className="text-body-md text-on-surface-variant">لا يوجد عقد</span>
        ),
      header: "العقد المرتبط",
    },
    {
      cell: (row) => <UnitRowActions linkedContract={row.linkedContract} />,
      header: "إجراء",
    },
  ];

  return (
    <DataTable
      caption="قائمة الوحدات"
      columns={columns}
      data={rows}
      emptyState="لا توجد وحدات مطابقة"
      getRowId={(row) => row.unitId}
    />
  );
}
