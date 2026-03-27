# Research: Collections Management MVP

**Feature**: 001-collections-mvp
**Date**: 2026-03-23

## 1. Application Stack and Data Access

**Decision**: Build a single Next.js App Router application in TypeScript with Tailwind CSS, shadcn/ui, Supabase Postgres/Auth/Storage, and SQL migrations plus typed Supabase clients.

**Rationale**: This matches the constitution and architecture documents, keeps the stack production-minded for an internal financial workflow, and avoids splitting the MVP across separate frontend and backend services. SQL migrations keep schema control and RLS policy authoring straightforward in Supabase.

**Alternatives considered**:
- Prisma: familiar, but adds another abstraction layer over Supabase and makes RLS-centric workflows less direct.
- Split frontend/backend services: unnecessary complexity for a low-concurrency internal MVP.

## 2. Import Pipeline Execution Model

**Decision**: Use a staged, synchronous server-side import flow for Phase 1: upload -> parse -> normalize -> validate -> match -> preview -> approve/reject -> upsert -> log.

**Rationale**: The defined preview-and-approval workflow already gives users a checkpoint before data is committed. For the expected team size and file volumes, route-handler processing is simpler than adding queues or workers while still satisfying idempotency, preview, and issue logging requirements.

**Alternatives considered**:
- Background jobs with Redis/BullMQ: stronger for very large files, but not justified for the current scale.
- Edge-function orchestration: viable later, but introduces more moving parts during the MVP.

## 3. Excel Parsing Library

**Decision**: Use `exceljs` behind a parser abstraction per source file.

**Rationale**: `exceljs` supports `.xlsx` files, row-wise parsing, and the kind of header detection and summary-row skipping required by the accounting exports. Wrapping it inside file-specific parsers keeps the import layer testable and resilient to header changes.

**Alternatives considered**:
- `xlsx` / SheetJS: simpler API, but less comfortable for larger files and structured parsing.
- Direct ad-hoc parsing inside route handlers: violates the architecture and testability principles.

## 4. Customer Identity and Re-Import Matching

**Decision**: Keep `customers` as the canonical buyer entity and add a separate `customer_project_identities` table for project-scoped import matching keys.

**Rationale**: The spec requires re-import matching by normalized customer name within a project, but the customer experience also needs one profile that can show multiple contracts across projects. A separate identity table solves both without introducing a complex identity-resolution engine.

**Alternatives considered**:
- Make customers project-scoped: safe for imports, but breaks the cross-project customer profile requirement.
- Use only global normalized names: too risky because name collisions across projects would create unsafe matches.

## 5. Contract Keys and Multi-Unit Matching

**Decision**: Prefer trusted source `contract_code` when present; otherwise generate a deterministic `contract_key` from `(project + customer_project_identity + normalized ordered unit set)`. Detailed contract enrichment is deferred to Phase 2.

**Rationale**: Contract is the business center of the system, and unit codes alone are not sufficient keys. Deterministic fallback keys keep Phase 1 imports idempotent without introducing a second enrichment file flow before the MVP is stable.

**Alternatives considered**:
- Use unit code alone as the contract key: invalid for multi-unit contracts and historical duplicates.
- Refuse all rows without explicit contract codes: too lossy for the current source files.

## 6. Composite Unit Parsing Strategy

**Decision**: Implement a dedicated parser that normalizes separators and extracts ordered unit tokens from values such as `B28+B29`, `G3+G4`, and `T1-T2-T3-T4-T5-T6` before contract-unit linkage is created.

**Rationale**: Composite unit strings are a core business rule, not a formatting edge case. A dedicated parser with automated tests is required to avoid brittle `split()` logic and to support mixed separators, extra spaces, and repeated prefixes.

**Alternatives considered**:
- Simple split on `+`: misses hyphen-delimited patterns and mixed formatting.
- Store composite strings without parsing: breaks the contract-unit model and downstream reporting.

## 7. Canonical Installment Status Model

**Decision**: Store one canonical payment status enum: `paid | partial | unpaid | overdue`, derived from due date, collected amount, and outstanding amount instead of trusting imported status text.

**Rationale**: This matches the feature spec, the Arabic UI vocabulary, and the business rules defined for dashboard and customer views. Deriving status from amounts keeps the system consistent even if source exports contain inconsistent human-readable status labels.

**Alternatives considered**:
- Use source-style enums such as `collected | uncollected | future_due`: conflicts with the accepted feature terminology.
- Store raw source status only: unsafe because the import files are not the authoritative source of derived behavior.

## 8. Follow-Up Workflow Model

**Decision**: Use `follow_ups` as an internal-only operational table with contact types `call | whatsapp | meeting | email | other` and statuses `open | done | missed`; records are editable but never deletable.

**Rationale**: This matches the approved feature spec and preserves the operational nature of follow-up work. `missed` covers overdue next actions cleanly, while `created_by` and `collector_user_id` support role-based editing and assignment visibility.

**Alternatives considered**:
- Use `visit` / `cancelled` from older docs: workable, but out of sync with the current feature spec.
- Allow follow-up deletion: directly violates the approved requirement.

## 9. Arabic Search and Filtering

**Decision**: Use normalized text columns plus indexed PostgreSQL `ILIKE` queries for Phase 1 customer search, with optional `pg_trgm` enhancement deferred until there is evidence it is needed.

**Rationale**: The expected scale is small enough that normalized text search is fast and simple. Storing normalized search text supports partial Arabic matching without prematurely introducing more advanced database extensions.

**Alternatives considered**:
- Full fuzzy matching from day one: adds migration and tuning overhead without proven need.
- Client-side filtering: incompatible with server-side pagination and role-scoped access.

## 10. Testing Strategy

**Decision**: Use Vitest for parser, business-rule, and import-service tests, plus local Supabase-backed integration tests for upsert and RLS-sensitive flows.

**Rationale**: The constitution requires isolated verification of composite unit parsing, payment status rules, delay calculation, and import matching. Vitest is fast and TypeScript-native, while local Supabase integration tests cover the database behaviors that pure unit tests cannot verify.

**Alternatives considered**:
- Jest: acceptable, but slower and heavier for an ESM/TypeScript-first codebase.
- Manual-only verification: insufficient for a financial workflow with repeat imports and derived statuses.

## 11. Read and Write Boundary Design

**Decision**: Use server components for read-heavy screens and route handlers/server actions for mutations, imports, and admin operations.

**Rationale**: This keeps page rendering simple, leverages the App Router well, and prevents mutation logic from leaking into UI components. Import approval, follow-up writes, and user administration remain explicit server-side interfaces.

**Alternatives considered**:
- Put all reads behind REST endpoints: adds extra API surface without improving the MVP.
- Put domain mutations inside page components: violates the architecture principle.
