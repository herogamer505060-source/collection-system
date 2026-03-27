<!--
  Sync Impact Report
  ====================
  Version change: (none) → 1.0.0
  Bump type: MAJOR — initial ratification of project constitution

  Added Principles:
    I.   Architecture First
    II.  Database Integrity First
    III. Safe Import and Upsert
    IV.  Security by Default
    V.   Arabic-First User Experience
    VI.  Testability and Verification
    VII. Explicit Data Quality Rules
    VIII.Simplicity Before Complexity
    IX.  Documentation and Traceability
    X.   Incremental Delivery

  Added Sections:
    - Technology Stack & Constraints
    - Development Workflow & Phased Delivery
    - Governance

  Removed Sections: (none)

  Templates Requiring Updates:
    ✅ .specify/templates/plan-template.md — compatible, no changes needed
    ✅ .specify/templates/spec-template.md — compatible, no changes needed
    ✅ .specify/templates/tasks-template.md — compatible, no changes needed
    ✅ .specify/templates/checklist-template.md — compatible, no changes needed
    ✅ .specify/templates/agent-file-template.md — compatible, no changes needed

  Follow-up TODOs: (none)
-->

# Real Estate Collections System Constitution

## Core Principles

### I. Architecture First

- The system MUST use a modular architecture with clear boundaries
  between UI, application logic, import pipeline, and data access.
- Business logic MUST NOT live inside UI components or page-level
  server actions. All domain rules MUST reside in dedicated service
  or logic modules.
- Import, validation, matching, upsert, and reporting logic MUST be
  implemented in separate, independently testable modules.
- Rationale: Modularity enables independent testing, replacement of
  layers, and prevents the codebase from collapsing into an
  unmaintainable monolith as features grow.

### II. Database Integrity First

- Supabase PostgreSQL is the single source of truth for all
  persistent application state.
- The system MUST use normalized relational tables. A single
  denormalized table is prohibited.
- Contracts, units, customers, installments, follow-ups, import
  batches, import files, and import issues MUST be modeled as
  separate entities with explicit foreign-key relationships.
- Business keys (installment_code, unit_key, contract_key,
  customer_key) MUST be preserved as unique or composite-unique
  constraints.
- Rationale: Normalized design prevents update anomalies, supports
  BI export, and maintains referential integrity across imports.

### III. Safe Import and Upsert

- Every Excel upload MUST go through a staged pipeline: upload →
  parse → staging → normalize → validate → match → upsert → log.
- The system MUST support insert, update, and preserve behavior:
  new records are inserted, existing records are updated from the
  source, and internal operational data is preserved.
- Internal operational data (follow-ups, manual notes, assignments,
  promise-to-pay records) MUST NEVER be overwritten or deleted by
  imported Excel files.
- Every import MUST produce structured logs, issue records, and a
  reviewable summary before committing changes.
- Rationale: The accounting system exports are the upstream data
  source; the collections system adds operational data on top.
  Losing operational data during import is a critical failure.

### IV. Security by Default

- Authentication and authorization are mandatory for all users.
- Supabase Row Level Security (RLS) MUST be enabled on all
  client-exposed tables.
- Service-role secrets and database connection strings MUST never
  be exposed to the client bundle or browser.
- Role-based access MUST support at minimum: admin, manager,
  collector, and viewer roles.
- Rationale: This is an internal financial system handling contract
  and payment data. Unauthorized access or data leakage is
  unacceptable.

### V. Arabic-First User Experience

- All user-facing screens MUST be rendered in Arabic with RTL
  layout as the default direction.
- Labels, status badges, reports, filters, table headers, and
  dashboard cards MUST use clear Arabic text understandable by
  non-technical business users.
- The file import flow MUST be transparent: preview, validation
  results, and import issues MUST be presented in Arabic.
- Internal code identifiers (variables, functions, database columns)
  MUST remain in English.
- Rationale: End users are Arabic-speaking collection officers and
  managers. A confusing or English-dominated UI defeats the purpose
  of the tool.

### VI. Testability and Verification

- Critical business rules MUST be testable in isolation without
  requiring a running server or database.
- The following MUST have automated tests: composite unit code
  parsing, installment status derivation, delay-days and
  delay-bucket calculation, penalty calculation, and import
  row matching logic.
- No feature is considered complete unless its key business paths
  are validated by at least one automated test.
- Rationale: Business rule errors in a financial collection system
  directly affect revenue reporting and customer relationships.

### VII. Explicit Data Quality Rules

- The system MUST NOT silently ignore or discard malformed data
  during import.
- Invalid rows, unknown project codes, unmatched unit keys,
  duplicate business keys, unparseable dates, and negative amounts
  MUST be logged as import issues with severity and context.
- Data quality problems MUST be surfaced to the user through the
  import issues screen, not hidden in server logs.
- Rationale: Hidden data problems erode trust in the system and
  cause downstream reporting errors that are difficult to trace.

### VIII. Simplicity Before Complexity

- The first implementation phase MUST deliver the minimum
  professional scope: import center, dashboard, customers,
  contracts, installments, follow-ups, units, and import issues.
- The following MUST NOT be introduced in Phase 1 unless explicitly
  requested: OCR, WhatsApp integration, AI-driven predictions,
  realtime subscriptions, Power BI connectors, mobile native apps,
  advanced RBAC, or multi-tenancy.
- When choosing between two approaches, prefer the simpler one
  unless the simpler approach violates another principle.
- Rationale: Premature complexity delays delivery and introduces
  bugs in a system that has not yet proven its core value.

### IX. Documentation and Traceability

- Code, schema, import behavior, and reporting logic MUST stay
  aligned with the governing project documents: CLAUDE.md,
  DATA_DICTIONARY_AR.md, APP_ARCHITECTURE_SUPABASE_AR.md,
  REPORT_SPECS_AR.md, and DB_SCHEMA_AR.md.
- Important architectural decisions MUST be explicit and traceable
  — either documented in commit messages, code comments at the
  decision site, or in the project specification files.
- If implementation deviates from a project document, the deviation
  MUST be noted and justified.
- Rationale: This project is built iteratively with an AI assistant.
  Without document alignment, each session risks drift from the
  agreed design.

### X. Incremental Delivery

- The project MUST be built in small, reviewable phases. Each phase
  MUST leave the system in a working, deployable state.
- Phase 1 focuses on: foundation, schema, authentication, import
  pipeline, and core collection workflows (dashboard, customers,
  contracts, installments, follow-ups, units).
- Subsequent phases add reports, KPIs, advanced filters, export,
  and other enhancements.
- A phase MUST NOT introduce half-built features that break
  existing functionality.
- Rationale: Incremental delivery enables early feedback, reduces
  risk, and ensures the system is always usable.

## Technology Stack & Constraints

- **Framework**: Next.js (App Router) with TypeScript (strict mode)
- **Database**: Supabase PostgreSQL
- **UI**: Tailwind CSS + shadcn/ui
- **Tables**: TanStack Table
- **Charts**: Recharts
- **Forms**: react-hook-form + Zod validation
- **Excel parsing**: xlsx or exceljs with an abstraction layer
- **Date handling**: date-fns
- **Authentication**: Supabase Auth
- **Deployment target**: Vercel or equivalent Node.js hosting
- **Constraints**:
  - TypeScript strict: true — no `any` except at system boundaries
  - All monetary values stored as numeric/decimal, never float
  - Pagination required for any table exceeding 50 rows
  - Server-side data fetching for heavy screens

## Development Workflow & Phased Delivery

### Phase 1 — Foundation & Core
1. Project setup (Next.js, Supabase, Prisma/Drizzle)
2. Database schema and migrations
3. Seed data for 3 projects (IL Parco, IL Centro, Caza)
4. Authentication and role-based middleware
5. Import pipeline (sold units, available units, installments)
6. Core screens: Dashboard, Customers, Contracts, Installments,
   Units, Follow-ups, Import Center

### Phase 2 — Enrichment
1. Detailed contract import (enrichment from secondary Excel)
2. KPIs and collection reports
3. Advanced filters and search
4. Follow-up management enhancements

### Phase 3 — Polish
1. CSV/PDF export
2. Performance optimization
3. Additional reports (aging, promise-to-pay, collector activity)
4. UI refinements

### Commit Discipline
- Each logical unit of work MUST be a separate commit
- Import pipeline changes MUST include test updates
- Schema changes MUST include migration files

## Governance

These principles are **immutable for Phase 1** of the project.
They override convenience, shortcuts, and speculative complexity.

### Amendment Procedure
1. Any principle change MUST be proposed with a rationale.
2. Changes MUST be classified as MAJOR (principle removal or
   redefinition), MINOR (new principle or material expansion),
   or PATCH (clarification or wording fix).
3. The constitution version MUST be incremented accordingly.
4. All dependent specifications, plans, and task lists MUST be
   reviewed for alignment after amendment.

### Versioning Policy
- Format: MAJOR.MINOR.PATCH (semantic versioning)
- MAJOR: Backward-incompatible governance changes
- MINOR: New principles or materially expanded guidance
- PATCH: Clarifications, typo fixes, non-semantic refinements

### Compliance Review
- Every specification (`/speckit.specify`) MUST be checked against
  these principles before approval.
- Every implementation plan (`/speckit.plan`) MUST include a
  Constitution Check section validating alignment.
- Every task list (`/speckit.tasks`) MUST organize work in phases
  consistent with the Incremental Delivery principle.
- Code reviews MUST verify that business logic does not live in
  UI components (Principle I) and that import safety is preserved
  (Principle III).

**Version**: 1.0.0 | **Ratified**: 2026-03-23 | **Last Amended**: 2026-03-23
