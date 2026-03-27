# Tasks: System Completion — Charts, Reports, Exports, CRUD & UX Fixes

**Input**: Design documents from `/specs/002-system-completion-2026/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not explicitly requested. Tests are omitted from this task list. The existing 92+ tests must continue passing.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

> **IMPORTANT FOR EXECUTING MODEL**: This project already has significant infrastructure in place. Many UI components (sidebar, collector names, follow-up delete button, customer edit form, customer notes display) are already built. This task list focuses on what is **actually missing**. Before implementing any task, always read the target file first to understand existing code patterns.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Key Code Patterns (Reference for Every Task)

> **You MUST follow these patterns exactly. Read existing files before writing new ones.**

### Pattern A: Server Page (every new page follows this)
```tsx
// src/app/(dashboard)/[feature]/page.tsx
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { requirePermission } from "@/lib/auth/permissions";
import { FilterBar } from "@/components/ui/filter-bar";
import { QueryPagination } from "@/components/ui/query-pagination";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ [key: string]: string }>;
};

export default async function FeaturePage({ searchParams }: PageProps) {
  const sessionUser = await getRequiredSessionUser();
  const filters = (await searchParams) ?? {};
  // Call query function, render FilterBar + DataTable + QueryPagination
}
```

### Pattern B: Query Function (every new query follows this)
```tsx
// src/server/queries/[feature]/get-[name].ts
import { requirePermission } from "@/lib/auth/permissions";
import { loadReadModelData, paginate } from "@/server/queries/read-model-helpers";
import type { SessionUser } from "@/lib/auth/get-session-user";

export async function getFeatureData(input: { sessionUser: SessionUser; /* filters */ }) {
  requirePermission(input.sessionUser, "reports.read"); // or appropriate permission
  const data = await loadReadModelData();
  // Build maps, filter, derive, paginate
  // Return { items, page, pageSize, totalCount }
}
```

### Pattern C: Service Function (every new mutation service follows this)
```tsx
// src/server/services/[feature]-service.ts
import { z } from "zod";
import type { SessionUser } from "@/lib/auth/get-session-user";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { apiErrorResponse, invalidRequest, notFound, toApiError } from "@/lib/errors/api-error";
import { AuthorizationError, FORBIDDEN_MESSAGE } from "@/lib/auth/permissions";

// 1. Role check (admin/manager only for edits):
function requireAdminOrManager(sessionUser: SessionUser): void {
  const isAllowed = sessionUser.roles.some(
    (a) => a.role === "admin" || a.role === "manager"
  );
  if (!isAllowed) {
    throw new AuthorizationError("forbidden", FORBIDDEN_MESSAGE, 403);
  }
}

// 2. Zod parse → 3. Fetch existing → 4. Build update payload → 5. DB update → 6. Return
```

### Pattern D: API Route (every new API route follows this)
```tsx
// src/app/api/[feature]/[id]/route.ts
import { recordAuditEvent } from "@/lib/auth/audit-log";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ featureId: string }> },
) {
  try {
    const sessionUser = await getRequiredSessionUser();
    const payload = await request.json();
    const { featureId } = await context.params;
    const result = await updateFeature({ featureId, payload, sessionUser });
    recordAuditEvent({ action: "feature.update", actorId: sessionUser.id, entityId: result.id, entityType: "feature" });
    return Response.json(result);
  } catch (error) {
    recordAuditEvent({ action: "feature.update_failed", severity: "warn", metadata: { error: error instanceof Error ? error.message : "unknown" } });
    return handleServiceError(error);
  }
}
```

### Pattern E: Client Form (every new edit form follows this)
```tsx
// src/components/[feature]/[feature]-edit-form.tsx
"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

// useState for form fields, useTransition for submit
// fetch() to API route with method "PATCH" or "DELETE"
// router.refresh() on success
// Error display in rounded-2xl rose-themed div
// Input className: "w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground"
// Card className: "rounded-[1.75rem] border border-border/70 bg-white/80 p-5"
// Button className: "rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
```

### Pattern F: Error Handler (every new service needs one)
```tsx
export function handleFeatureServiceError(error: unknown): Response {
  if (error instanceof z.ZodError) {
    return apiErrorResponse(
      invalidRequest(error.issues[0]?.message ?? "بيانات الطلب غير صحيحة", error.flatten()),
    );
  }
  return apiErrorResponse(toApiError(error));
}
```

---

## Already Implemented (No Tasks Needed)

> The following user stories from spec.md are **already fully implemented** in the codebase. Do NOT create new code for these — they are listed here so you know they are complete.

| Spec Story | Status | Evidence |
|------------|--------|----------|
| **US1**: Collector Name Display (P1) | ✅ Done | `follow-ups-table.tsx:153` shows `collectorName`, `contracts-table.tsx:54` shows `collectorName`, `get-follow-ups-list.ts:108-109` resolves via `profileById` map |
| **US2**: Customer Notes & Edit (P1) | ✅ Done (UI) | `customer-profile-overview.tsx:35-37` displays notes, `customer-edit-form.tsx` full form exists, `customers-service.ts` has `updateCustomer()`, API route at `api/customers/[customerId]/route.ts` exists. **Note**: T002 adds role restriction, T002b hides button for non-admin/manager. |
| **US8**: Follow-up Delete (P3) | ✅ Done (UI) | `follow-ups-table.tsx:36-61` has `handleDelete()` with `window.confirm`, delete button at lines 185-191. **Note**: T003 adds service function, T004 adds API DELETE handler. |
| **US10**: Sidebar Navigation Update (P3) | ✅ Done | `sidebar.tsx:20` already has `{ href: "/reports", label: "التقارير", ready: true }` |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the `reports.read` permission that multiple stories depend on.

- [X] T001 Add `reports.read` permission key to `src/lib/auth/permissions.ts`

  **Exact changes needed in this file:**
  1. Add `| "reports.read"` to the `PermissionKey` union type (after `"admin.users.manage"`)
  2. Add `| "reports"` to the `AppScreen` union type (after `"users"`)
  3. Add `"reports.read"` to **all four** role arrays in `ROLE_PERMISSION_MAP`:
     - `admin: [..., "reports.read"]`
     - `manager: [..., "reports.read"]`
     - `collector: [..., "reports.read"]`
     - `viewer: [..., "reports.read"]`
  4. Add `reports: "reports.read"` to `SCREEN_PERMISSION_MAP` (after `users: "admin.users.manage"`)

  **Verify**: TypeScript compiles with no errors. Run `npx vitest run` — all existing tests pass.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend services that multiple user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Add admin/manager role restriction to customer update service in `src/server/services/customers-service.ts`

  **What to do**: Read the file first. At the **top** of the `updateCustomer()` function (before the existing `requirePermission` call), add:
  ```typescript
  const isAdminOrManager = input.sessionUser.roles.some(
    (a) => a.role === "admin" || a.role === "manager"
  );
  if (!isAdminOrManager) {
    throw new AuthorizationError("forbidden", FORBIDDEN_MESSAGE, 403);
  }
  ```
  **Import needed**: Add `AuthorizationError, FORBIDDEN_MESSAGE` from `@/lib/auth/permissions` to imports.

  **Do NOT** change anything else in this file.

- [X] T002b Hide customer edit button for non-admin/manager roles in `src/app/(dashboard)/customers/[customerId]/page.tsx` and `src/components/customers/customer-profile-overview.tsx`

  **What to do**: Read both files first. Currently the edit button in `CustomerProfileOverview` (line ~40-46) is **always visible** to all roles. Fix this:

  1. In `src/app/(dashboard)/customers/[customerId]/page.tsx`, compute the role check:
     ```typescript
     const canEditCustomer = sessionUser.roles.some(
       (a) => a.role === "admin" || a.role === "manager"
     );
     ```
     Pass it as a new prop: `<CustomerProfileOverview canEditCustomer={canEditCustomer} ... />`

  2. In `src/components/customers/customer-profile-overview.tsx`:
     - Add `canEditCustomer: boolean` to the `CustomerProfileOverviewProps` type
     - Wrap the edit button in a conditional: only render if `canEditCustomer` is true
     - Also wrap the `CustomerEditForm` rendering in the same conditional
     ```tsx
     {canEditCustomer ? (
       <button onClick={() => setIsEditingCustomer(true)} ...>تعديل بيانات العميل</button>
     ) : null}
     ```

  **Why**: FR-002 requires "Collector and viewer roles MUST NOT see the edit button." T002 restricts the service layer, but without this task the button is still visible (just returns 403 on submit).

- [X] T003 Add `deleteFollowUp()` function and `deleteFollowUpRow()` helper to `src/server/services/follow-ups-service.ts`

  **What to do**: Read the file first. Add these at the bottom, **after** the existing `updateFollowUpRow()` function:

  1. Add a `deleteFollowUp()` export function that:
     - Takes `{ followUpId: string; sessionUser: SessionUser }` and dependencies (like `updateFollowUp` does)
     - Fetches the follow-up by ID (reuse existing `getFollowUpById`)
     - Throws `notFound()` if missing
     - Resolves project ID (reuse existing `resolveFollowUpProjectId` pattern from `updateFollowUp`)
     - Calls `assertCanUpdateFollowUp()` (same permission as update)
     - Calls `deleteFollowUpRow()` to hard-delete
     - Returns `{ id: followUpId }`

  2. Add a private `deleteFollowUpRow()` helper:
     ```typescript
     async function deleteFollowUpRow(
       followUpId: string,
       client: AdminClient = createAdminSupabaseClient(),
     ): Promise<void> {
       const { error } = await client.from("follow_ups").delete().eq("id", followUpId);
       if (error) {
         throw new Error(error.message);
       }
     }
     ```

  **Follow the exact same coding style** as `updateFollowUp()` in the same file.

- [X] T004 Add DELETE handler to `src/app/api/follow-ups/[followUpId]/route.ts`

  **What to do**: Read the file first. It already has a `PATCH` export. Add a `DELETE` export after it:
  ```typescript
  export async function DELETE(
    _request: Request,
    context: { params: Promise<{ followUpId: string }> },
  ) {
    try {
      const sessionUser = await getRequiredSessionUser();
      const { followUpId } = await context.params;
      const result = await deleteFollowUp({ followUpId, sessionUser });

      recordAuditEvent({
        action: "follow_up.deleted",
        actorId: sessionUser.id,
        entityId: result.id,
        entityType: "follow_up",
      });

      return Response.json({ success: true });
    } catch (error) {
      recordAuditEvent({
        action: "follow_up.delete_failed",
        severity: "warn",
        metadata: { error: error instanceof Error ? error.message : "unknown_error" },
      });
      return handleFollowUpServiceError(error);
    }
  }
  ```
  **Import needed**: Add `deleteFollowUp` to the import from `@/server/services/follow-ups-service`.

**Checkpoint**: Foundation ready — follow-up delete works end-to-end, customer edit is role-restricted. Run `npx vitest run` to confirm no regressions.

---

## Phase 3: User Story 3 - Installment Payment Recording (Priority: P1) 🎯 MVP

**Goal**: Allow admin/manager to record payments against installments with automatic recalculation of status, outstanding, delay days, and delay bucket.

**Independent Test**: Open the installments page → click edit on an installment → enter amount collected and payment date → save → verify status changes and outstanding recalculates.

**Contract Reference**: `specs/002-system-completion-2026/contracts/installment-edit.md`

### Implementation for User Story 3

- [X] T005 [US3] Create installment edit Zod schema in `src/features/installments/schemas/installment-form.ts`

  **Create this new file** with:
  ```typescript
  import { z } from "zod";

  export const updateInstallmentSchema = z.object({
    amountCollected: z.number().min(0, "المبلغ المحصل يجب أن يكون صفر أو أكثر").optional(),
    paymentDate: z.string().nullable().optional(),
    penaltyAmount: z.number().min(0, "الغرامة يجب أن تكون صفر أو أكثر").nullable().optional(),
    receiptReference: z.string().trim().nullable().optional(),
  });

  export type UpdateInstallmentInput = z.infer<typeof updateInstallmentSchema>;
  ```

- [X] T006 [US3] Create installment update service in `src/server/services/installments-service.ts`

  **Create this new file.** Follow Pattern C exactly. The service must:

  1. Import and use existing derivation functions:
     - `derivePaymentStatus` from `@/features/installments/derive-payment-status`
     - `deriveDelayDays` from `@/features/installments/derive-delay-days`
     - `deriveDelayBucket` from `@/features/installments/derive-delay-bucket`

  2. **Exact function signatures** (so you don't need to read the source files):
     ```typescript
     // derive-payment-status.ts
     type DerivePaymentStatusInput = {
       amountCollected?: number | null;
       amountDue?: number | null;
       amountOutstanding?: number | null;
       dueDate: Date | string;
       today?: Date | string;
     };
     function derivePaymentStatus(input: DerivePaymentStatusInput): "paid" | "partial" | "unpaid" | "overdue";

     // derive-delay-days.ts — same input type as derivePaymentStatus
     function deriveDelayDays(input: DerivePaymentStatusInput): number;

     // derive-delay-bucket.ts
     function deriveDelayBucket(delayDays: number): "not_due" | "1_30" | "31_60" | "61_90" | "90_plus";
     ```

  3. `updateInstallment()` function:
     - Call `requireAdminOrManager(input.sessionUser)` (define this helper in the file, same pattern as in `follow-ups-service.ts:198-199`)
     - Parse with `updateInstallmentSchema`
     - Fetch existing installment by ID using supabase admin client
     - Calculate:
       - `amountCollected = parsed.amountCollected ?? existing.amount_collected`
       - `amountOutstanding = Math.max(0, existing.amount_due - amountCollected)`
       - `const statusInput = { amountCollected, amountDue: existing.amount_due, amountOutstanding, dueDate: existing.due_date };`
       - `paymentStatus = derivePaymentStatus(statusInput)`
       - `delayDays = deriveDelayDays(statusInput)`
       - `delayBucket = deriveDelayBucket(delayDays)`
     - Build update payload with ALL recalculated fields + optional `payment_date`, `receipt_reference`, `penalty_amount`
     - Update via supabase admin client
     - Return updated installment
  4. Export `handleInstallmentServiceError()` following Pattern F.

- [X] T007 [US3] Create installment update API route in `src/app/api/installments/[installmentId]/route.ts`

  **Create this new file.** Follow Pattern D exactly:
  - `PATCH` handler
  - Call `updateInstallment()` from the service
  - Record audit event with `action: "installment.update"`
  - Handle errors with `handleInstallmentServiceError()`

- [X] T008 [US3] Create installment edit form component in `src/components/installments/installment-edit-form.tsx`

  **Create this new file.** Follow Pattern E exactly. Copy the structure from `src/components/customers/customer-edit-form.tsx` and adapt:

  Props:
  ```typescript
  type InstallmentEditFormProps = {
    installmentId: string;
    initialValues: {
      amountCollected: number;
      amountDue: number;       // read-only display
      paymentDate?: string | null;
      penaltyAmount?: number | null;
      receiptReference?: string | null;
    };
    onCancel?: () => void;
    onSuccess?: () => void;
  };
  ```

  Form fields (all Arabic labels):
  - "المبلغ المحصل" — number input → `amountCollected`
  - "تاريخ الدفع" — date input → `paymentDate`
  - "مرجع الإيصال" — text input → `receiptReference`
  - "الغرامة" — number input → `penaltyAmount`

  Read-only display above the form:
  - "المستحق": `formatCurrency(initialValues.amountDue)`
  - "المتبقي (تقريبي)": `formatCurrency(Math.max(0, initialValues.amountDue - amountCollected))`  — recalculate live as user types

  Submit: `fetch(\`/api/installments/${installmentId}\`, { method: "PATCH", body: JSON.stringify({...}) })`

  Title: `"تسجيل دفعة"` / Button: `"حفظ الدفعة"`

- [X] T009 [US3] Integrate installment edit form into installments table in `src/components/installments/installments-table.tsx`

  **What to do**: Read the file first. It currently has no edit capability. Add:
  1. Accept a new prop `canEdit?: boolean` (default false)
  2. If `canEdit` is true, add an action column with an "تسجيل دفعة" button per row
  3. Use `useState` to track which installment is being edited (like follow-ups-table.tsx does with `editingFollowUpId`)
  4. When button clicked, show `InstallmentEditForm` below the table (or inline)
  5. On success, call `router.refresh()`

  **Reference**: Look at how `src/components/follow-ups/follow-ups-table.tsx` handles `editingFollowUpId` state for the exact pattern.

- [X] T010 [US3] Pass `canEdit` prop from installments page in `src/app/(dashboard)/installments/page.tsx`

  **What to do**: Read the file first. Add role check:
  ```typescript
  const canEdit = sessionUser.roles.some(
    (a) => a.role === "admin" || a.role === "manager"
  );
  ```
  Pass `canEdit={canEdit}` to `<InstallmentsTable>`.

  Also do the same in `src/app/(dashboard)/contracts/[contractId]/page.tsx` where `<InstallmentsTable>` is used.

- [X] T010b [US3] Write unit test for installment update recalculation in `tests/unit/installments/update-installment-recalculation.test.ts`

  **Create this new file.** This test validates the composition of derivation functions in the update service (Constitution Principle VI: critical business paths need automated tests).

  Test cases (use vitest + the project's existing test helpers):
  1. **Partial payment**: Given `amount_due=100000`, when `amount_collected=40000`, then `amount_outstanding=60000`, `payment_status="partial"` (or "overdue" if past due)
  2. **Full payment**: Given `amount_due=100000`, when `amount_collected=100000`, then `amount_outstanding=0`, `payment_status="paid"`, `delay_days=0`, `delay_bucket="not_due"`
  3. **Overpayment clamp**: Given `amount_due=100000`, when `amount_collected=120000`, then `amount_outstanding=0` (clamped, not negative), `payment_status="paid"`
  4. **Overdue reset**: Given an overdue installment (due_date in the past), when fully paid, then `delay_days=0`, `delay_bucket="not_due"`
  5. **Negative amount rejected**: Given `amount_collected=-5000`, then Zod validation throws error

  **Pattern**: Look at `tests/unit/installments/payment-status.test.ts` and `tests/unit/installments/delay-days.test.ts` for the existing test style. Import the derivation functions directly and test the composition that the service will use.

  **Note**: You can test the derivation logic directly (without mocking DB) since the derivation functions are pure functions. The service's role check and DB operations can be tested separately if needed.

**Checkpoint**: Installment payment recording works end-to-end. Admin/manager can record payments, status recalculates, dashboard KPIs update after page refresh. Recalculation logic has automated test coverage.

---

## Phase 4: User Story 4 - Dashboard Charts (Priority: P2)

**Goal**: Add a bar chart (collection by project) and pie chart (aging distribution) to the dashboard below the KPI grid.

**Independent Test**: Open the dashboard → see two charts below KPI cards → change project filter → charts update.

**Contract Reference**: `specs/002-system-completion-2026/contracts/dashboard-charts.md`

### Implementation for User Story 4

- [X] T011 [P] [US4] Create chart data query in `src/server/queries/dashboard/get-dashboard-charts.ts`

  **Create this new file.** Follow Pattern B. Read `src/server/queries/dashboard/get-dashboard-kpis.ts` first to see the existing dashboard query pattern.

  Return type:
  ```typescript
  type ProjectChartItem = { projectName: string; collected: number; outstanding: number };
  type AgingChartItem = { bucket: string; bucketLabel: string; amount: number; count: number };
  // Return: { byProject: ProjectChartItem[]; byAging: AgingChartItem[] }
  ```

  For `byProject`: group installments by contract → project, sum `amount_collected` and `amount_outstanding` per project.
  For `byAging`: group installments where `amount_outstanding > 0` by `delay_bucket`, sum `amount_outstanding` and count.

  Aging bucket Arabic labels:
  ```typescript
  const BUCKET_LABELS: Record<string, string> = {
    not_due: "غير مستحق",
    "1_30": "1-30 يوم",
    "31_60": "31-60 يوم",
    "61_90": "61-90 يوم",
    "90_plus": "أكثر من 90 يوم",
  };
  ```

  Support `projectId` filter (same as dashboard KPIs).

- [X] T012 [P] [US4] Create collection-by-project bar chart component in `src/components/dashboard/collection-by-project-chart.tsx`

  **Create this new file.** This is a `"use client"` component using `recharts`.

  ```tsx
  "use client";
  import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
  import { formatCurrency } from "@/lib/formatting/currency";
  ```

  Props: `{ data: { projectName: string; collected: number; outstanding: number }[] }`

  - `ResponsiveContainer` with `height={300}`
  - `BarChart` with two `Bar` components:
    - Collected: `dataKey="collected"`, `fill="#10b981"`, legend name `"المحصل"`
    - Outstanding: `dataKey="outstanding"`, `fill="#f59e0b"`, legend name `"المتبقي"`
  - `XAxis dataKey="projectName"`
  - Custom `Tooltip` formatter using `formatCurrency()`
  - If `data` is empty, render: `<div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">لا توجد بيانات للعرض</div>`

- [X] T013 [P] [US4] Create aging distribution pie chart component in `src/components/dashboard/aging-distribution-chart.tsx`

  **Create this new file.** This is a `"use client"` component using `recharts`.

  ```tsx
  "use client";
  import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
  import { formatCurrency } from "@/lib/formatting/currency";
  ```

  Props: `{ data: { bucketLabel: string; amount: number; count: number }[] }`

  Colors by index: `["#22c55e", "#eab308", "#f97316", "#ef4444", "#991b1b"]`

  - `ResponsiveContainer` with `height={300}`
  - `PieChart` with `Pie` using `dataKey="amount"`, `nameKey="bucketLabel"`
  - `Cell` components for each entry with corresponding color
  - Custom `Tooltip` showing bucket label + `formatCurrency(amount)` + count
  - If `data` is empty, render empty state like the bar chart above.

- [X] T014 [US4] Integrate charts into dashboard page in `src/app/(dashboard)/dashboard/page.tsx`

  **What to do**: Read the file first. After the existing `<KpiGrid kpis={kpis} />` and before the grid with `<TopOverdueCustomers>` / `<RecentFollowUps>`, add:

  1. Import the chart data query and both chart components
  2. Call `getDashboardCharts({ sessionUser, projectId })` alongside the existing `getDashboardKpis` call (add to the `Promise.all`)
  3. Add this JSX after `<KpiGrid>`:
  ```tsx
  <div className="grid gap-6 lg:grid-cols-2">
    <div className="rounded-[1.75rem] border border-border/70 bg-white/80 p-5">
      <h3 className="font-display text-lg font-bold text-foreground mb-4">التحصيل حسب المشروع</h3>
      <CollectionByProjectChart data={chartData.byProject} />
    </div>
    <div className="rounded-[1.75rem] border border-border/70 bg-white/80 p-5">
      <h3 className="font-display text-lg font-bold text-foreground mb-4">توزيع المتأخرات</h3>
      <AgingDistributionChart data={chartData.byAging} />
    </div>
  </div>
  ```

**Checkpoint**: Dashboard shows KPI cards + two charts. Charts respond to project filter.

---

## Phase 5: User Story 5 - Report Pages (Priority: P2)

**Goal**: Create a reports section with 8 dedicated report pages accessible from `/reports`.

**Independent Test**: Navigate to `/reports` → see 8 report cards → open each report → verify data and project filter work.

**Contract Reference**: `specs/002-system-completion-2026/contracts/reports.md`

### Implementation for User Story 5

- [X] T015 [US5] Create reports index page in `src/app/(dashboard)/reports/page.tsx`

  **Create this new file.** Follow Pattern A. This is a simple grid of 8 linked cards:

  ```typescript
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

  Render as a grid of link cards:
  ```tsx
  <section className="space-y-6">
    <FilterBar title="التقارير" description="اختر التقرير المطلوب من القائمة أدناه." />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {reports.map((report) => (
        <Link key={report.href} href={report.href}
          className="rounded-[1.75rem] border border-border/70 bg-white/80 p-5 transition hover:shadow-md">
          <h3 className="font-display text-lg font-bold text-foreground">{report.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{report.description}</p>
        </Link>
      ))}
    </div>
  </section>
  ```

  Permission check: `requirePermission(sessionUser, "reports.read")`

- [X] T016 [P] [US5] Create aging report query in `src/server/queries/reports/get-aging-report.ts`

  **Create this new file.** Follow Pattern B.
  - Load read model data
  - Filter installments where `amount_outstanding > 0`
  - Join with contracts → customers → projects (via maps)
  - Support `projectId` filter
  - Return items with: customerName, contractCode, projectName, amountDue, amountOutstanding, delayDays, delayBucket
  - Also return summary: count and total amount per delay bucket
  - Sort by `delay_days` descending

- [X] T017 [P] [US5] Create who-paid report query in `src/server/queries/reports/get-who-paid-report.ts`

  **Create this new file.** Follow Pattern B.
  - Group installments by customer (via contract → customer)
  - For each customer: sum amountDue, amountCollected, amountOutstanding
  - Derive status per customer: "سدد بالكامل" (outstanding=0), "لديه متبقي" (outstanding>0, no overdue), "لديه متأخرات" (has overdue installments)
  - Support `projectId` filter
  - Sort by amountOutstanding descending

- [X] T018 [P] [US5] Create overdue report query in `src/server/queries/reports/get-overdue-report.ts`

  **Create this new file.** Follow Pattern B.
  - Filter installments where `payment_status === "overdue"`
  - Join with contracts → customers → projects
  - Support `projectId` filter
  - Return: customerName, contractCode, projectName, installmentType, amountDue, amountOutstanding, delayDays, dueDate
  - Sort by `delay_days` descending

- [X] T019 [P] [US5] Create penalties report query in `src/server/queries/reports/get-penalties-report.ts`

  **Create this new file.** Follow Pattern B.
  - Filter installments where `penalty_amount > 0`
  - Join with contracts → customers → projects
  - Support `projectId` filter
  - Return: customerName, contractCode, projectName, installmentType, penaltyAmount, amountDue, amountOutstanding

- [X] T020 [P] [US5] Create project status report query in `src/server/queries/reports/get-project-status-report.ts`

  **Create this new file.** Follow Pattern B.
  - Group all installments by project (via contract → project)
  - Per project: contractCount, amountDue, amountCollected, amountOutstanding, overdueAmount, collectionPercentage
  - No projectId filter needed (this report shows all projects)

- [X] T021 [P] [US5] Create collection notes report query in `src/server/queries/reports/get-collection-notes-report.ts`

  **Create this new file.** Follow Pattern B.
  - Get the latest follow-up per customer (sort by follow_up_date desc, take first per customer)
  - Join with contracts → projects, resolve collector name from profiles
  - Support `projectId` filter
  - Return: customerName, projectName, followUpDate, note, customerResponse, collectorName
  - Sort by followUpDate descending

- [X] T022 [P] [US5] Create promises report query in `src/server/queries/reports/get-promises-report.ts`

  **Create this new file.** Follow Pattern B.
  - Filter follow-ups where `promised_to_pay === true` and `follow_up_status !== "done"`
  - Join with customers, resolve project name, resolve collector name
  - Support `projectId` filter
  - Return: customerName, projectName, promiseDate, note, collectorName, followUpStatus
  - Sort by promiseDate ascending (soonest first)

- [X] T023 [P] [US5] Create no-follow-up report query in `src/server/queries/reports/get-no-follow-up-report.ts`

  **Create this new file.** Follow Pattern B.
  - Input: `days` threshold (default 30)
  - Calculate cutoff date: `today - days` days
  - For each customer: find follow-ups created after cutoff (any status: open, done, missed)
  - Customers with ZERO follow-ups after cutoff = "no follow-up"
  - Join with contracts for outstanding totals and project name
  - Support `projectId` filter
  - Return: customerName, projectName, amountOutstanding, lastFollowUpDate (ever), daysSinceLastFollowUp
  - Sort by daysSinceLastFollowUp descending

- [X] T024 [US5] Create aging report page in `src/app/(dashboard)/reports/aging/page.tsx`

  **Create this new file.** Follow Pattern A.
  - Call `getAgingReport({ sessionUser, projectId })`
  - Show summary cards: one per delay bucket with count and total amount
  - Show DataTable with columns: العميل | العقد | المشروع | المستحق | المتبقي | أيام التأخير | فئة التأخير
  - FilterBar with project filter select
  - Pagination
  - Read `src/app/(dashboard)/installments/page.tsx` for the exact page pattern to follow.

- [X] T025 [US5] Create who-paid report page in `src/app/(dashboard)/reports/who-paid/page.tsx`

  **Create this new file.** Follow Pattern A.
  - Call `getWhoPaidReport({ sessionUser, projectId })`
  - DataTable columns: العميل | المشروع | المستحق | المحصل | المتبقي | الحالة
  - Status column uses `StatusBadge`: "سدد بالكامل" (success) / "لديه متبقي" (warning) / "لديه متأخرات" (danger)

- [X] T026 [US5] Create overdue report page in `src/app/(dashboard)/reports/overdue/page.tsx`

  **Create this new file.** Follow Pattern A.
  - Call `getOverdueReport({ sessionUser, projectId })`
  - DataTable columns: العميل | العقد | المشروع | نوع القسط | المستحق | المتبقي | أيام التأخير | تاريخ الاستحقاق

- [X] T027 [US5] Create penalties report page in `src/app/(dashboard)/reports/penalties/page.tsx`

  **Create this new file.** Follow Pattern A.
  - Call `getPenaltiesReport({ sessionUser, projectId })`
  - DataTable columns: العميل | العقد | المشروع | نوع القسط | الغرامة | المستحق | المتبقي

- [X] T028 [US5] Create project status report page in `src/app/(dashboard)/reports/project-status/page.tsx`

  **Create this new file.** Follow Pattern A.
  - Call `getProjectStatusReport({ sessionUser })`
  - DataTable columns: المشروع | عدد العقود | المستحق | المحصل | المتبقي | المتأخرات | نسبة التحصيل
  - No project filter (this report shows all projects by definition)

- [X] T029 [US5] Create collection notes report page in `src/app/(dashboard)/reports/collection-notes/page.tsx`

  **Create this new file.** Follow Pattern A.
  - Call `getCollectionNotesReport({ sessionUser, projectId })`
  - DataTable columns: العميل | المشروع | تاريخ المتابعة | الملاحظة | رد العميل | المحصل

- [X] T030 [US5] Create promises report page in `src/app/(dashboard)/reports/promises/page.tsx`

  **Create this new file.** Follow Pattern A.
  - Call `getPromisesReport({ sessionUser, projectId })`
  - DataTable columns: العميل | المشروع | تاريخ الوعد | الملاحظة | المحصل | حالة المتابعة

- [X] T031 [US5] Create no-follow-up report page in `src/app/(dashboard)/reports/no-follow-up/page.tsx`

  **Create this new file.** Follow Pattern A.
  - Call `getNoFollowUpReport({ sessionUser, projectId, days })`
  - Extra filter input in FilterBar: `<input name="days" type="number" defaultValue={30} min={1} />` with label "عدد الأيام"
  - DataTable columns: العميل | المشروع | المتبقي | آخر متابعة | أيام بدون متابعة

**Checkpoint**: All 8 reports work. Each has project filtering and Arabic labels. Reports index at /reports shows all 8 cards.

---

## Phase 6: User Story 6 - Excel/CSV Export (Priority: P2)

**Goal**: Export any list page or report to Excel (.xlsx) or CSV with Arabic headers.

**Independent Test**: Open installments page → click "تصدير Excel" → verify .xlsx file downloads with Arabic headers and correct data.

**Contract Reference**: `specs/002-system-completion-2026/contracts/export.md`

### Implementation for User Story 6

- [X] T032 [P] [US6] Create Excel exporter in `src/features/exports/excel-exporter.ts`

  **Create this new file.**
  ```typescript
  import ExcelJS from "exceljs";

  type ExportColumn = { header: string; key: string; width?: number };

  export async function generateExcel(
    columns: ExportColumn[],
    rows: Record<string, unknown>[],
    sheetName: string,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName);
    sheet.columns = columns.map((col) => ({ header: col.header, key: col.key, width: col.width ?? 20 }));
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { horizontal: "right" };
    sheet.views = [{ rightToLeft: true }];
    rows.forEach((row) => sheet.addRow(row));
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
  ```

- [X] T033 [P] [US6] Create CSV exporter in `src/features/exports/csv-exporter.ts`

  **Create this new file.**
  ```typescript
  type ExportColumn = { header: string; key: string };

  export function generateCsv(columns: ExportColumn[], rows: Record<string, unknown>[]): string {
    const BOM = "\uFEFF";
    const headerLine = columns.map((c) => escapeCell(c.header)).join(",");
    const dataLines = rows.map((row) =>
      columns.map((c) => escapeCell(String(row[c.key] ?? ""))).join(",")
    );
    return BOM + [headerLine, ...dataLines].join("\n");
  }

  function escapeCell(value: string): string {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
  ```

- [X] T034 [P] [US6] Create export column definitions in `src/features/exports/column-definitions.ts`

  **Create this new file.** Define Arabic column headers for each exportable entity:

  ```typescript
  type ExportColumn = { header: string; key: string; width?: number };

  export const EXPORT_COLUMNS: Record<string, ExportColumn[]> = {
    customers: [
      { header: "اسم العميل", key: "customerName", width: 30 },
      { header: "رقم الجوال", key: "mobile", width: 15 },
      { header: "البريد الإلكتروني", key: "email", width: 25 },
      { header: "المتبقي", key: "outstanding", width: 15 },
      { header: "الحالة", key: "status", width: 15 },
    ],
    contracts: [
      { header: "كود العقد", key: "contractCode", width: 15 },
      { header: "العميل", key: "customerName", width: 30 },
      { header: "المشروع", key: "projectName", width: 15 },
      { header: "المحصل", key: "collectorName", width: 20 },
      { header: "المستحق", key: "amountDue", width: 15 },
      { header: "المحصل", key: "amountCollected", width: 15 },
      { header: "المتبقي", key: "amountOutstanding", width: 15 },
    ],
    installments: [
      { header: "العميل", key: "customerName", width: 30 },
      { header: "العقد", key: "contractCode", width: 15 },
      { header: "المشروع", key: "projectName", width: 15 },
      { header: "نوع القسط", key: "installmentType", width: 15 },
      { header: "تاريخ الاستحقاق", key: "dueDate", width: 15 },
      { header: "المستحق", key: "amountDue", width: 15 },
      { header: "المحصل", key: "amountCollected", width: 15 },
      { header: "المتبقي", key: "amountOutstanding", width: 15 },
      { header: "الحالة", key: "paymentStatus", width: 12 },
      { header: "الغرامة", key: "penaltyAmount", width: 12 },
    ],
    "follow-ups": [
      { header: "العميل", key: "customerName", width: 30 },
      { header: "تاريخ المتابعة", key: "followUpDate", width: 15 },
      { header: "نوع التواصل", key: "contactType", width: 15 },
      { header: "الملاحظة", key: "note", width: 40 },
      { header: "المحصل", key: "collectorName", width: 20 },
      { header: "الحالة", key: "followUpStatus", width: 12 },
    ],
    units: [
      { header: "كود الوحدة", key: "unitCode", width: 15 },
      { header: "المشروع", key: "projectName", width: 15 },
      { header: "الحالة", key: "unitStatus", width: 12 },
      { header: "المساحة", key: "builtUpArea", width: 12 },
      { header: "السعر", key: "listPrice", width: 15 },
    ],
  };
  ```
  Add more entries for each report type as needed (aging, who-paid, etc.).

- [X] T035 [US6] Create export API route in `src/app/api/export/route.ts`

  **Create this new file.**

  ```typescript
  // POST handler:
  // 1. getRequiredSessionUser()
  // 2. Parse body: { type: string; format: "xlsx" | "csv"; filters?: Record<string, string> }
  // 3. Based on type, call the appropriate existing query function to get data
  //    e.g., type "installments" → call getInstallmentsList()
  //    e.g., type "aging" → call getAgingReport()
  // 4. Get column definitions from EXPORT_COLUMNS
  // 5. If format is "xlsx": call generateExcel(), return with Content-Type + Content-Disposition headers
  // 6. If format is "csv": call generateCsv(), return with Content-Type + Content-Disposition headers
  // 7. File name: `${type}-${new Date().toISOString().slice(0, 10)}.${format}`
  ```

  **Important**: For each export type, use the SAME query functions that the pages use. Do NOT duplicate data loading logic. Import from the existing query modules. Pass `pageSize: 10000` to get all rows (not paginated).

  **Explicit type → query function mapping** (import each from its module):
  ```typescript
  const EXPORT_QUERY_MAP = {
    "customers":         () => getCustomersList(...)        // from src/server/queries/customers/get-customers-list
    "contracts":         () => getContractsList(...)        // from src/server/queries/contracts/get-contracts-list
    "installments":      () => getInstallmentsList(...)     // from src/server/queries/installments/get-installments-list
    "follow-ups":        () => getFollowUpsList(...)        // from src/server/queries/follow-ups/get-follow-ups-list
    "units":             () => getUnitsList(...)            // from src/server/queries/units/get-units-list
    "aging":             () => getAgingReport(...)          // from src/server/queries/reports/get-aging-report
    "who-paid":          () => getWhoPaidReport(...)        // from src/server/queries/reports/get-who-paid-report
    "overdue":           () => getOverdueReport(...)        // from src/server/queries/reports/get-overdue-report
    "penalties":         () => getPenaltiesReport(...)      // from src/server/queries/reports/get-penalties-report
    "project-status":    () => getProjectStatusReport(...)  // from src/server/queries/reports/get-project-status-report
    "collection-notes":  () => getCollectionNotesReport(...)// from src/server/queries/reports/get-collection-notes-report
    "promises":          () => getPromisesReport(...)       // from src/server/queries/reports/get-promises-report
    "no-follow-up":      () => getNoFollowUpReport(...)    // from src/server/queries/reports/get-no-follow-up-report
  };
  ```
  Each call receives `{ sessionUser, ...filters, pageSize: 10000 }`. Extract `.items` from the result for the export rows.

- [X] T036 [US6] Create export button component in `src/components/ui/export-button.tsx`

  **Create this new file.** Follow Pattern E for client component.

  ```typescript
  type ExportButtonProps = {
    exportType: string;
    filters?: Record<string, string>;
  };
  ```

  Two buttons side by side: "تصدير Excel" and "CSV".
  On click: POST to `/api/export`, receive blob, create download link, click it.
  Loading state: `disabled:opacity-60` + text changes to "جاري التصدير..."

- [X] T037 [US6] Add export buttons to all list pages and report pages

  **What to do**: Add `<ExportButton>` to the `actions` prop of `<FilterBar>` on each page:
  - `src/app/(dashboard)/customers/page.tsx` — `exportType="customers"`
  - `src/app/(dashboard)/contracts/page.tsx` — `exportType="contracts"`
  - `src/app/(dashboard)/installments/page.tsx` — `exportType="installments"`
  - `src/app/(dashboard)/follow-ups/page.tsx` — `exportType="follow-ups"`
  - `src/app/(dashboard)/units/page.tsx` — `exportType="units"`
  - All 8 report pages — with their respective export types

  Pass current `filters` from `searchParams` to each `<ExportButton>`.

**Checkpoint**: Export works from every page. Excel has Arabic headers in RTL. CSV opens correctly in Excel with Arabic text.

---

## Phase 7: User Story 7 - Contract Editing (Priority: P3)

**Goal**: Allow admin/manager to edit contract details: notes, delivery date, collector assignment, status.

**Independent Test**: Open a contract detail page → click edit → change notes and collector → save → verify changes persist.

**Contract Reference**: `specs/002-system-completion-2026/contracts/contract-edit.md`

### Implementation for User Story 7

- [X] T038 [P] [US7] Create contract edit Zod schema in `src/features/contracts/schemas/contract-form.ts`

  **Create this new file:**
  ```typescript
  import { z } from "zod";

  export const updateContractSchema = z.object({
    collectorUserId: z.string().uuid("معرف المحصل غير صالح").nullable().optional(),
    contractNotes: z.string().trim().nullable().optional(),
    contractStatus: z.enum(["active", "closed", "cancelled", "suspended"]).optional(),
    deliveryDate: z.string().nullable().optional(),
  });

  export type UpdateContractInput = z.infer<typeof updateContractSchema>;
  ```

- [X] T039 [P] [US7] Create contract update service in `src/server/services/contracts-service.ts`

  **Create this new file.** Follow Pattern C exactly. Copy structure from `src/server/services/customers-service.ts`:

  1. `requireAdminOrManager()` check
  2. Parse with `updateContractSchema`
  3. Fetch existing contract by ID
  4. Build update payload for changed fields only: `contract_notes`, `delivery_date`, `collector_user_id`, `contract_status`
  5. Update via supabase admin client
  6. Return updated contract
  7. Export `handleContractServiceError()` (Pattern F)

- [X] T040 [US7] Create contract update API route in `src/app/api/contracts/[contractId]/route.ts`

  **Create this new file.** Follow Pattern D:
  - `PATCH` handler
  - Call `updateContract()` from service
  - Audit event: `action: "contract.update"`

- [X] T041 [US7] Create contract edit form component in `src/components/contracts/contract-edit-form.tsx`

  **Create this new file.** Follow Pattern E. Copy structure from `src/components/customers/customer-edit-form.tsx`.

  Props:
  ```typescript
  type ContractEditFormProps = {
    contractId: string;
    initialValues: {
      collectorUserId?: string | null;
      contractNotes?: string | null;
      contractStatus: string;
      deliveryDate?: string | null;
    };
    onCancel?: () => void;
    onSuccess?: () => void;
    profileOptions: { id: string; label: string }[];  // for collector dropdown
  };
  ```

  Fields:
  - "ملاحظات العقد" — textarea → `contractNotes`
  - "تاريخ التسليم" — date input → `deliveryDate`
  - "المحصل المسؤول" — select from `profileOptions` → `collectorUserId`
  - "حالة العقد" — select with options: `نشط` (active), `مغلق` (closed), `ملغي` (cancelled), `معلق` (suspended)

- [X] T042 [US7] Integrate contract edit form in contract detail page in `src/app/(dashboard)/contracts/[contractId]/page.tsx`

  **What to do**: Read the file first. This is a server component, so the edit form needs careful integration:

  1. Add role check: `const canEdit = sessionUser.roles.some(a => a.role === "admin" || a.role === "manager")`
  2. Load profiles for the collector dropdown: extract from `loadReadModelData()` (or add to the existing `getContractDetail` return)
  3. Create a small client wrapper component (like `CustomerProfileOverview` does) that manages the `isEditing` state
  4. Or simpler: convert the contract detail section into a client component that toggles between view/edit
  5. Show edit button only when `canEdit` is true

**Checkpoint**: Contract editing works for admin/manager. Collector dropdown shows names. Role restrictions enforced.

---

## Phase 8: User Story 9 - Print/PDF Support (Priority: P3)

**Goal**: Add print-friendly CSS and print buttons to report pages.

**Independent Test**: Open a report → click "طباعة / PDF" → browser print dialog opens → preview shows clean layout without sidebar.

**Contract Reference**: `specs/002-system-completion-2026/contracts/print-sidebar.md`

### Implementation for User Story 9

- [X] T043 [P] [US9] Add print CSS to `src/app/globals.css`

  **What to do**: Read the file first. Add at the **end** of the file:

  ```css
  @media print {
    nav,
    [data-sidebar],
    [data-topbar],
    .no-print,
    button,
    .filter-bar form {
      display: none !important;
    }

    body {
      background: white !important;
    }

    main {
      padding: 0 !important;
      margin: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
    }

    table {
      font-size: 10pt !important;
      width: 100% !important;
    }

    th, td {
      padding: 4px 8px !important;
      border: 1px solid #ccc !important;
    }

    html {
      direction: rtl !important;
    }

    @page {
      margin: 1cm;
      size: A4 landscape;
    }
  }
  ```

- [X] T044 [US9] Add print buttons to report pages

  **What to do**: In each of the 8 report pages created in Phase 5, add a print button to the FilterBar actions area:

  ```tsx
  <button
    className="rounded-2xl border border-border/70 bg-background px-4 py-2 text-sm font-semibold no-print"
    onClick={() => window.print()}
    type="button"
  >
    طباعة / PDF
  </button>
  ```

  **Note**: This button is a client-side `onClick` handler. Since report pages are server components, you have two options:
  1. Create a tiny `"use client"` `PrintButton` component
  2. Or wrap the button in a client component

  Recommended: Create `src/components/ui/print-button.tsx`:
  ```tsx
  "use client";
  export function PrintButton() {
    return (
      <button
        className="rounded-2xl border border-border/70 bg-background px-4 py-2 text-sm font-semibold no-print"
        onClick={() => window.print()}
        type="button"
      >
        طباعة / PDF
      </button>
    );
  }
  ```
  Then import and use in each report page's FilterBar actions.

**Checkpoint**: Print preview hides navigation, shows data cleanly in RTL. Print button hidden in preview itself.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup across all stories.

- [X] T045 Verify sidebar `data-sidebar` attribute exists for print CSS in `src/components/layout/sidebar.tsx`

  **What to do**: Read the file. If the `<aside>` element does not have `data-sidebar` attribute, add it. Similarly check `src/components/layout/topbar.tsx` for `data-topbar` attribute. The print CSS uses these selectors.

- [X] T046 Run full test suite and verify no regressions: `npx vitest run`

  **What to do**: Run `npx vitest run`. All 92+ existing tests must pass. If any fail, investigate and fix.

- [ ] T047 Manual smoke test of all new features

  Checklist:
  - [ ] Dashboard charts render with data
  - [ ] Charts respond to project filter
  - [ ] All 8 report pages load with data
  - [ ] Reports filter by project
  - [ ] Export downloads correct Excel/CSV from any page
  - [ ] Installment edit: payment recorded, status recalculates
  - [ ] Contract edit: notes, collector, status save correctly
  - [ ] Follow-up delete: confirmation → delete → removed from list
  - [ ] Customer edit: restricted to admin/manager
  - [ ] Print: clean RTL layout without sidebar
  - [ ] All pages Arabic RTL
  - [ ] No console errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US3 Installment Edit)**: Depends on Phase 2. Independent of other user stories.
- **Phase 4 (US4 Charts)**: Depends on Phase 2. Independent of other user stories. **Can run in parallel with Phase 3.**
- **Phase 5 (US5 Reports)**: Depends on Phase 1 (needs `reports.read` permission). Independent of Phases 3-4. **Can run in parallel with Phases 3-4.**
- **Phase 6 (US6 Export)**: Depends on Phase 5 (report queries exist to export from). Can also start partially in parallel.
- **Phase 7 (US7 Contract Edit)**: Depends on Phase 2. Independent of Phases 3-6. **Can run anytime after Phase 2.**
- **Phase 8 (US9 Print)**: Depends on Phase 5 (report pages exist to add print buttons to).
- **Phase 9 (Polish)**: Depends on all other phases.

### User Story Dependencies

- **US3 (Installment Edit)**: No dependencies on other stories
- **US4 (Charts)**: No dependencies on other stories
- **US5 (Reports)**: Needs `reports.read` from Phase 1
- **US6 (Export)**: Needs report queries from US5 for report exports; list page exports are independent
- **US7 (Contract Edit)**: No dependencies on other stories
- **US9 (Print)**: Needs report pages from US5

### Within Each User Story

- Schema → Service → API Route → UI Component → Integration
- Always read existing files before modifying them
- Commit after each completed story

### Parallel Opportunities

```
After Phase 2 completes, these can run simultaneously:
├── Phase 3 (US3 Installment Edit) — independent
├── Phase 4 (US4 Charts) — independent
├── Phase 5 (US5 Reports) — T016-T023 queries are all [P] parallel
└── Phase 7 (US7 Contract Edit) — independent

After Phase 5 completes:
├── Phase 6 (US6 Export) — T032-T034 are all [P] parallel
└── Phase 8 (US9 Print)
```

---

## Parallel Example: Report Queries (Phase 5)

All 8 report query files can be created simultaneously since they all follow the same pattern and write to different files:

```
T016: get-aging-report.ts          — different file, no deps
T017: get-who-paid-report.ts       — different file, no deps
T018: get-overdue-report.ts        — different file, no deps
T019: get-penalties-report.ts      — different file, no deps
T020: get-project-status-report.ts — different file, no deps
T021: get-collection-notes-report.ts — different file, no deps
T022: get-promises-report.ts       — different file, no deps
T023: get-no-follow-up-report.ts   — different file, no deps
```

---

## Implementation Strategy

### MVP First (Phase 1 + 2 + 3 Only)

1. Complete Phase 1: Setup (permissions) — 1 task
2. Complete Phase 2: Foundational (services) — 3 tasks
3. Complete Phase 3: US3 Installment Edit — 6 tasks
4. **STOP and VALIDATE**: Installment payment recording works end-to-end
5. This is the minimum useful increment

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US3 (Installment Edit) → Test → MVP done
3. Add US4 (Charts) → Test → Dashboard complete
4. Add US5 (Reports) → Test → Analytics complete
5. Add US6 (Export) → Test → Data sharing complete
6. Add US7 (Contract Edit) + US9 (Print) → Test → All features complete
7. Phase 9: Polish → Final QA

### Notes for Executing Model

- **Always read a file before modifying it** — never assume you know the current contents
- **Follow the exact patterns** shown in Key Code Patterns section above
- **All Arabic labels are provided** — do not invent new labels
- **Do NOT modify existing working code** unless the task explicitly says to
- **Run `npx vitest run` after each phase** to catch regressions early
- **Commit after completing each phase** with a clear Arabic/English message
- Total tasks: 49 (47 original + T002b + T010b)
- Estimated new files: ~30
- Estimated modified files: ~12
