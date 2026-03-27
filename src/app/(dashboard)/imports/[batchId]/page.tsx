import { ImportBatchSummary } from "@/components/imports/import-batch-summary";
import { ImportIssuesTable } from "@/components/imports/import-issues-table";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { getImportAccess, requireImportReadAccess } from "@/features/imports/services/import-access";
import { getImportBatchDetail } from "@/server/queries/imports/get-import-batch-detail";

export const dynamic = "force-dynamic";

type ImportBatchPageProps = {
  params: Promise<{ batchId: string }>;
};

export default async function ImportBatchPage({ params }: ImportBatchPageProps) {
  const sessionUser = await getRequiredSessionUser();
  requireImportReadAccess(sessionUser);
  const access = getImportAccess(sessionUser);
  const { batchId } = await params;
  const batch = await getImportBatchDetail({ batchId });

  return (
    <section className="space-y-6">
      <ImportBatchSummary batch={batch} canManage={access.canManage} />

      <section className="space-y-4 rounded-2xl bg-surface-container-lowest p-5 ambient-shadow">
        <div>
          <h2 className="font-display text-title-lg text-on-surface">سجل المشكلات داخل الدفعة</h2>
          <p className="mt-2 text-body-md text-on-surface-variant">
            راجع المشكلات التفصيلية لتحديد ما إذا كانت تحتاج إعادة رفع أو متابعة من الإدارة.
          </p>
        </div>

        <ImportIssuesTable
          emptyState="لا توجد مشكلات مسجلة داخل هذه الدفعة"
          issues={batch.issues.map((issue) => ({
            id: issue.id,
            issueType: issue.issueType,
            messageAr: issue.messageAr,
            rawValue: issue.rawValue,
            severity: issue.severity,
            sourceRowNumber: issue.sourceRowNumber,
          }))}
        />
      </section>
    </section>
  );
}
