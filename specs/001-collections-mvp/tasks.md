# Tasks: Collections Management MVP

**Input**: Design documents from `/specs/001-collections-mvp/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/api-routes.md`, `quickstart.md`

**Tests**: Automated tests are included because the specification requires independent verification, idempotent imports, role enforcement, and automated coverage for critical business rules.

**Organization**: Tasks are grouped by user story and split into small reviewable milestones so each increment can be implemented and reviewed independently without consuming excessive context.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel
- **[Story]**: User story label for story-specific work
- Every task includes exact file path references

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Bootstrap the Next.js/Supabase workspace and shared frontend conventions.

- [X] T001 Initialize the Next.js App Router workspace and dependencies in `package.json`
- [X] T002 Configure TypeScript, Next.js, ESLint, and Vitest in `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, and `vitest.config.ts`
- [X] T003 [P] Configure Tailwind, shadcn/ui, and global RTL styles in `tailwind.config.ts`, `components.json`, and `src/app/globals.css`
- [X] T004 [P] Define environment variable examples and runtime parsing in `.env.example` and `src/lib/supabase/env.ts`
- [X] T005 [P] Create the root app layout and route-group placeholders in `src/app/layout.tsx` and `src/app/(dashboard)/layout.tsx`
- [X] T006 [P] Add shared dev, lint, typecheck, and test scripts in `package.json` and `postcss.config.mjs`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schema, auth, permissions, shared services, and shell required before any user story work.

**IMPORTANT**: No story work should start until this phase is complete.

### Milestone 2.1 - Database foundation

- [X] T007 Create project and profile/role migrations in `supabase/migrations/00001_projects.sql` and `supabase/migrations/00002_profiles_and_roles.sql`
- [X] T008 [P] Create unit, customer, and customer identity migrations in `supabase/migrations/00003_units.sql`, `supabase/migrations/00004_customers.sql`, and `supabase/migrations/00005_customer_project_identities.sql`
- [X] T009 [P] Create contract, contract-unit, and installment migrations with persisted `delay_bucket` and normalized `penalty_amount` support in `supabase/migrations/00006_contracts.sql`, `supabase/migrations/00007_contract_units.sql`, and `supabase/migrations/00008_installments.sql`
- [X] T010 [P] Create follow-up and import-log migrations in `supabase/migrations/00009_follow_ups.sql`, `supabase/migrations/00010_import_batches.sql`, `supabase/migrations/00011_import_files.sql`, and `supabase/migrations/00012_import_issues.sql`
- [X] T011 [P] Add indexes, RLS policies, and seeded projects in `supabase/migrations/00013_indexes.sql`, `supabase/migrations/00014_rls_policies.sql`, and `supabase/migrations/00015_seed_projects.sql`
- [X] T012 Generate database types with Supabase CLI in `src/types/database.ts` using `npx supabase gen types typescript --local > src/types/database.ts`

### Milestone 2.2 - Auth, access, and shared infrastructure

- [X] T013 [P] Implement Supabase browser, server, and admin clients in `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, and `src/lib/supabase/admin.ts`
- [X] T014 [P] Implement session helpers, role permissions, and scope rules in `src/lib/auth/get-session-user.ts`, `src/lib/auth/permissions.ts`, and `src/lib/auth/role-scopes.ts`
- [X] T015 [P] Implement Arabic currency, number, and Egypt timezone helpers in `src/lib/formatting/currency.ts`, `src/lib/formatting/numbers.ts`, and `src/lib/dates/egypt.ts`
- [X] T016 [P] Implement installment payment-status, delay-days, delay-bucket, and penalty-amount derivation helpers in `src/features/installments/derive-payment-status.ts`, `src/features/installments/derive-delay-days.ts`, `src/features/installments/derive-delay-bucket.ts`, and `src/features/installments/derive-penalty-amount.ts`
- [X] T016b [P] Add unit tests for payment status, delay days, delay buckets, penalty normalization, and customer matching in `tests/unit/installments/payment-status.test.ts`, `tests/unit/installments/delay-days.test.ts`, `tests/unit/installments/delay-bucket.test.ts`, `tests/unit/installments/penalty-amount.test.ts`, and `tests/unit/imports/match-customer.test.ts`
- [X] T017 Implement protected routing and login flow in `src/middleware.ts`, `src/app/(auth)/login/page.tsx`, and `src/features/auth/actions/sign-in.ts`
- [X] T018 [P] Implement admin user-management API and page shell in `src/app/api/admin/users/route.ts`, `src/app/api/admin/users/[userId]/route.ts`, and `src/app/(dashboard)/users/page.tsx`
- [X] T019 Create the authenticated shell, sidebar, topbar, and shared table primitives in `src/components/layout/sidebar.tsx`, `src/components/layout/topbar.tsx`, `src/components/ui/data-table.tsx`, `src/components/ui/filter-bar.tsx`, and `src/components/ui/status-badge.tsx`
- [X] T020 Add foundational role permission contract and integration coverage for auth, imports, customers, contracts, installments, units, dashboard, follow-ups, and admin screens in `tests/contract/auth-role-permissions.contract.test.ts`, `tests/contract/import-role-access.contract.test.ts`, `tests/contract/follow-up-role-access.contract.test.ts`, `tests/contract/read-screen-role-access.contract.test.ts`, `tests/integration/auth/auth-roles.test.ts`, and `tests/integration/auth/screen-access-matrix.test.ts`

**Checkpoint**: Foundation is ready. The first reviewable vertical slice can begin.

---

## Phase 3: User Story 1 - Excel Data Import with Preview and Issue Tracking (Priority: P1) MVP

**Goal**: Deliver the full import pipeline from file upload to preview, approval, idempotent upsert, and issue tracking.

**Independent Test**: Upload the three Phase 1 Excel source files, verify preview counts and issues, approve the batch, confirm customers/contracts/units/installments are created or updated correctly, then re-import and confirm no duplicates or follow-up loss.

### Milestone 3.1 - Import tests first

- [X] T021 [P] [US1] Add composite unit parser tests in `tests/unit/imports/parse-composite-unit-code.test.ts`
- [X] T022 [P] [US1] Add normalization and issue-mapping tests in `tests/unit/imports/normalize-import-row.test.ts` and `tests/unit/imports/map-import-issue.test.ts`
- [X] T023 [P] [US1] Add contract tests for import preview and approve routes in `tests/contract/imports-preview.contract.test.ts` and `tests/contract/imports-approve.contract.test.ts`
- [X] T024 [P] [US1] Add integration tests for idempotent import and unit-status conflicts in `tests/integration/imports/installments-import.test.ts` and `tests/integration/imports/unit-conflicts.test.ts`
- [X] T025 [P] [US1] Add integration tests for expired-session preview and approve handling in `tests/integration/imports/import-session-expiry.test.ts`

### Milestone 3.2 - Parsing and normalization

- [X] T026 [P] [US1] Implement the installments parser in `src/features/imports/parsers/installments-parser.ts`
- [X] T027 [P] [US1] Implement sold-unit and available-unit parsers in `src/features/imports/parsers/sold-units-parser.ts` and `src/features/imports/parsers/available-units-parser.ts`
- [X] T028 [P] [US1] Implement normalization helpers for project names, customer names, money, dates, and composite unit codes in `src/features/imports/normalization/normalize-project.ts`, `src/features/imports/normalization/normalize-customer-name.ts`, `src/features/imports/normalization/normalize-money.ts`, `src/features/imports/normalization/normalize-date.ts`, and `src/features/imports/normalization/parse-composite-unit-code.ts`
- [X] T029 [US1] Implement validation rules and Arabic issue messages in `src/features/imports/validators/validate-import-row.ts` and `src/features/imports/validators/issue-messages.ar.ts`

### Milestone 3.3 - Staging, matching, preview, and safe apply

- [X] T030 [US1] Implement staged-row preparation and staging persistence helpers in `src/features/imports/staging/stage-import-rows.ts` and `src/server/repositories/import-batch-staging-repository.ts`
- [X] T031 [US1] Implement uploaded-file storage and file metadata persistence in `src/features/imports/services/store-uploaded-file.ts` and `src/server/repositories/storage-repository.ts`
- [X] T032 [US1] Implement customer, contract, and unit matching services using `customer_import_key` for project-scoped customer matching in `src/features/imports/matching/match-customer.ts`, `src/features/imports/matching/match-contract.ts`, and `src/features/imports/matching/match-unit.ts`
- [X] T033 [US1] Implement preview assembly and batch-detail query logic in `src/features/imports/services/build-import-preview.ts` and `src/server/queries/imports/get-import-batch-detail.ts`
- [X] T034 [US1] Implement safe apply/upsert services that preserve follow-ups and assignments in `src/features/imports/services/apply-import-batch.ts` and `src/server/services/import-upsert-service.ts`

### Milestone 3.4 - Routes and operator UI

- [X] T035 [US1] Implement upload and preview API routes in `src/app/api/imports/upload/route.ts` and `src/app/api/imports/[batchId]/preview/route.ts`
- [X] T036 [US1] Implement approve, reject, and batch-detail API routes in `src/app/api/imports/[batchId]/approve/route.ts`, `src/app/api/imports/[batchId]/reject/route.ts`, and `src/app/api/imports/[batchId]/route.ts`
- [X] T037 [P] [US1] Build the import-center upload and preview UI in `src/app/(dashboard)/imports/page.tsx`, `src/components/imports/import-upload-form.tsx`, and `src/components/imports/import-preview-card.tsx`
- [X] T038 [P] [US1] Build batch-detail and issue-review UI in `src/app/(dashboard)/imports/[batchId]/page.tsx`, `src/components/imports/import-batch-summary.tsx`, and `src/components/imports/import-issues-table.tsx`
- [X] T039 [US1] Add import access guards and last-data-update wiring in `src/features/imports/services/import-access.ts` and `src/components/layout/last-data-update.tsx`
- [X] T040 [P] [US1] Implement the import issues list query with batch, severity, and issue-type filters in `src/server/queries/imports/get-import-issues-list.ts`
- [X] T041 [US1] Build the standalone import issues page with batch, severity, and issue-type filters in `src/app/(dashboard)/import-issues/page.tsx` and `src/components/imports/import-issues-screen.tsx`

**Checkpoint**: MVP vertical slice is complete and demoable.

---

## Phase 4: User Story 2 - Customer & Contract Collection Status (Priority: P2)

**Goal**: Deliver searchable customer, contract, and installment views for daily collection work.

**Independent Test**: After US1 data import, search by partial Arabic name, open a customer profile, and verify contracts, units, installments, totals, and follow-up history.

### Milestone 4.1 - Tests and read-model queries

- [X] T042 [P] [US2] Add contract tests for customer list and customer profile responses in `tests/contract/customers-list.contract.test.ts` and `tests/contract/customer-profile.contract.test.ts`
- [X] T043 [P] [US2] Add integration coverage for Arabic search and profile drill-down in `tests/integration/customers/customer-profile-flow.test.ts`
- [X] T044 [P] [US2] Implement customer list and profile queries in `src/server/queries/customers/get-customers-list.ts` and `src/server/queries/customers/get-customer-profile.ts`
- [X] T045 [P] [US2] Implement contract list/detail and installment summary queries in `src/server/queries/contracts/get-contracts-list.ts`, `src/server/queries/contracts/get-contract-detail.ts`, and `src/server/queries/installments/get-installments-list.ts`

### Milestone 4.2 - Officer-facing pages

- [X] T046 [US2] Build the customers list page with Arabic search and filters in `src/app/(dashboard)/customers/page.tsx` and `src/components/customers/customers-table.tsx`
- [X] T047 [US2] Build the customer profile page with totals, contracts, units, installments, and follow-up history in `src/app/(dashboard)/customers/[customerId]/page.tsx` and `src/components/customers/customer-profile-overview.tsx`
- [X] T048 [US2] Build contract list and contract detail pages in `src/app/(dashboard)/contracts/page.tsx`, `src/app/(dashboard)/contracts/[contractId]/page.tsx`, and `src/components/contracts/contracts-table.tsx`
- [X] T049 [US2] Build the standalone installments page and payment-status table in `src/app/(dashboard)/installments/page.tsx`, `src/components/installments/installments-table.tsx`, and `src/components/installments/payment-status-badge.tsx`

**Checkpoint**: Officers can inspect customer status end-to-end without using Excel.

---

## Phase 5: User Story 3 - Collection Follow-Up Management (Priority: P3)

**Goal**: Deliver operational follow-up creation, editing, overdue tracking, and promise-to-pay visibility.

**Independent Test**: Create a follow-up for an existing contract, add a promise date, and verify it appears in the follow-up list, customer profile, and promises-due output.

### Milestone 5.1 - Tests and service layer

- [X] T050 [P] [US3] Add contract tests for follow-up create and update APIs in `tests/contract/follow-ups-create.contract.test.ts` and `tests/contract/follow-ups-update.contract.test.ts`
- [X] T051 [P] [US3] Add integration coverage for follow-up creation and promise visibility in `tests/integration/follow-ups/follow-up-management.test.ts`
- [X] T052 [P] [US3] Implement follow-up form schemas and permission rules in `src/features/follow-ups/schemas/follow-up-form.ts` and `src/features/follow-ups/services/follow-up-permissions.ts`
- [X] T053 [P] [US3] Implement follow-up write services and list queries in `src/server/services/follow-ups-service.ts`, `src/server/queries/follow-ups/get-follow-ups-list.ts`, and `src/server/queries/follow-ups/get-promises-due.ts`

### Milestone 5.2 - Routes and workflow UI

- [X] T054 [US3] Implement follow-up create and update API routes in `src/app/api/follow-ups/route.ts` and `src/app/api/follow-ups/[followUpId]/route.ts`
- [X] T055 [US3] Build the reusable follow-up form and action trigger in `src/components/follow-ups/follow-up-form.tsx` and `src/components/customers/add-follow-up-button.tsx`
- [X] T056 [US3] Build the follow-ups list page with collector, date-range, status, overdue, and promise-to-pay filters in `src/app/(dashboard)/follow-ups/page.tsx` and `src/components/follow-ups/follow-ups-table.tsx`
- [X] T057 [US3] Surface promise-to-pay and follow-up history blocks in `src/components/follow-ups/promises-due-card.tsx` and `src/components/customers/customer-follow-up-history.tsx`

**Checkpoint**: Follow-up operations are functional and remain preserved across re-imports.

---

## Phase 6: User Story 4 - Management Dashboard (Priority: P4)

**Goal**: Deliver Arabic KPI reporting, project-level filtering, ranked overdue customers, and recent activity.

**Independent Test**: After imports and follow-ups exist, open the dashboard and verify KPI values and filtered results against manual calculations.

### Milestone 6.1 - KPI contracts and aggregation

- [X] T058 [P] [US4] Add a contract test for the dashboard KPI payload in `tests/contract/dashboard-kpis.contract.test.ts`
- [X] T059 [P] [US4] Add integration coverage for dashboard project filtering in `tests/integration/dashboard/dashboard-kpis.test.ts`
- [X] T060 [P] [US4] Implement KPI and overdue-ranking queries in `src/server/queries/dashboard/get-dashboard-kpis.ts` and `src/server/queries/dashboard/get-top-overdue-customers.ts`
- [X] T061 [P] [US4] Implement recent follow-up and last-import queries in `src/server/queries/dashboard/get-recent-follow-ups.ts` and `src/server/queries/imports/get-last-import-at.ts`

### Milestone 6.2 - Dashboard page

- [X] T062 [US4] Implement the dashboard KPI API route in `src/app/api/dashboard/kpis/route.ts`
- [X] T063 [US4] Build the Arabic dashboard page with KPI cards, project filter, ranked debtors, and recent activity in `src/app/(dashboard)/dashboard/page.tsx`, `src/components/dashboard/kpi-grid.tsx`, `src/components/dashboard/top-overdue-customers.tsx`, and `src/components/dashboard/recent-follow-ups.tsx`

**Checkpoint**: Management has a reliable operational dashboard with imported and follow-up data.

---

## Phase 7: User Story 5 - Units Inventory View (Priority: P5)

**Goal**: Deliver a filterable units inventory with sold/available state and sold-unit drill-through.

**Independent Test**: After sold and available unit imports, filter units by project and status, confirm counts/prices, and navigate from a sold unit to its contract.

### Milestone 7.1 - Query layer and tests

- [X] T064 [P] [US5] Add a contract test for units inventory query shape in `tests/contract/units-list.contract.test.ts`
- [X] T065 [P] [US5] Add integration coverage for units filtering and sold-unit navigation in `tests/integration/units/units-inventory.test.ts`
- [X] T066 [P] [US5] Implement units list and detail queries in `src/server/queries/units/get-units-list.ts` and `src/server/queries/units/get-unit-detail.ts`

### Milestone 7.2 - Inventory UI

- [X] T067 [US5] Build the units inventory page with project/status filters and pagination in `src/app/(dashboard)/units/page.tsx` and `src/components/units/units-table.tsx`
- [X] T068 [US5] Add sold-unit navigation and conflict/status cells in `src/components/units/unit-status-cell.tsx` and `src/components/units/unit-row-actions.tsx`

**Checkpoint**: Units inventory is independently usable as a reference workflow.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Finish shared quality, resilience, and release-readiness work.

- [X] T070 [P] Add shared loading, empty, and error states in `src/components/ui/page-state.tsx`, `src/app/(dashboard)/loading.tsx`, and `src/app/(dashboard)/error.tsx`
- [X] T071 Harden audit logging and API error reporting in `src/lib/auth/audit-log.ts` and `src/lib/errors/api-error.ts`
- [X] T072 Validate operator setup notes and quickstart flows in `specs/001-collections-mvp/quickstart.md` and `README.md`
- [X] T073 [P] Validate customer search latency and pagination thresholds in `tests/integration/customers/customer-search-performance.test.ts` and `specs/001-collections-mvp/quickstart.md`
- [X] T074 [P] Validate installments import duration and batch summary metrics in `tests/integration/imports/installments-import-performance.test.ts` and `specs/001-collections-mvp/quickstart.md`
- [X] T075 [P] Validate dashboard KPI reconciliation against imported source aggregates in `tests/integration/dashboard/dashboard-reconciliation.test.ts` and `specs/001-collections-mvp/quickstart.md`
- [ ] T076 Run manual collection-officer workflow UAT and record results in `specs/001-collections-mvp/quickstart.md` and `README.md`
- [X] T077 Run full lint, test, and local smoke validation from `package.json` and record outcomes in `specs/001-collections-mvp/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: No dependencies
- **Phase 2**: Depends on Phase 1 and blocks all story work
- **Phase 3 (US1)**: Depends on Phase 2
- **Phase 4 (US2)**: Depends on Phase 3 for imported data
- **Phase 5 (US3)**: Depends on Phase 3 and Phase 4
- **Phase 6 (US4)**: Depends on Phase 3 and Phase 5
- **Phase 7 (US5)**: Depends on Phase 3
- **Phase 8**: Depends on all completed stories

### User Story Dependency Graph

```text
Setup -> Foundational -> US1 -> +----> US2 ----> US3 ----> US4
                             |
                             +----> US5
```

### Within Each User Story

- Tests first, and they should fail before implementation
- Query/model logic before routes and pages
- Routes before UI integration where applicable
- Each milestone ends at a reviewable checkpoint

---

## Parallel Opportunities

- **Setup**: T003-T006 can run after T001-T002
- **Foundational**: T008-T011 can run in parallel after T007; T013-T016 and T018 can run in parallel after migrations; T020 follows role and routing helpers
- **US1**: T021-T025 can run together; T026-T028 can run together; T037-T038 can run together after routes exist
- **US2**: T042-T045 can run in parallel pairs
- **US3**: T050-T053 can run in parallel pairs
- **US4**: T058-T061 can run in parallel pairs
- **US5**: T064-T066 can run in parallel pairs
- **Polish**: T073-T075 can run in parallel after the relevant story phases are stable
- **Post-US1**: US2 and US5 can be implemented in parallel by different contributors

---

## Parallel Example: User Story 1

```bash
Task: "Add composite unit parser tests in tests/unit/imports/parse-composite-unit-code.test.ts"
Task: "Add normalization and issue-mapping tests in tests/unit/imports/normalize-import-row.test.ts and tests/unit/imports/map-import-issue.test.ts"
Task: "Add contract tests for import preview and approve routes in tests/contract/imports-preview.contract.test.ts and tests/contract/imports-approve.contract.test.ts"
Task: "Add integration tests for idempotent import and unit-status conflicts in tests/integration/imports/installments-import.test.ts and tests/integration/imports/unit-conflicts.test.ts"
Task: "Add integration tests for expired-session preview and approve handling in tests/integration/imports/import-session-expiry.test.ts"
```

```bash
Task: "Implement the installments parser in src/features/imports/parsers/installments-parser.ts"
Task: "Implement sold-unit and available-unit parsers in src/features/imports/parsers/sold-units-parser.ts and src/features/imports/parsers/available-units-parser.ts"
Task: "Implement normalization helpers in src/features/imports/normalization/*.ts"
```

## Parallel Example: User Story 2

```bash
Task: "Add contract tests for customer list and profile responses in tests/contract/customers-list.contract.test.ts and tests/contract/customer-profile.contract.test.ts"
Task: "Add integration coverage for Arabic search and profile drill-down in tests/integration/customers/customer-profile-flow.test.ts"
Task: "Implement customer list and profile queries in src/server/queries/customers/get-customers-list.ts and src/server/queries/customers/get-customer-profile.ts"
Task: "Implement contract list/detail and installment summary queries in src/server/queries/contracts/get-contracts-list.ts, src/server/queries/contracts/get-contract-detail.ts, and src/server/queries/installments/get-installments-list.ts"
```

## Parallel Example: User Story 3

```bash
Task: "Add contract tests for follow-up create and update APIs in tests/contract/follow-ups-create.contract.test.ts and tests/contract/follow-ups-update.contract.test.ts"
Task: "Add integration coverage for follow-up creation and promise visibility in tests/integration/follow-ups/follow-up-management.test.ts"
Task: "Implement follow-up form schemas and permission rules in src/features/follow-ups/schemas/follow-up-form.ts and src/features/follow-ups/services/follow-up-permissions.ts"
Task: "Implement follow-up write services and list queries in src/server/services/follow-ups-service.ts, src/server/queries/follow-ups/get-follow-ups-list.ts, and src/server/queries/follow-ups/get-promises-due.ts"
```

## Parallel Example: User Story 4

```bash
Task: "Add a contract test for the dashboard KPI payload in tests/contract/dashboard-kpis.contract.test.ts"
Task: "Add integration coverage for dashboard project filtering in tests/integration/dashboard/dashboard-kpis.test.ts"
Task: "Implement KPI and overdue-ranking queries in src/server/queries/dashboard/get-dashboard-kpis.ts and src/server/queries/dashboard/get-top-overdue-customers.ts"
Task: "Implement recent follow-up and last-import queries in src/server/queries/dashboard/get-recent-follow-ups.ts and src/server/queries/imports/get-last-import-at.ts"
```

## Parallel Example: User Story 5

```bash
Task: "Add a contract test for units inventory query shape in tests/contract/units-list.contract.test.ts"
Task: "Add integration coverage for units filtering and sold-unit navigation in tests/integration/units/units-inventory.test.ts"
Task: "Implement units list and detail queries in src/server/queries/units/get-units-list.ts and src/server/queries/units/get-unit-detail.ts"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1
2. Complete Phase 2
3. Complete Phase 3 (`US1`)
4. Stop for review and verify import safety, idempotency, preview UX, and issue filtering
5. Demo the MVP before expanding into read workflows

### Milestone-Based Execution

1. **Milestone A**: Workspace + shared shell (`T001-T020`)
2. **Milestone B**: Import tests + parsers (`T021-T029`)
3. **Milestone C**: Import staging, preview/apply, and issues UI (`T030-T041`) -> first real MVP
4. **Milestone D**: Customer/contract read workflows (`T042-T049`)
5. **Milestone E**: Units inventory (`T064-T068`) can run in parallel with Milestone D
6. **Milestone F**: Follow-up operations (`T050-T057`)
7. **Milestone G**: Dashboard reporting (`T058-T063`)
8. **Milestone H**: Polish and validation (`T070-T077`)

### Recommended Review Gates

- After Phase 2: schema/auth/shell review
- After T029: import parser/validation review
- After T041: MVP release candidate review
- After T049: officer workflow review
- After T057: follow-up operations review
- After T063: management dashboard review
- After T077: release readiness review

## Notes

- Keep each task small and file-scoped to reduce context load
- Prefer finishing one milestone checkpoint before opening the next
- US2 and US5 are the best parallel post-MVP tracks
- Do not start dashboard polish before follow-up and import totals are stable
