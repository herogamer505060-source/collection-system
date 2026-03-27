import type { ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { getLastImportAt } from "@/server/queries/imports/get-last-import-at";

type DashboardLayoutProps = Readonly<{
  children: ReactNode;
}>;

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const sessionUser = await getRequiredSessionUser();
  const lastImportAt = await getLastImportAt().catch(() => null);

  return (
    <div className="min-h-screen bg-surface">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <Sidebar sessionUser={sessionUser} />
        <div className="flex flex-col gap-6 p-6 lg:p-8">
          <Topbar lastImportAt={lastImportAt} sessionUser={sessionUser} />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
