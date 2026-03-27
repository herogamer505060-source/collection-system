# Implementation Plan: System Completion — Charts, Reports, Exports, CRUD & UX Fixes

**Branch**: `002-system-completion-2026` | **Date**: 2026-03-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-system-completion-2026/spec.md`

## Summary

Complete the real estate collection system MVP by adding: collector name display (replacing UUIDs), customer/contract/installment editing, follow-up deletion, dashboard charts (Recharts bar + pie), 8 report pages, Excel/CSV export (exceljs), print-friendly CSS, and sidebar navigation update. All new features follow the existing read-model pattern (`loadReadModelData()` in-memory filtering), the `useState` + `fetch()` form pattern, and Arabic RTL conventions already established.

## Technical Context

**Language/Version**: TypeScript 5.7 strict, Next.js 15 (App Router), React 19
**Primary Dependencies**: @supabase/supabase-js 2.49, @supabase/ssr 0.5, recharts 2.15, exceljs 4.4, zod 3.24, react-hook-form 7.54, @tanstack/react-table 8.21, date-fns
**Storage**: Supabase PostgreSQL (project ID: `quylcgozipvhkztnxver`), 16 migrations
**Testing**: vitest 3.0, @testing-library/react 16, jsdom 26 — 30 test files (unit + contract + integration)
**Target Platform**: Vercel / Node.js hosting, browser (Chrome/Edge/Safari)
**Project Type**: Web application (Next.js fullstack, Arabic RTL internal tool)
**Performance Goals**: Pages load < 3s, export < 10s for typical datasets
**Constraints**: TypeScript strict, no `any`, monetary values as numeric, pagination for 50+ rows, server-side data fetching
**Scale/Scope**: ~3 projects, ~500 contracts, ~2000 installments, ~300 customers, 10 screens → 18+ screens after completion

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Architecture First | ✅ PASS | All new features follow existing service/query/component separation. Business logic in `src/server/` and `src/features/`, not in pages. |
| II | Database Integrity First | ✅ PASS | No new tables needed. Editing uses existing normalized schema with FK constraints preserved. |
| III | Safe Import and Upsert | ✅ PASS | No changes to import pipeline. Editing is manual CRUD, not import. Internal operational data (follow-ups, notes) preserved. |
| IV | Security by Default | ✅ PASS | All new API routes enforce `getRequiredSessionUser()` + `requirePermission()`. Editing restricted to admin/manager via service-layer role check. |
| V | Arabic-First User Experience | ✅ PASS | All new labels, reports, and UI in Arabic. RTL layout maintained. |
| VI | Testability and Verification | ✅ PASS | New business rules (recalculation on payment edit) tested in isolation. Export logic testable without browser. |
| VII | Explicit Data Quality Rules | ✅ PASS | Not applicable — no import changes. Edit forms use Zod validation with Arabic error messages. |
| VIII | Simplicity Before Complexity | ✅ PASS | No new frameworks. Charts use existing recharts. Export uses existing exceljs. PDF via browser print, not server-side generation. |
| IX | Documentation and Traceability | ✅ PASS | All new features documented in spec.md and plan2026.md. Audit events recorded for all mutations. |
| X | Incremental Delivery | ✅ PASS | 3 priority tiers (P1→P2→P3). Each tier leaves system in working state. No half-built features. |

## Project Structure

### Documentation (this feature)

```text
specs/002-system-completion-2026/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── collector-display.md
│   ├── customer-edit.md
│   ├── contract-edit.md
│   ├── installment-edit.md
│   ├── follow-up-delete.md
│   ├── dashboard-charts.md
│   ├── reports.md
│   ├── export.md
│   └── print-sidebar.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (dashboard)/
│   │   ├── contracts/[contractId]/     # ADD: edit form integration
│   │   ├── customers/[customerId]/     # ADD: notes display, edit form
│   │   ├── dashboard/                  # ADD: chart components
│   │   ├── installments/               # ADD: edit payment dialog
│   │   ├── reports/                    # NEW: index + 8 sub-pages
│   │   │   ├── page.tsx               # Reports index
│   │   │   ├── aging/page.tsx
│   │   │   ├── who-paid/page.tsx
│   │   │   ├── overdue/page.tsx
│   │   │   ├── penalties/page.tsx
│   │   │   ├── project-status/page.tsx
│   │   │   ├── collection-notes/page.tsx
│   │   │   ├── promises/page.tsx
│   │   │   └── no-follow-up/page.tsx
│   │   └── follow-ups/                 # ADD: delete button
│   ├── api/
│   │   ├── contracts/[contractId]/     # NEW: PATCH endpoint
│   │   ├── installments/[installmentId]/ # NEW: PATCH endpoint
│   │   ├── follow-ups/[followUpId]/    # ADD: DELETE handler
│   │   └── export/                     # NEW: Excel/CSV export endpoint
│   └── globals.css                     # ADD: print-specific styles
├── components/
│   ├── contracts/
│   │   └── contract-edit-form.tsx      # NEW
│   ├── customers/
│   │   └── customer-edit-form.tsx      # EXISTS — verify/extend
│   ├── dashboard/
│   │   ├── collection-by-project-chart.tsx  # NEW
│   │   └── aging-distribution-chart.tsx     # NEW
│   ├── follow-ups/                     # DELETE already inline in follow-ups-table.tsx
│   ├── installments/
│   │   └── installment-edit-form.tsx   # NEW
│   ├── reports/                        # Report-specific UI inline in pages (no separate components)
│   ├── ui/
│   │   └── export-button.tsx           # NEW
│   └── layout/
│       └── sidebar.tsx                 # ALREADY DONE: reports link exists at line 20
├── features/
│   ├── contracts/
│   │   └── schemas/contract-form.ts    # NEW: Zod schema
│   ├── installments/
│   │   └── schemas/installment-form.ts # NEW: Zod schema
│   └── exports/
│       ├── excel-exporter.ts           # NEW
│       └── csv-exporter.ts             # NEW
├── server/
│   ├── queries/
│   │   ├── read-model-helpers.ts       # ALREADY DONE: profiles already in ReadModelData
│   │   ├── reports/                    # NEW: 8 report query functions
│   │   │   ├── get-aging-report.ts
│   │   │   ├── get-who-paid-report.ts
│   │   │   ├── get-overdue-report.ts
│   │   │   ├── get-penalties-report.ts
│   │   │   ├── get-project-status-report.ts
│   │   │   ├── get-collection-notes-report.ts
│   │   │   ├── get-promises-report.ts
│   │   │   └── get-no-follow-up-report.ts
│   │   └── dashboard/
│   │       └── get-dashboard-charts.ts # NEW
│   └── services/
│       ├── contracts-service.ts        # NEW: updateContract()
│       ├── installments-service.ts     # NEW: updateInstallment()
│       └── follow-ups-service.ts       # MODIFY: add deleteFollowUp()
├── lib/
│   └── auth/
│       └── permissions.ts              # MODIFY: add reports.read
└── middleware.ts                        # No changes needed

tests/
├── unit/
│   ├── exports/                        # NEW: export logic tests
│   └── reports/                        # NEW: report derivation tests
├── contract/
│   ├── contract-edit.contract.test.ts  # NEW
│   ├── installment-edit.contract.test.ts # NEW
│   └── follow-up-delete.contract.test.ts # NEW
└── integration/
    └── reports/                        # NEW: report data tests
```

**Structure Decision**: Next.js App Router fullstack with existing modular separation. New files follow existing naming conventions (`get-[feature]-[type].ts` for queries, `[feature]-service.ts` for services, `[feature]-[component].tsx` for UI). No new architectural patterns introduced.

## Complexity Tracking

No constitution violations to justify. All new features use existing patterns and libraries.
