# Research: System Completion — Charts, Reports, Exports, CRUD & UX Fixes

**Date**: 2026-03-25 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## 1. Clarification Resolutions

All "NEEDS CLARIFICATION" items from the plan template have been resolved:

| # | Question | Resolution | Source |
|---|----------|------------|--------|
| 1 | Who can edit customers, contracts, installments? | Admin and manager roles only. Service-layer role check, no new permission keys. | Spec clarification session 2026-03-25 |
| 2 | "No follow-up" report: what counts as contact? | Any follow-up record regardless of status (open/done/missed). Zero records = no contact. | Spec clarification session 2026-03-25 |
| 3 | Is `profiles` already in `ReadModelData`? | **Yes.** `loadReadModelData()` already loads `profiles` table. No modification needed. | Verified in `src/server/queries/read-model-helpers.ts:15-48` |
| 4 | Does `customers.notes` column exist? | **Yes.** Column already exists in `00004_customers.sql`. No migration needed. | Verified in `supabase/migrations/00004_customers.sql` |
| 5 | Does `CustomerEditForm` already exist? | **Yes.** Fully implemented at `src/components/customers/customer-edit-form.tsx`. Customer edit API route at `src/app/api/customers/[customerId]/route.ts` also exists. | Verified in source |
| 6 | Does `customers-service.ts` already exist? | **Yes.** `updateCustomer()` implemented at `src/server/services/customers-service.ts`. | Verified in source |
| 7 | What permission key for reports? | Add `"reports.read"` to `PermissionKey` union. Grant to all roles (admin, manager, collector, viewer). | Design decision — reports are read-only analytics |
| 8 | How to restrict editing to admin/manager? | Role check in service layer: `sessionUser.roles.some(a => a.role === "admin" \|\| a.role === "manager")`. Pattern already used in `isPrivilegedFollowUpWriter()`. | Follows existing pattern in `follow-ups-service.ts:198-199` |

## 2. Existing Infrastructure Audit

### 2.1 What Already Exists (no need to build)

| Feature | Status | Location |
|---------|--------|----------|
| `profiles` in ReadModelData | ✅ Done | `read-model-helpers.ts:15,46` |
| Customer edit form | ✅ Done | `customer-edit-form.tsx` |
| Customer update service | ✅ Done | `customers-service.ts` |
| Customer update API | ✅ Done | `api/customers/[customerId]/route.ts` |
| Customer update schema | ✅ Done | `features/customers/schemas/customer-form.ts` |
| Customer notes column | ✅ Done | `00004_customers.sql` |
| Follow-up create/update | ✅ Done | `follow-ups-service.ts` |
| Follow-up API PATCH | ✅ Done | `api/follow-ups/[followUpId]/route.ts` |
| Dashboard KPI query | ✅ Done | `dashboard/get-dashboard-kpis.ts` |
| KPI grid display | ✅ Done | `dashboard/kpi-grid.tsx` |
| Payment status derivation | ✅ Done | `installments/derive-payment-status.ts` |
| Delay days derivation | ✅ Done | `installments/derive-delay-days.ts` |
| Delay bucket derivation | ✅ Done | `installments/derive-delay-bucket.ts` |
| Penalty calculation | ✅ Done | `installments/derive-penalty-amount.ts` |
| exceljs dependency | ✅ Installed | `package.json` |
| recharts dependency | ✅ Installed | `package.json` |

### 2.2 What Needs Modification

| Item | File | Change |
|------|------|--------|
| Add `reports.read` permission | `src/lib/auth/permissions.ts` | Add to `PermissionKey` union, `ROLE_PERMISSION_MAP` (all roles), `SCREEN_PERMISSION_MAP`, `AppScreen` |
| Add sidebar reports link | `src/components/layout/sidebar.tsx` | Add `{ href: "/reports", label: "التقارير", ready: true }` |
| Collector name on follow-ups table | `src/components/follow-ups/follow-ups-table.tsx` | Add column resolving `collector_user_id` → `profiles.full_name` |
| Collector name on contracts table | `src/components/contracts/contracts-table.tsx` | Same resolution pattern |
| Customer notes display on profile | `src/app/(dashboard)/customers/[customerId]/page.tsx` | Display `notes` field in profile overview |
| Add `deleteFollowUp()` | `src/server/services/follow-ups-service.ts` | New function following existing pattern |
| Add DELETE handler | `src/app/api/follow-ups/[followUpId]/route.ts` | New handler in existing file |

### 2.3 What Needs to Be Built New

| Item | Files to Create |
|------|-----------------|
| Contract edit form | `src/components/contracts/contract-edit-form.tsx` |
| Contract update service | `src/server/services/contracts-service.ts` |
| Contract update API | `src/app/api/contracts/[contractId]/route.ts` |
| Contract update schema | `src/features/contracts/schemas/contract-form.ts` |
| Installment edit form | `src/components/installments/installment-edit-form.tsx` |
| Installment update service | `src/server/services/installments-service.ts` |
| Installment update API | `src/app/api/installments/[installmentId]/route.ts` |
| Installment update schema | `src/features/installments/schemas/installment-form.ts` |
| Follow-up delete button | `src/components/follow-ups/follow-up-delete-button.tsx` |
| Dashboard charts | `src/components/dashboard/collection-by-project-chart.tsx`, `aging-distribution-chart.tsx` |
| Chart data query | `src/server/queries/dashboard/get-dashboard-charts.ts` |
| Reports index page | `src/app/(dashboard)/reports/page.tsx` |
| 8 report pages | `src/app/(dashboard)/reports/[type]/page.tsx` (or individual folders) |
| 8 report queries | `src/server/queries/reports/*.ts` |
| Report components | `src/components/reports/*.tsx` |
| Export service | `src/features/exports/excel-exporter.ts`, `csv-exporter.ts` |
| Export API | `src/app/api/export/route.ts` |
| Export button component | `src/components/ui/export-button.tsx` |
| Print CSS | Addition to `src/app/globals.css` |

## 3. Technical Decisions

### 3.1 Collector Name Resolution Pattern

**Decision**: Build a `profilesMap: Map<string, string>` from `data.profiles` in each query that needs collector names. Lookup by UUID, fallback to UUID string if not found.

```typescript
const profilesMap = new Map(data.profiles.map(p => [p.id, p.full_name]));
const collectorName = profilesMap.get(collectorUserId) ?? collectorUserId ?? "—";
```

**Why**: Follows existing in-memory pattern. No joins, no extra DB queries.

### 3.2 Edit Permission Pattern

**Decision**: Reuse the `isPrivilegedFollowUpWriter()` pattern. Create a shared helper:

```typescript
function requireAdminOrManager(sessionUser: SessionUser): void {
  const isAllowed = sessionUser.roles.some(
    (a) => a.role === "admin" || a.role === "manager"
  );
  if (!isAllowed) {
    throw new AuthorizationError("forbidden", FORBIDDEN_MESSAGE, 403);
  }
}
```

**Why**: Avoids adding new permission keys. Keeps permission model simple.

### 3.3 Report Page Architecture

**Decision**: Each report gets its own page folder under `/reports/`. All reports follow the same pattern:
1. Server page calls a report-specific query function
2. Query function uses `loadReadModelData()` + in-memory filtering
3. Page renders with `FilterBar` + `DataTable` + optional summary cards

**Why**: Consistent with existing pages. No new patterns.

### 3.4 Export Architecture

**Decision**: Client-side export triggered by button click. The export button calls an API route that returns a file stream.

- Excel: `exceljs` on the server (API route), returns `.xlsx` with `Content-Disposition: attachment`
- CSV: Same API route with `?format=csv`, uses UTF-8 BOM (`\uFEFF`) prefix
- Print/PDF: `window.print()` with `@media print` CSS

**Why**: Server-side generation handles large datasets better. exceljs already installed.

### 3.5 Installment Edit + Recalculation

**Decision**: When updating an installment:
1. Accept `amount_collected`, `payment_date`, `receipt_reference`, `penalty_amount`
2. Recalculate: `amount_outstanding = amount_due - amount_collected`
3. Recalculate: `payment_status` using existing `derivePaymentStatus()`
4. Recalculate: `delay_days` using existing `deriveDelayDays()`
5. Recalculate: `delay_bucket` using existing `deriveDelayBucket()`
6. Save all derived fields in a single UPDATE

**Why**: Reuses existing tested derivation functions. Single atomic update prevents inconsistency.

### 3.6 Follow-up Delete

**Decision**: Soft considerations rejected — use hard delete. The follow-up table has no `deleted_at` column and adding one would complicate all existing queries. Permission check: same as update (own for collector, any for admin/manager).

**Why**: Simplest approach. Follow-ups are operational notes, not financial records. Audit log captures the deletion event.

## 4. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| ReadModelData grows too large with profiles | Low — profiles table is small (~10-50 users) | Already loaded; no action needed |
| Export timeout for large datasets | Medium | Set reasonable timeout (30s). Paginate if needed. |
| Report queries slow on large datasets | Low — all in-memory, ~2000 installments is fine | Monitor; add DB views only if proven slow |
| Concurrent edit conflicts | Low — internal tool, few users | Last-write-wins acceptable for MVP |
| Missing recharts RTL support | Low | Recharts renders SVG; manual RTL adjustments for labels only |

## 5. Dependencies Between Features

```text
P1 (parallel, no dependencies between them):
  ├── Collector name display (standalone)
  ├── Customer notes display (standalone — already built, just verify)
  ├── Customer edit role restriction (modify existing service)
  └── Installment edit + recalculation (new service + form + API)

P2 (after P1, parallel within tier):
  ├── Dashboard charts (depends on: nothing new)
  ├── Reports (depends on: reports.read permission, sidebar link)
  │   └── 8 report pages (parallel with each other)
  └── Export (depends on: reports exist for report export)

P3 (after P2):
  ├── Contract edit (standalone)
  ├── Follow-up delete (standalone)
  ├── Print CSS (standalone)
  └── Sidebar update (standalone — can be done anytime)
```

Note: Sidebar update is trivially small and should be done first as it unblocks navigation testing.
