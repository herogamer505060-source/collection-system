"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FollowUpForm } from "@/components/follow-ups/follow-up-form";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getContactTypeLabel,
  getFollowUpStatusLabel,
  getFollowUpStatusVariant,
} from "@/features/customers/presentation";
import { formatEgyptDateTime } from "@/lib/dates/egypt";
import type { FollowUpListItem } from "@/server/queries/follow-ups/get-follow-ups-list";

type FollowUpsTableProps = {
  canManage: boolean;
  rows: FollowUpListItem[];
};

export function FollowUpsTable({ canManage, rows }: FollowUpsTableProps) {
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingFollowUpId, setDeletingFollowUpId] = useState<string | null>(null);
  const [editingFollowUpId, setEditingFollowUpId] = useState<string | null>(null);
  const editingRow = rows.find((row) => row.followUpId === editingFollowUpId) ?? null;
  const columns = buildColumns({
    canManage,
    deletingFollowUpId,
    onDelete: handleDelete,
    onEdit: setEditingFollowUpId,
  });

  async function handleDelete(followUpId: string) {
    if (!window.confirm("هل أنت متأكد من حذف هذه المتابعة؟")) {
      return;
    }

    try {
      setActionError(null);
      setDeletingFollowUpId(followUpId);

      const response = await fetch(`/api/follow-ups/${followUpId}`, { method: "DELETE" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "تعذر حذف المتابعة");
      }

      if (editingFollowUpId === followUpId) {
        setEditingFollowUpId(null);
      }

      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
    } finally {
      setDeletingFollowUpId(null);
    }
  }

  return (
    <div className="space-y-4">
      {actionError ? (
        <div className="rounded-xl bg-error-container px-4 py-3 text-body-md text-[#93000a]">{actionError}</div>
      ) : null}

      <DataTable
        caption="قائمة المتابعات"
        columns={columns}
        data={rows}
        emptyState="لا توجد متابعات مطابقة"
        getRowId={(row) => row.followUpId}
      />

      {editingRow ? (
        <FollowUpForm
          customerId={editingRow.customerId}
          customerLabel={editingRow.customerName}
          defaultCollectorUserId={editingRow.collectorUserId}
          followUpId={editingRow.followUpId}
          initialValues={{
            collectorUserId: editingRow.collectorUserId ?? "",
            contactType: editingRow.contactType as "call" | "email" | "meeting" | "other" | "whatsapp",
            contractId: editingRow.contractId ?? "",
            customerResponse: editingRow.customerResponse ?? "",
            followUpDate: editingRow.followUpDate,
            followUpStatus: editingRow.followUpStatus as "done" | "missed" | "open",
            nextActionDate: editingRow.nextActionDate ?? "",
            note: editingRow.note,
            promiseDate: editingRow.promiseDate ?? "",
            promisedToPay: editingRow.promisedToPay,
          }}
          mode="update"
          onCancel={() => setEditingFollowUpId(null)}
          onSuccess={() => setEditingFollowUpId(null)}
          submitLabel="حفظ التعديل"
          title={`تعديل متابعة ${editingRow.customerName}`}
        />
      ) : null}
    </div>
  );
}

function buildColumns(input: {
  canManage: boolean;
  deletingFollowUpId: string | null;
  onDelete: (followUpId: string) => Promise<void>;
  onEdit: (followUpId: string | null) => void;
}): DataTableColumn<FollowUpListItem>[] {
  const columns: DataTableColumn<FollowUpListItem>[] = [
    {
      cell: (row) => (
        <div className="space-y-2">
          <Link className="font-semibold text-primary hover:underline" href={`/customers/${row.customerId}`}>
            {row.customerName}
          </Link>
          {row.contractId ? (
            <Link className="block text-label-lg text-on-surface-variant hover:text-primary" href={`/contracts/${row.contractId}`}>
              {row.contractCode ?? `عقد ${row.contractId.slice(0, 8)}`}
            </Link>
          ) : (
            <span className="text-label-lg text-on-surface-variant">بدون عقد محدد</span>
          )}
        </div>
      ),
      header: "العميل والعقد",
    },
    {
      cell: (row) => (
        <div className="space-y-2 text-body-md">
          <div className="font-medium text-on-surface">{getContactTypeLabel(row.contactType)}</div>
          <p className="max-w-xl leading-7 text-on-surface-variant">{row.note}</p>
        </div>
      ),
      header: "تفاصيل المتابعة",
    },
    {
      cell: (row) => (
        <div className="space-y-2 text-body-md text-on-surface-variant">
          <div>تاريخ المتابعة: {formatEgyptDateTime(row.followUpDate)}</div>
          {row.nextActionDate ? <div>الإجراء التالي: {row.nextActionDate}</div> : null}
          {row.promiseDate ? <div>تاريخ الوعد: {row.promiseDate}</div> : null}
        </div>
      ),
      header: "المواعيد",
    },
    {
      cell: (row) => (
        <div className="space-y-1 text-body-md">
          <div className="font-medium text-on-surface">{row.collectorName ?? "غير محدد"}</div>
          <div className="text-on-surface-variant">{row.projectName ?? "بدون مشروع محدد"}</div>
        </div>
      ),
      header: "المحصل والمشروع",
    },
    {
      cell: (row) => (
        <div className="flex flex-wrap gap-2">
          <StatusBadge variant={getFollowUpStatusVariant(row.followUpStatus)}>
            {getFollowUpStatusLabel(row.followUpStatus)}
          </StatusBadge>
          {row.promisedToPay ? <StatusBadge variant="warning">وعد سداد</StatusBadge> : null}
          {row.isOverdue ? <StatusBadge variant="danger">إجراء متأخر</StatusBadge> : null}
        </div>
      ),
      header: "الحالة",
    },
  ];

  if (input.canManage) {
    columns.push({
      cell: (row) =>
        row.canEdit ? (
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-xl bg-surface-container-high px-4 py-2 text-label-lg font-semibold text-on-surface transition-all hover:bg-surface-container-highest"
              onClick={() => input.onEdit(row.followUpId)}
              type="button"
            >
              تعديل
            </button>
            <button
              className="rounded-xl bg-error-container px-4 py-2 text-label-lg font-semibold text-[#93000a] disabled:opacity-60"
              disabled={input.deletingFollowUpId === row.followUpId}
              onClick={() => void input.onDelete(row.followUpId)}
              type="button"
            >
              {input.deletingFollowUpId === row.followUpId ? "جار الحذف..." : "حذف"}
            </button>
          </div>
        ) : (
          <span className="text-label-lg text-on-surface-variant">للقراءة فقط</span>
        ),
      header: "إجراء",
    });
  }

  return columns;
}
