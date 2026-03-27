import { ImportIssuesScreen } from "@/components/imports/import-issues-screen";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { requireImportReadAccess } from "@/features/imports/services/import-access";
import { getImportIssuesList } from "@/server/queries/imports/get-import-issues-list";

export const dynamic = "force-dynamic";

type ImportIssuesPageProps = {
  searchParams?: Promise<{
    batchId?: string;
    issueType?: string;
    severity?: string;
  }>;
};

export default async function ImportIssuesPage({ searchParams }: ImportIssuesPageProps) {
  const sessionUser = await getRequiredSessionUser();
  requireImportReadAccess(sessionUser);
  const filters = (await searchParams) ?? {};
  const result = await getImportIssuesList({
    batchId: filters.batchId,
    issueType: filters.issueType,
    severity: filters.severity,
  });

  return <ImportIssuesScreen result={result} />;
}
