import Link from "next/link";

import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getContractDerivedStatusLabel,
  getContractDerivedStatusVariant,
} from "@/features/customers/presentation";
import { formatCurrency } from "@/lib/formatting/currency";
import type { ContractsListRow } from "@/server/queries/contracts/get-contracts-list";
import type { CustomerProfileContract } from "@/server/queries/customers/get-customer-profile";

type ContractRow = ContractsListRow | CustomerProfileContract;

type ContractsTableProps = {
  emptyState?: string;
  rows: ContractRow[];
  showCustomer?: boolean;
};

export function ContractsTable({
  emptyState = "لا توجد عقود مطابقة",
  rows,
  showCustomer = true,
}: ContractsTableProps) {
  const columns: DataTableColumn<ContractRow>[] = [
    {
      cell: (row) => (
        <div className="space-y-2">
          <Link className="font-semibold text-primary hover:underline" href={`/contracts/${row.contractId}`}>
            {row.contractCode ?? `عقد ${row.contractId.slice(0, 8)}`}
          </Link>
          <div className="text-label-lg text-on-surface-variant">{row.projectName}</div>
        </div>
      ),
      header: "العقد",
    },
    ...(showCustomer
      ? [
          {
            cell: (row: ContractRow) =>
              "customerName" in row ? (
                <Link className="font-semibold text-on-surface hover:text-primary" href={`/customers/${row.customerId}`}>
                  {row.customerName}
                </Link>
              ) : (
                <span className="text-on-surface-variant">-</span>
              ),
            header: "العميل",
          } satisfies DataTableColumn<ContractRow>,
        ]
      : []),
    {
      cell: (row) => <span>{row.collectorName ?? "غير محدد"}</span>,
      header: "المحصل",
    },
    {
      cell: (row) => (
        <div className="flex flex-wrap gap-2">
          {row.unitCodes.map((unitCode) => (
            <StatusBadge key={`${row.contractId}-${unitCode}`} variant="neutral">
              {unitCode}
            </StatusBadge>
          ))}
        </div>
      ),
      header: "الوحدات",
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
        <StatusBadge variant={getContractDerivedStatusVariant(row.contractStatus)}>
          {getContractDerivedStatusLabel(row.contractStatus)}
        </StatusBadge>
      ),
      header: "الحالة",
    },
  ];

  return (
    <DataTable
      caption="قائمة العقود"
      columns={columns}
      data={rows}
      emptyState={emptyState}
      getRowId={(row) => row.contractId}
    />
  );
}
