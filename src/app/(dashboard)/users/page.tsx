import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { FilterBar } from "@/components/ui/filter-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { getRolePermissions, requirePermission } from "@/lib/auth/permissions";
import { ROLE_LABELS_AR } from "@/lib/auth/role-scopes";

export const dynamic = "force-dynamic";

type RoleRow = {
  permissions: string[];
  roleLabel: string;
  scopeLabel: string;
};

const roleColumns: DataTableColumn<RoleRow>[] = [
  {
    cell: (row) => row.roleLabel,
    header: "الدور",
  },
  {
    cell: (row) => row.scopeLabel,
    header: "النطاق",
  },
  {
    cell: (row) => (
      <div className="flex flex-wrap gap-2">
        {row.permissions.map((permission) => (
          <StatusBadge key={permission} variant="info">
            {permission}
          </StatusBadge>
        ))}
      </div>
    ),
    header: "الصلاحيات الأساسية",
  },
];

export default async function UsersPage() {
  const sessionUser = await getRequiredSessionUser();
  requirePermission(sessionUser, "admin.users.manage");

  const roleRows: RoleRow[] = sessionUser.roles.map((assignment) => ({
    permissions: getRolePermissions(assignment.role),
    roleLabel: ROLE_LABELS_AR[assignment.role],
    scopeLabel: assignment.projectId ? `مشروع محدد (${assignment.projectId.slice(0, 8)})` : "على مستوى النظام",
  }));

  return (
    <section className="space-y-6">
      <FilterBar
        actions={
          <>
            <button
              className="gradient-primary rounded-xl px-4 py-3 text-body-md font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90"
              type="button"
            >
              إضافة مستخدم
            </button>
            <StatusBadge variant="success">واجهات إنشاء وتحديث المستخدمين جاهزة</StatusBadge>
          </>
        }
        description="تم تجهيز مسار الإدارة الأساسي، مع حماية الدور الإداري وتهيئة هيكل الجدول وعناصر التصفية."
        title="تهيئة شاشة المستخدمين"
      >
        <div className="rounded-xl bg-surface-container-low px-4 py-3 text-body-md text-on-surface-variant">
          البحث والمرشحات التفصيلية ستكتمل مع المسارات التشغيلية التالية.
        </div>
      </FilterBar>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <DataTable
          caption="الأدوار والصلاحيات المسندة"
          columns={roleColumns}
          data={roleRows}
          getRowId={(row, index) => `${row.roleLabel}-${index}`}
        />

        <section className="rounded-2xl bg-surface-container-lowest p-5 ambient-shadow">
          <h2 className="font-display text-title-lg text-on-surface">ملخص التفعيل</h2>
          <div className="mt-4 space-y-3 text-body-md text-on-surface-variant">
            <div className="rounded-xl bg-surface-container-low px-4 py-3">
              <div className="font-semibold text-on-surface">POST `/api/admin/users`</div>
              <p className="mt-1">إنشاء مستخدم جديد وربطه بملف وصلاحية تطبيقية.</p>
            </div>
            <div className="rounded-xl bg-surface-container-low px-4 py-3">
              <div className="font-semibold text-on-surface">PATCH `/api/admin/users/[userId]`</div>
              <p className="mt-1">تحديث التفعيل ونطاق المشروع والدور المخصص للمستخدم.</p>
            </div>
            <div className="rounded-xl bg-surface-container-low px-4 py-3">
              <div className="font-semibold text-on-surface">الحساب الحالي</div>
              <p className="mt-1">{sessionUser.fullName}</p>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
