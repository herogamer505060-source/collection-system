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
      className="executive-panel glass-nav flex flex-col gap-5 rounded-[30px] px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-7"
      data-topbar
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-primary/10 bg-primary/5 px-3 py-1 font-label text-label-lg uppercase tracking-[0.22em] text-primary/75">
            Operations cockpit
          </span>
        </div>
        <div>
          <h1 className="font-display text-headline-sm font-bold tracking-[-0.02em] text-[hsl(var(--premium-ink))] lg:text-headline-md">{page.title}</h1>
          <p className="mt-2 max-w-3xl text-body-md leading-7 text-on-surface-variant">{page.description}</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 lg:min-w-[340px] lg:max-w-[440px]">
        <LastDataUpdate lastImportAt={lastImportAt} />
        <div className="rounded-[24px] border border-[rgba(188,201,200,0.5)] bg-[rgba(247,249,248,0.92)] px-4 py-3 text-label-lg text-on-surface-variant">
          <div className="text-label-lg uppercase tracking-[0.16em] text-primary/65">Session</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-semibold text-on-surface">{sessionUser.email ?? sessionUser.fullName}</span>
            <span className="rounded-full bg-white px-2.5 py-1 text-label-md text-on-surface-variant">
              {primaryRole ? ROLE_LABELS_AR[primaryRole] : "مستخدم مصادق"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
