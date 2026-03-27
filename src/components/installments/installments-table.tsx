"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { InstallmentEditForm } from "@/components/installments/installment-edit-form";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/formatting/currency";
import { formatInteger } from "@/lib/formatting/numbers";
import type { CustomerProfileInstallment } from "@/server/queries/customers/get-customer-profile";
import type { InstallmentListItem } from "@/server/queries/installments/get-installments-list";

import { PaymentStatusBadge } from "./payment-status-badge";

type InstallmentRow = (CustomerProfileInstallment | InstallmentListItem) & {
  paymentDate?: string | null;
  receiptReference?: string | null;
};

type InstallmentsTableProps = {
  canEdit?: boolean;
  emptyState?: string;
  rows: InstallmentRow[];
  showCustomer?: boolean;
  showProject?: boolean;
};

export function InstallmentsTable({
  canEdit = false,
  emptyState = "لا توجد أقساط مطابقة",
  rows,
  showCustomer = true,
  showProject = true,
}: InstallmentsTableProps) {
  const router = useRouter();
  const [editingInstallmentId, setEditingInstallmentId] = useState<string | null>(null);
  const editingRow = rows.find((row) => row.installmentId === editingInstallmentId) ?? null;
  const columns: DataTableColumn<InstallmentRow>[] = [
    {
      cell: (row) => (
        <div className="space-y-1">
          <div className="font-semibold text-on-surface">{row.installmentCode ?? row.installmentType}</div>
          <div className="text-label-lg text-on-surface-variant">{row.dueDate}</div>
        </div>
      ),
      header: "القسط",
    },
    ...(showCustomer
      ? [
          {
            cell: (row: InstallmentRow) =>
              "customerName" in row ? (
                <Link className="font-semibold text-on-surface hover:text-primary" href={`/customers/${row.customerId}`}>
                  {row.customerName}
                </Link>
              ) : (
                <span className="text-on-surface-variant">-</span>
              ),
            header: "العميل",
          } satisfies DataTableColumn<InstallmentRow>,
        ]
      : []),
    ...(showProject
      ? [
          {
            cell: (row: InstallmentRow) => <span>{row.projectName}</span>,
            header: "المشروع",
          } satisfies DataTableColumn<InstallmentRow>,
        ]
      : []),
    {
      cell: (row) => (
        <div className="space-y-1 text-body-md">
          <div>المستحق: {formatCurrency(row.amountDue)}</div>
          <div>المحصل: {formatCurrency(row.amountCollected)}</div>
          <div>المتبقي: {formatCurrency(row.amountOutstanding)}</div>
        </div>
      ),
      header: "المبالغ",
    },
    {
      cell: (row) => (
        <div className="space-y-2">
          <PaymentStatusBadge status={row.paymentStatus as "overdue" | "paid" | "partial" | "unpaid"} />
          <div className="text-label-lg text-on-surface-variant">تأخير: {formatInteger(row.delayDays)} يوم</div>
        </div>
      ),
      header: "الحالة",
    },
    {
      cell: (row) => (
        <div className="space-y-2">
          <Link className="font-semibold text-primary hover:underline" href={`/contracts/${row.contractId}`}>
            {row.contractCode ?? `عقد ${row.contractId.slice(0, 8)}`}
          </Link>
          <div className="flex flex-wrap gap-2">
            {row.unitCodes.map((unitCode) => (
              <StatusBadge key={`${row.installmentId}-${unitCode}`} variant="neutral">
                {unitCode}
              </StatusBadge>
            ))}
          </div>
        </div>
      ),
      header: "العقد والوحدات",
    },
  ];

  if (canEdit) {
    columns.push({
      cell: (row) => (
        <button
          className="rounded-xl bg-surface-container-high px-4 py-2 text-label-lg font-semibold text-on-surface transition-all hover:bg-surface-container-highest"
          onClick={() => setEditingInstallmentId((current) => (current === row.installmentId ? null : row.installmentId))}
          type="button"
        >
          {editingInstallmentId === row.installmentId ? "إغلاق" : "تسجيل دفعة"}
        </button>
      ),
      header: "إجراء",
    });
  }

  return (
    <DataTable
      caption="قائمة الأقساط"
      columns={columns}
      data={rows}
      emptyState={emptyState}
      expandedContent={
        canEdit && editingRow
          ? () => (
              <div className="p-4">
                <InstallmentEditForm
                  initialValues={{
                    amountCollected: editingRow.amountCollected,
                    amountDue: editingRow.amountDue,
                    paymentDate: editingRow.paymentDate ?? null,
                    penaltyAmount: editingRow.penaltyAmount,
                    receiptReference: editingRow.receiptReference ?? null,
                  }}
                  installmentId={editingRow.installmentId}
                  onCancel={() => setEditingInstallmentId(null)}
                  onSuccess={() => {
                    setEditingInstallmentId(null);
                    router.refresh();
                  }}
                />
              </div>
            )
          : undefined
      }
      expandedRowId={canEdit ? editingInstallmentId : undefined}
      getRowId={(row) => row.installmentId}
    />
  );
}
