import Link from "next/link";

import { FilterBar } from "@/components/ui/filter-bar";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { requirePermission } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

const reports = [
  { href: "/reports/aging", title: "أعمار المديونية", description: "توزيع المتأخرات حسب فترات التأخير" },
  { href: "/reports/who-paid", title: "من سدد ومن لم يسدد", description: "موقف كل عميل من السداد" },
  { href: "/reports/overdue", title: "العملاء المتأخرون", description: "قائمة العملاء الذين لديهم أقساط متأخرة" },
  { href: "/reports/penalties", title: "الغرامات", description: "تفاصيل الغرامات المسجلة على الأقساط" },
  { href: "/reports/project-status", title: "موقف كل مشروع", description: "ملخص التحصيل والمتأخرات لكل مشروع" },
  { href: "/reports/collection-notes", title: "ملاحظات التحصيل", description: "آخر ملاحظات المتابعة لكل عميل" },
  { href: "/reports/promises", title: "وعود السداد", description: "العملاء الذين لديهم وعد سداد مفتوح" },
  { href: "/reports/no-follow-up", title: "بدون متابعة", description: "العملاء بدون متابعة منذ فترة محددة" },
] as const;

export default async function ReportsPage() {
  const sessionUser = await getRequiredSessionUser();
  requirePermission(sessionUser, "reports.read");

  return (
    <section className="space-y-6">
      <FilterBar description="اختر التقرير المطلوب من القائمة أدناه." title="التقارير" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {reports.map((report) => (
          <Link
            className="rounded-2xl bg-surface-container-lowest p-5 ambient-shadow transition-all hover:-translate-y-0.5 hover:bg-surface-container-low"
            href={report.href}
            key={report.href}
          >
            <h3 className="font-display text-title-lg text-on-surface">{report.title}</h3>
            <p className="mt-2 text-body-md text-on-surface-variant">{report.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
