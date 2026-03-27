# Quickstart: Collections Management MVP

**Feature**: 001-collections-mvp
**Date**: 2026-03-23

## Prerequisites

- Node.js 20+
- npm 10+ or pnpm 9+
- Docker Desktop (for local Supabase)
- Supabase CLI (`npx supabase --version`)

## Local Setup

```bash
npm install
cp .env.example .env.local
```

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key
SUPABASE_DB_PASSWORD=your-local-db-password
IMPORTS_BUCKET=imports
```

## Start the Stack

```bash
npx supabase start
npx supabase db reset
npx supabase gen types typescript --local > src/types/database.ts
npm run dev
```

Expected result:
- App available at `http://localhost:3000`
- Login screen loads in Arabic with RTL layout
- Supabase local studio available at `http://127.0.0.1:54323`

## Database Bootstrap

Apply SQL migrations from `supabase/migrations/` in this order:

1. `00001_projects.sql`
2. `00002_profiles_and_roles.sql`
3. `00003_units.sql`
4. `00004_customers.sql`
5. `00005_customer_project_identities.sql`
6. `00006_contracts.sql`
7. `00007_contract_units.sql`
8. `00008_installments.sql`
9. `00009_follow_ups.sql`
10. `00010_import_batches.sql`
11. `00011_import_files.sql`
12. `00012_import_issues.sql`
13. `00013_indexes.sql`
14. `00014_rls_policies.sql`
15. `00015_seed_projects.sql`

## First Admin User

1. Create a user in Supabase Auth.
2. Insert or verify a matching `profiles` record.
3. Assign the admin role:

```sql
insert into public.user_roles (id, user_id, role)
values (gen_random_uuid(), '<auth-user-id>', 'admin');
```

## Suggested Operator Setup

Create at least one user for each operational role before smoke validation:

- `admin`: full setup, import approval, and user management
- `manager`: import approval, dashboard review, and follow-up supervision
- `collector`: customer, contract, installment, unit, and follow-up workflows inside assigned projects
- `viewer`: read-only access for reporting and supervision

Recommended demo distribution:

- Manager assigned to all projects
- Collector assigned to `IL Parco`
- Viewer assigned to `IL Centro`

## Recommended Import Order

1. Sold units: `تم بيعها بالفعل.xlsx`
2. Available units: `متاحه لم تباع.xlsx`
3. Installments: `Rep_REI006 (5).xlsx`

Why this order:
- Units establish the inventory reference first.
- Installments create customers, contracts, contract-unit links, and financial state.
- Detailed contract enrichment is deferred to Phase 2.

## Running Tests

```bash
npm run test
npm run lint
npm run typecheck
npm run build
npx vitest run tests/unit/imports/parse-composite-unit-code.test.ts
npx vitest run tests/unit/installments/payment-status.test.ts
npx vitest run tests/integration/imports/installments-import.test.ts
```

## Manual Verification Flow

1. Log in as admin or manager.
2. Open `الاستيراد` and upload each Phase 1 Excel file.
3. Confirm preview shows detected columns, row counts, sample rows, and Arabic issue messages.
4. Approve the import and verify created, updated, skipped, and issue counts.
5. Re-upload the same installments file and verify no duplicates are created.
6. Add a follow-up to an imported customer, re-import the installments file, and verify the follow-up still exists.
7. Open the dashboard and compare KPI totals against the latest approved import summary.

## Performance and Reconciliation Checks

Validated from the CLI on 2026-03-24:

- Customer Arabic search threshold: `tests/integration/customers/customer-search-performance.test.ts`
  - dataset: 180 generated customers
  - expected threshold: under `500ms`
  - observed run: about `109ms`
- Installments workbook parsing threshold: `tests/integration/imports/installments-import-performance.test.ts`
  - workbook: `Rep_REI006 (5).xlsx`
  - expected threshold: under `10s`
  - observed run: about `2.39s`
  - verified summary metrics: `rawRowCount=2131`, `rows=2130`, `skippedRowCount=1`
- Dashboard reconciliation: `tests/integration/dashboard/dashboard-reconciliation.test.ts`
  - verified KPI totals against fixture-based source aggregates
  - confirmed due, collected, outstanding, overdue, penalties, open promises, and ranked debtors

## Validation Log

Executed on 2026-03-24:

- `npm run lint` - passed
- `npm run typecheck` - passed
- `npm test` - passed (`45` files, `92` tests)
- `npm run build` - passed

## Manual Collection-Officer UAT

Interactive browser UAT is still pending operator execution. Use the checklist below when running it locally:

1. Sign in as `collector` assigned to `IL Parco`.
2. Open `/customers` and confirm only assigned-project customers are visible.
3. Open a customer profile, add a follow-up with a promise date, and confirm it appears in follow-up history.
4. Open `/follow-ups`, filter by overdue and promised-to-pay, then edit a follow-up you created.
5. Open `/contracts` from the same customer and confirm linked units and installments render correctly.
6. Open `/units`, filter to `sold` and `IL Parco`, then navigate from a sold unit to its contract.
7. Switch to `manager`, approve an import batch, and confirm dashboard KPIs refresh after the new import.
8. Record pass/fail notes, blockers, and screenshots in the release checklist before rollout.

### UAT Recording Template

| Step | Role | Expected outcome | Result | Notes |
|------|------|------------------|--------|-------|
| 1 | collector | Assigned-project customers only | Pending |  |
| 2 | collector | Follow-up appears in customer history | Pending |  |
| 3 | collector | Follow-up list filters and edit flow work | Pending |  |
| 4 | collector | Contract shows linked units and installments | Pending |  |
| 5 | collector | Sold unit navigates to its contract | Pending |  |
| 6 | manager | Import approval refreshes dashboard KPIs | Pending |  |

### UAT Sign-off

- Operator name: `Pending`
- Execution date: `Pending`
- Environment: `Local / Pending confirmation`
- Overall result: `Pending manual run`
- Screenshots/log bundle: `Pending`

## Expected Screens in Phase 1

- `تسجيل الدخول`
- `لوحة المتابعة`
- `الاستيراد`
- `العملاء`
- `العقود`
- `الأقساط`
- `الوحدات`
- `المتابعات`
- `المستخدمون والصلاحيات`

## Troubleshooting

- If local Supabase is not running, restart with `npx supabase start` before running imports or integration tests.
- If generated types drift from the schema, rerun `npx supabase gen types typescript --local > src/types/database.ts`.
- If an import fails during preview, inspect the latest `import_batches` and `import_issues` records before retrying.
- If `npm run build` fails after schema or route changes, rerun `npm run typecheck` first to catch the blocking file faster.
