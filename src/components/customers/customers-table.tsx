import Link from "next/link";

import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getCustomerStatusLabel,
  getCustomerStatusVariant,
} from "@/features/customers/presentation";
import { formatCurrency } from "@/lib/formatting/currency";
import type { CustomersListRow } from "@/server/queries/customers/get-customers-list";

const columns: DataTableColumn<CustomersListRow>[] = [
  {
    cell: (row) => (
      <div className="space-y-2">
        <Link className="font-semibold text-primary hover:underline" href={`/customers/${row.customerId}`}>
          {row.customerName}
        </Link>
        <div className="text-label-lg text-on-surface-variant">{row.contractCount} عقد</div>
      </div>
    ),
    header: "العميل",
  },
  {
    cell: (row) => (
      <div className="flex flex-wrap gap-2">
        {row.projectNames.map((projectName) => (
          <StatusBadge key={`${row.customerId}-${projectName}`} variant="neutral">
            {projectName}
          </StatusBadge>
        ))}
      </div>
    ),
    header: "المشروعات",
  },
  {
    cell: (row) => (
      <div className="space-y-1 text-body-md">
        <div>المستحق: {formatCurrency(row.totals.amountDue)}</div>
        <div>المحصل: {formatCurrency(row.totals.amountCollected)}</div>
        <div>المتبقي: {formatCurrency(row.totals.amountOutstanding)}</div>
      </div>
    ),
    header: "الإجماليات",
  },
  {
    cell: (row) => (
      <StatusBadge variant={getCustomerStatusVariant(row.paymentStatus)}>
        {getCustomerStatusLabel(row.paymentStatus)}
      </StatusBadge>
    ),
    header: "الحالة",
  },
];

type CustomersTableProps = {
  rows: CustomersListRow[];
};

export function CustomersTable({ rows }: CustomersTableProps) {
  return (
    <DataTable
      caption="قائمة العملاء"
      columns={columns}
      data={rows}
      emptyState="لا توجد نتائج مطابقة"
      getRowId={(row) => row.customerId}
    />
  );
}
