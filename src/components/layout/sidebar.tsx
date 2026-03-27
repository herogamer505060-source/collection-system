"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { SessionUser } from "@/lib/auth/get-session-user";
import { cn } from "@/lib/utils";

import { signOutAction } from "@/features/auth/actions/sign-out";

function NavIcon({ path }: { path: string }) {
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <path d={path} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
    </svg>
  );
}

const navItems = [
  { href: "/dashboard", label: "لوحة المؤشرات", iconPath: "M4 12h7V4H4zm9 8h7v-7h-7zm0-16v7h7V4zm-9 16h7v-5H4z" },
  { href: "/users", label: "المستخدمون والصلاحيات", iconPath: "M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m17 0v-2a4 4 0 0 0-3-3.87M14 7.13a4 4 0 1 1 0-6.26M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" },
  { href: "/imports", label: "الاستيراد", iconPath: "M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" },
  { href: "/import-issues", label: "مشكلات الاستيراد", iconPath: "M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" },
  { href: "/customers", label: "العملاء", iconPath: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2m16-10a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" },
  { href: "/contracts", label: "العقود", iconPath: "M8 7h8M8 11h8M8 15h5M6 3h12a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2Z" },
  { href: "/installments", label: "الأقساط", iconPath: "M3 6h18M7 3v6m10-6v6M6 13h4m4 0h4M4 21h16a1 1 0 0 0 1-1V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a1 1 0 0 0 1 1Z" },
  { href: "/units", label: "الوحدات", iconPath: "M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" },
  { href: "/follow-ups", label: "المتابعات", iconPath: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { href: "/reports", label: "التقارير", iconPath: "M4 19h16M7 15l3-3 3 2 4-5" },
] as const;

type SidebarProps = {
  sessionUser: SessionUser;
};

export function Sidebar({ sessionUser }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      aria-label={`Main navigation for ${sessionUser.fullName}`}
      className="flex h-full flex-col gap-6 bg-surface-container-lowest p-6 ambient-shadow lg:min-h-screen lg:p-8"
      data-sidebar
    >
      <div className="space-y-3">
        <p className="font-label text-label-lg uppercase tracking-[0.28em] text-primary/70">Collection System</p>
        <div className="space-y-2">
          <h2 className="bg-gradient-to-br from-primary to-primary-container bg-clip-text font-display text-headline-sm text-transparent">
            Collection System
          </h2>
          <p className="text-body-md text-on-surface-variant">The Financial Architect</p>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-body-md font-semibold transition-colors",
                isActive
                  ? "rounded-l-xl border-r-4 border-primary bg-teal-50 text-primary"
                  : "rounded-xl text-on-surface-variant hover:bg-surface-container-low",
              )}
              href={item.href}
              key={item.href}
            >
              <NavIcon path={item.iconPath} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <form action={signOutAction} className="mt-auto pt-4">
        <button
          className="w-full rounded-xl px-4 py-3 text-body-md font-semibold text-error transition-colors hover:bg-error-container"
          type="submit"
        >
          تسجيل الخروج
        </button>
      </form>
    </aside>
  );
}
