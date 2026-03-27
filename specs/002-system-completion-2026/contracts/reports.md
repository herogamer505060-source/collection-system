# Contract: Report Pages

## Purpose
Provide 8 dedicated report pages accessible from `/reports` with project filtering and Arabic labels.

## Reports Index Page

**File**: `src/app/(dashboard)/reports/page.tsx`

Display 8 report cards in a grid. Each card has:
- Arabic title
- Arabic description
- Link to the report page

```tsx
const reports = [
  { href: "/reports/aging", title: "أعمار المديونية", description: "توزيع المتأخرات حسب فترات التأخير" },
  { href: "/reports/who-paid", title: "من سدد ومن لم يسدد", description: "موقف كل عميل من السداد" },
  { href: "/reports/overdue", title: "العملاء المتأخرون", description: "قائمة العملاء الذين لديهم أقساط متأخرة" },
  { href: "/reports/penalties", title: "الغرامات", description: "تفاصيل الغرامات المسجلة على الأقساط" },
  { href: "/reports/project-status", title: "موقف كل مشروع", description: "ملخص التحصيل والمتأخرات لكل مشروع" },
  { href: "/reports/collection-notes", title: "ملاحظات التحصيل", description: "آخر ملاحظات المتابعة لكل عميل" },
  { href: "/reports/promises", title: "وعود السداد", description: "العملاء الذين لديهم وعد سداد مفتوح" },
  { href: "/reports/no-follow-up", title: "بدون متابعة", description: "العملاء بدون متابعة منذ فترة محددة" },
];
```

## Report Page Pattern

Each report page follows this structure:

```tsx
// src/app/(dashboard)/reports/[type]/page.tsx
export const dynamic = "force-dynamic";

export default async function ReportPage({ searchParams }: PageProps) {
  const sessionUser = await getRequiredSessionUser();
  requirePermission(sessionUser, "reports.read");
  const filters = (await searchParams) ?? {};

  const data = await getReportData({ ...filters, sessionUser });

  return (
    <section className="space-y-6">
      <FilterBar title="عنوان التقرير" description="وصف">
        <form action="/reports/[type]" className="flex w-full flex-wrap gap-3">
          {/* Project filter select */}
          <button type="submit">بحث</button>
        </form>
      </FilterBar>

      {/* Optional: Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI summary cards specific to this report */}
      </div>

      {/* Data table */}
      <DataTable columns={columns} rows={data.items} />

      <QueryPagination ... />
    </section>
  );
}
```

## 8 Report Specifications

### 1. Aging Report (`/reports/aging`)
**Query**: `src/server/queries/reports/get-aging-report.ts`

Summary cards: count and amount per delay bucket.
Table columns: العميل | العقد | المشروع | المستحق | المتبقي | أيام التأخير | فئة التأخير

### 2. Who Paid Report (`/reports/who-paid`)
**Query**: `src/server/queries/reports/get-who-paid-report.ts`

Group by customer. Derive status: سدد بالكامل | لديه متبقي | لديه متأخرات
Table columns: العميل | المشروع | المستحق | المحصل | المتبقي | الحالة

### 3. Overdue Customers Report (`/reports/overdue`)
**Query**: `src/server/queries/reports/get-overdue-report.ts`

Filter: installments with `payment_status = "overdue"`, sorted by `delay_days` desc.
Table columns: العميل | العقد | المشروع | نوع القسط | المستحق | المتبقي | أيام التأخير | تاريخ الاستحقاق

### 4. Penalties Report (`/reports/penalties`)
**Query**: `src/server/queries/reports/get-penalties-report.ts`

Filter: installments with `penalty_amount > 0`.
Table columns: العميل | العقد | المشروع | نوع القسط | الغرامة | المستحق | المتبقي

### 5. Project Status Report (`/reports/project-status`)
**Query**: `src/server/queries/reports/get-project-status-report.ts`

Group by project. Show aggregates.
Table columns: المشروع | عدد العقود | المستحق | المحصل | المتبقي | المتأخرات | نسبة التحصيل

### 6. Collection Notes Report (`/reports/collection-notes`)
**Query**: `src/server/queries/reports/get-collection-notes-report.ts`

Show latest follow-up per customer, sorted by date desc.
Table columns: العميل | المشروع | تاريخ المتابعة | الملاحظة | رد العميل | المحصل

### 7. Payment Promises Report (`/reports/promises`)
**Query**: `src/server/queries/reports/get-promises-report.ts`

Filter: follow-ups with `promised_to_pay = true` and `follow_up_status != "done"`.
Table columns: العميل | المشروع | تاريخ الوعد | الملاحظة | المحصل | حالة المتابعة

### 8. No Follow-up Report (`/reports/no-follow-up`)
**Query**: `src/server/queries/reports/get-no-follow-up-report.ts`

Input: `days` threshold (default 30, user-configurable via input field).
Logic: find customers with zero follow-up records (any status) created in last N days.
Table columns: العميل | المشروع | المتبقي | آخر متابعة | أيام بدون متابعة

Extra input in filter bar:
```tsx
<label className="space-y-1">
  <span className="text-xs font-semibold">عدد الأيام</span>
  <input name="days" type="number" defaultValue={30} min={1} className="..." />
</label>
```

## Verification
- All 8 reports accessible from /reports index
- Each report filters by project correctly
- Empty state shown when no data matches filters
- Arabic headers and labels throughout
- No-follow-up report respects configurable day threshold
