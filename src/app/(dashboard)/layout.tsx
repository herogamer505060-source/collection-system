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
    <div className="min-h-screen bg-transparent">
      <div className="grid min-h-screen xl:grid-cols-[300px_1fr]">
        <Sidebar sessionUser={sessionUser} />
        <div className="relative flex flex-col gap-6 px-4 pb-6 pt-4 sm:px-6 lg:px-8 lg:pb-8 lg:pt-6 xl:px-10">
          <Topbar lastImportAt={lastImportAt} sessionUser={sessionUser} />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
