# Quickstart: System Completion Implementation

**Date**: 2026-03-25 | **Plan**: [plan.md](plan.md)

## Prerequisites

- Node.js 18+
- Running Supabase project (ID: `quylcgozipvhkztnxver`)
- `.env.local` with Supabase URL and keys configured
- All existing 30 tests passing: `npx vitest run`

## Execution Order

Execute in this exact order. Each step leaves the system in a working state.

### Step 0: Sidebar + Permissions (5 min)

1. Edit `src/lib/auth/permissions.ts`:
   - Add `"reports.read"` to `PermissionKey` union
   - Add `"reports"` to `AppScreen` union
   - Add `reports: "reports.read"` to `SCREEN_PERMISSION_MAP`
   - Add `"reports.read"` to all 4 roles in `ROLE_PERMISSION_MAP`

2. Edit `src/components/layout/sidebar.tsx`:
   - Add `{ href: "/reports", label: "التقارير", ready: true }` after follow-ups

3. Verify: App compiles, sidebar shows new link.

### Step 1: Collector Name Display (P1)

**Contract**: [contracts/collector-display.md](contracts/collector-display.md)

1. Modify follow-ups query to build profilesMap and add `collectorName` to each row
2. Modify contracts query similarly
3. Add "المحصل" column to follow-ups table component
4. Add "المحصل" column to contracts table component
5. Verify: Follow-ups and contracts lists show human names

### Step 2: Customer Notes Display + Edit Restriction (P1)

**Contract**: [contracts/customer-edit.md](contracts/customer-edit.md)

1. Add notes display section to customer profile page
2. Add admin/manager role check to `customers-service.ts`
3. Conditionally show/hide edit button based on role
4. Verify: Notes visible to all, edit only for admin/manager

### Step 3: Installment Payment Recording (P1)

**Contract**: [contracts/installment-edit.md](contracts/installment-edit.md)

1. Create Zod schema: `src/features/installments/schemas/installment-form.ts`
2. Create service: `src/server/services/installments-service.ts`
3. Create API route: `src/app/api/installments/[installmentId]/route.ts`
4. Create edit form component: `src/components/installments/installment-edit-form.tsx`
5. Integrate edit button in installments page (admin/manager only)
6. Write tests: recalculation logic, role enforcement
7. Verify: Payment recorded, status recalculated, dashboard KPIs update

### Step 4: Dashboard Charts (P2)

**Contract**: [contracts/dashboard-charts.md](contracts/dashboard-charts.md)

1. Create chart data query: `src/server/queries/dashboard/get-dashboard-charts.ts`
2. Create bar chart component: `src/components/dashboard/collection-by-project-chart.tsx`
3. Create pie chart component: `src/components/dashboard/aging-distribution-chart.tsx`
4. Integrate both charts in dashboard page below KPI grid
5. Verify: Charts render with data, respond to project filter

### Step 5: Report Pages (P2)

**Contract**: [contracts/reports.md](contracts/reports.md)

Build in this order:
1. Reports index page: `src/app/(dashboard)/reports/page.tsx`
2. Report query functions (create all 8 in `src/server/queries/reports/`)
3. Report pages (one at a time, each following the standard page pattern):
   - Aging → Who Paid → Overdue → Penalties → Project Status → Collection Notes → Promises → No Follow-up
4. Verify each report: data correct, filters work, empty states handled

### Step 6: Excel/CSV Export (P2)

**Contract**: [contracts/export.md](contracts/export.md)

1. Create excel exporter: `src/features/exports/excel-exporter.ts`
2. Create CSV exporter: `src/features/exports/csv-exporter.ts`
3. Create column definitions: `src/features/exports/column-definitions.ts`
4. Create export API route: `src/app/api/export/route.ts`
5. Create export button component: `src/components/ui/export-button.tsx`
6. Add export buttons to all list pages and report pages
7. Verify: Downloads work, Arabic headers correct, filters respected

### Step 7: Contract Editing (P3)

**Contract**: [contracts/contract-edit.md](contracts/contract-edit.md)

1. Create Zod schema: `src/features/contracts/schemas/contract-form.ts`
2. Create service: `src/server/services/contracts-service.ts`
3. Create API route: `src/app/api/contracts/[contractId]/route.ts`
4. Create edit form: `src/components/contracts/contract-edit-form.tsx`
5. Integrate in contract detail page (admin/manager only)
6. Verify: Edit saves, collector dropdown works, role enforcement

### Step 8: Follow-up Delete (P3)

**Contract**: [contracts/follow-up-delete.md](contracts/follow-up-delete.md)

1. Add `deleteFollowUp()` to `src/server/services/follow-ups-service.ts`
2. Add DELETE handler to `src/app/api/follow-ups/[followUpId]/route.ts`
3. Create delete button: `src/components/follow-ups/follow-up-delete-button.tsx`
4. Integrate in follow-ups table and customer follow-up history
5. Verify: Confirmation dialog, successful delete, audit logged

### Step 9: Print CSS (P3)

**Contract**: [contracts/print-sidebar.md](contracts/print-sidebar.md)

1. Add `@media print` block to `src/app/globals.css`
2. Add print button to report pages (inline, no separate component)
3. Verify: Print preview hides nav, shows data cleanly in RTL

### Step 10: Final Verification

1. Run all tests: `npx vitest run`
2. Verify all 92+ existing tests still pass
3. Check new tests pass
4. Manual smoke test of each feature
5. Verify RTL and Arabic throughout

## Key Patterns to Follow

### Form Pattern (useState + fetch)
```tsx
const [formState, setFormState] = useState<FormState>({...});
const [error, setError] = useState<string | null>(null);
const [isPending, startTransition] = useTransition();

function handleSubmit(event: React.FormEvent) {
  event.preventDefault();
  startTransition(async () => {
    const response = await fetch(url, { method: "PATCH", body: JSON.stringify(formState) });
    // handle response
  });
}
```

### Query Pattern (read model)
```typescript
const data = await loadReadModelData();
// Build maps, filter, derive, paginate
```

### Service Pattern (DI + error handling)
```typescript
export async function updateEntity(input, dependencies = defaults) {
  // 1. Auth check  2. Zod parse  3. Fetch existing  4. Build payload  5. DB update
}
```

### Input Styling
```
className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground"
```

### Card Styling
```
className="rounded-[1.75rem] border border-border/70 bg-white/80 p-5"
```

## Files Created/Modified Summary

| Action | Count |
|--------|-------|
| New files | ~30 |
| Modified files | ~10 |
| New test files | ~5 |
| New migrations | 0 |
