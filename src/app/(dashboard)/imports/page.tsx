import { ImportUploadForm } from "@/components/imports/import-upload-form";
import { FilterBar } from "@/components/ui/filter-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { requireImportReadAccess } from "@/features/imports/services/import-access";
import { listRecentImportBatches } from "@/server/repositories/import-batch-staging-repository";

export const dynamic = "force-dynamic";

export default async function ImportsPage() {
  const sessionUser = await getRequiredSessionUser();
  const access = requireImportReadAccess(sessionUser);
  const recentBatches = await listRecentImportBatches();

  return (
    <section className="space-y-6">
      <FilterBar
        actions={
          <StatusBadge variant={access.canManage ? "success" : "info"}>
            {access.canManage ? "يمكنك رفع واعتماد الدفعات" : "وضع قراءة فقط"}
          </StatusBadge>
        }
        description="ابدأ برفع ملف Excel، راجع المعاينة، ثم انتقل إلى صفحة التفاصيل لاعتماد الدفعة أو متابعة المشكلات." 
        title="مركز الاستيراد"
      />

      <ImportUploadForm
        canManage={access.canManage}
        recentBatches={recentBatches.map((batch) => ({
          batchId: batch.id,
          batchType: batch.batch_type as "installments" | "sold_units" | "available_units",
          startedAt: batch.started_at,
          status: batch.status,
        }))}
      />
    </section>
  );
}
