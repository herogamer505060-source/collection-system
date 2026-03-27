# Implementation Plan: Collections Management MVP

**Branch**: `001-collections-mvp` | **Date**: 2026-03-23 | **Spec**: `specs/001-collections-mvp/spec.md`
**Input**: Feature specification from `/specs/001-collections-mvp/spec.md`

## Summary

Build an Arabic-first RTL collections web application for internal teams using Next.js and Supabase. Phase 1 focuses on secure authentication and role enforcement, a staged Excel import center for installments and sold/available unit files with preview, a standalone import issues screen, normalized project/customer/contract/unit/installment data, preserved operational follow-ups, and the core dashboard, customer, contract, installment, unit, and follow-up workflows needed before task breakdown. Detailed contract enrichment is deferred to Phase 2.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 20 LTS  
**Primary Dependencies**: Next.js App Router, React, Supabase Auth/Postgres/Storage, Tailwind CSS, shadcn/ui, Zod, react-hook-form, exceljs, TanStack Table, Recharts  
**Storage**: Supabase PostgreSQL for application data + Supabase Storage for uploaded Excel files  
**Testing**: Vitest for unit/service/import logic + local Supabase integration tests for database-backed import flows  
**Target Platform**: Internal web application for modern desktop browsers, deployed on Node.js hosting with Supabase backend  
**Project Type**: Full-stack web application  
**Performance Goals**: Partial Arabic customer search <= 2 seconds, dashboard/project filters <= 5 seconds, full installments import <= 3 minutes  
**Constraints**: Arabic-first RTL UI, Western digits only, RLS on client-exposed tables, idempotent imports, preserved follow-ups/manual notes/assignments, no silent data loss, pagination for tables over 50 rows  
**Scale/Scope**: Single-company deployment, <50 concurrent users, three projects, datasets expected in the low tens of thousands of rows per import batch

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Gate

- Architecture First: PASS - UI, import pipeline, query services, and data access remain in separate modules.
- Database Integrity First: PASS - plan uses normalized relational tables, business keys, foreign keys, and explicit contract-unit linkage.
- Safe Import and Upsert: PASS - upload -> parse -> stage -> normalize -> validate -> match -> upsert -> log flow preserves internal operational data.
- Security by Default: PASS - Supabase Auth, role-based access, RLS, and server-only service-role usage are mandatory.
- Arabic-First User Experience: PASS - all screens, statuses, import messages, and reports remain Arabic with RTL layout.
- Testability and Verification: PASS - composite unit parsing, payment status, delay days, delay buckets, imported penalty normalization, and import matching are isolated for Vitest coverage.
- Explicit Data Quality Rules: PASS - malformed rows, conflicts, unknown projects, and missing business keys become import issues rather than silent skips.
- Simplicity Before Complexity: PASS - Phase 1 excludes OCR, WhatsApp integration, BI connectors, multi-tenancy, and background job infrastructure.
- Documentation and Traceability: PASS - decisions align with `spec.md`, `constitution.md`, `APP_ARCHITECTURE_SUPABASE_AR.md`, `DB_SCHEMA_AR.md`, and `REPORT_SPECS_AR.md`.
- Incremental Delivery: PASS - this plan stops at research and design artifacts and leaves task generation for the next stage.

Overall gate status: PASS

### Post-Design Gate

- Architecture First: PASS - `research.md`, `data-model.md`, and `contracts/api-routes.md` keep domain logic in services and import modules, not page components.
- Database Integrity First: PASS - design adds canonical customers plus project-scoped customer import identities to satisfy both safe matching and cross-project customer views.
- Safe Import and Upsert: PASS - import contracts define preview, approve, reject, issue logging, and explicit created/updated/skipped summaries.
- Security by Default: PASS - admin-only user management and manager/admin import routes are separated from read queries; collector scope remains assignment-based.
- Arabic-First User Experience: PASS - route responses and issue payloads support Arabic messages, Western digits, and RTL-first pages.
- Testability and Verification: PASS - quickstart and research require unit tests for parser/status logic, delay buckets, and imported penalty normalization plus integration coverage for imports.
- Explicit Data Quality Rules: PASS - unit status conflicts, unmatched units, malformed money/dates, and ambiguous contract matches are surfaced as issue records.
- Simplicity Before Complexity: PASS - synchronous route-handler imports with staging metadata are sufficient for the MVP scale.
- Documentation and Traceability: PASS - quickstart, contracts, and data model now use one canonical enum set and one matching strategy.
- Incremental Delivery: PASS - plan outputs are ready for task decomposition without reopening foundational design questions.

Overall post-design status: PASS

## Project Structure

### Documentation (this feature)

```text
specs/001-collections-mvp/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api-routes.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── customers/
│   │   │   └── [customerId]/
│   │   ├── contracts/
│   │   │   └── [contractId]/
│   │   ├── installments/
│   │   ├── units/
│   │   ├── follow-ups/
│   │   ├── imports/
│   │   │   └── [batchId]/
│   │   ├── import-issues/
│   │   └── users/
│   ├── api/
│   │   ├── imports/
│   │   │   ├── upload/
│   │   │   └── [batchId]/
│   │   │       ├── preview/
│   │   │       ├── approve/
│   │   │       └── reject/
│   │   ├── follow-ups/
│   │   │   └── [followUpId]/
│   │   ├── dashboard/
│   │   │   └── kpis/
│   │   └── admin/
│   │       └── users/
│   ├── layout.tsx
│   └── middleware.ts
├── components/
│   ├── ui/
│   ├── layout/
│   ├── dashboard/
│   ├── customers/
│   ├── contracts/
│   ├── installments/
│   ├── units/
│   ├── follow-ups/
│   └── imports/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── customers/
│   ├── contracts/
│   ├── installments/
│   ├── units/
│   ├── follow-ups/
│   ├── imports/
│   │   ├── parsers/
│   │   ├── normalization/
│   │   ├── validators/
│   │   ├── matching/
│   │   ├── staging/
│   │   └── services/
│   └── users/
├── lib/
│   ├── supabase/
│   ├── auth/
│   ├── formatting/
│   ├── dates/
│   ├── constants/
│   └── utils/
├── server/
│   ├── queries/
│   ├── repositories/
│   └── services/
└── types/

supabase/
├── migrations/
├── seed.sql
└── functions/

tests/
├── unit/
│   ├── imports/
│   ├── installments/
│   └── follow-ups/
├── integration/
│   ├── auth/
│   ├── imports/
│   ├── customers/
│   ├── follow-ups/
│   ├── dashboard/
│   └── units/
└── contract/
```

**Structure Decision**: Use one Next.js App Router codebase with `src/app` for routes, `features/` for domain logic, `server/` for query and upsert services, `supabase/` for SQL migrations and seed data, and `tests/` split by unit, integration, and contract concerns. This keeps the MVP modular without introducing a separate backend service.

## Complexity Tracking

No constitution violations are currently required. This section remains intentionally empty unless task planning introduces a justified exception.
