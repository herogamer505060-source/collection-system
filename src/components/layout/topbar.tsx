"use client";

import { usePathname } from "next/navigation";

import { LastDataUpdate } from "@/components/layout/last-data-update";
import type { SessionUser } from "@/lib/auth/get-session-user";
import { getPrimaryRole, ROLE_LABELS_AR } from "@/lib/auth/role-scopes";

const PAGE_TITLES: Record<string, { description: string; title: string }> = {
  "/dashboard": {
    description: "نظرة لحظية على مؤشرات التحصيل، أعلى العملاء المتأخرين، وآخر الأنشطة التشغيلية.",
    title: "لوحة المؤشرات",
  },
  "/contracts": {
    description: "مراجعة العقود مع المشاريع والوحدات وإجماليات التحصيل والحالة المشتقة.",
    title: "قائمة العقود",
  },
  "/customers": {
    description: "بحث عربي سريع للوصول إلى ملفات العملاء وعقودهم وحالتهم الحالية.",
    title: "قائمة العملاء",
  },
  "/follow-ups": {
    description: "متابعة التواصل اليومي والوعد القادم والإجراءات المتأخرة لفريق التحصيل.",
    title: "قائمة المتابعات",
  },
  "/import-issues": {
    description: "متابعة جودة البيانات عبر كل دفعات الاستيراد مع مرشحات مباشرة للمشكلات.",
    title: "سجل مشكلات الاستيراد",
  },
  "/imports": {
    description: "رفع ملفات Excel، مراجعة المعاينة، ثم اعتماد الدفعات بأمان.",
    title: "مركز الاستيراد",
  },
  "/installments": {
    description: "متابعة الأقساط حسب الحالة والمشروع والعميل مع إظهار التأخير والمبالغ المتبقية.",
    title: "جدول الأقساط",
  },
  "/units": {
    description: "مرجع تشغيلي للوحدات المتاحة والمباعة مع ربط سريع بالعقود وتعارضات المصدر.",
    title: "مخزون الوحدات",
  },
  "/users": {
    description: "تهيئة الوصول وإدارة الحسابات قبل بدء المسارات التشغيلية.",
    title: "المستخدمون والصلاحيات",
  },
};

type TopbarProps = {
  lastImportAt: string | null;
  sessionUser: SessionUser;
};

export function Topbar({ lastImportAt, sessionUser }: TopbarProps) {
  const pathname = usePathname();
  const page =
    pathname.startsWith("/imports/")
      ? {
          description: "تفاصيل الدفعة، المراجعة النهائية، وسجل المشكلات قبل أو بعد الاعتماد.",
          title: "تفاصيل دفعة الاستيراد",
        }
      : pathname.startsWith("/customers/")
        ? {
            description: "ملف العميل الكامل: العقود والوحدات والأقساط وسجل المتابعات التشغيلية.",
            title: "ملف العميل",
          }
        : pathname.startsWith("/contracts/")
          ? {
              description: "تفاصيل العقد وما يرتبط به من وحدات وأقساط ومتابعات ميدانية.",
              title: "تفاصيل العقد",
            }
      : PAGE_TITLES[pathname] ?? {
          description: "مساحة عمل داخلية لفريق التحصيل.",
          title: "لوحة المتابعة",
        };
  const primaryRole = getPrimaryRole(sessionUser);

  return (
    <header
      className="flex flex-col gap-4 rounded-2xl bg-white/80 px-6 py-4 glass-nav ambient-shadow lg:flex-row lg:items-center lg:justify-between"
      data-topbar
    >
      <div>
        <h1 className="font-display text-headline-sm font-bold text-on-surface">{page.title}</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">{page.description}</p>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <LastDataUpdate lastImportAt={lastImportAt} />
        <div className="rounded-xl bg-surface-container-low px-4 py-3 text-label-lg text-on-surface-variant">
          <span className="font-semibold text-on-surface">{sessionUser.email ?? sessionUser.fullName}</span>
          <span className="mr-2 text-label-md">{primaryRole ? ROLE_LABELS_AR[primaryRole] : "مستخدم مصادق"}</span>
        </div>
      </div>
    </header>
  );
}
