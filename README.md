# Collection System

Arabic-first collections workspace built with Next.js App Router and Supabase for imported financial data, customer servicing, follow-up operations, dashboard reporting, and units inventory.

## Implemented Workflows

- Secure dashboard workspace with role-aware navigation
- Excel imports for sold units, available units, and installments with preview, approval, rejection, and issue review
- Customer, contract, installment, and unit read models with Arabic search and filters
- Follow-up creation, update, promises-due visibility, and customer history preservation across re-imports
- Dashboard KPI reporting with project filtering, overdue ranking, recent activity, and last-import visibility

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript 5
- Supabase Auth, Postgres, and Storage
- Tailwind CSS
- Vitest

## Local Setup

```bash
npm install
cp .env.example .env.local
npx supabase start
npx supabase db reset
npx supabase gen types typescript --local > src/types/database.ts
npm run dev
```

Required environment variables are listed in `.env.example` and `specs/001-collections-mvp/quickstart.md`.

## Main Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

## Current Validation Snapshot

Validated from the CLI on 2026-03-24:

- `npm run lint` - pass
- `npm run typecheck` - pass
- `npm test` - pass (`45` files, `92` tests)
- `npm run build` - pass

Focused validation also covers:

- Dashboard KPI reconciliation and project filtering
- Customer Arabic search latency and 50-row pagination threshold
- Installments workbook parsing duration and summary metrics
- Follow-up create/update contracts and promise visibility
- Units inventory filtering and sold-unit drill-through

## Operator Notes

- Recommended import order: sold units, available units, then installments
- Re-imports update source-owned financial fields without deleting manual follow-ups or promise-to-pay records
- Manual browser UAT checklist is documented in `specs/001-collections-mvp/quickstart.md`

## Status

- Story workflows through dashboard reporting and units inventory are implemented
- Manual collection-officer browser UAT remains pending operator execution

## Remaining Release Gate

- `T076` still requires a human operator to execute the browser checklist in `specs/001-collections-mvp/quickstart.md` and replace the pending UAT template entries with real pass/fail notes.
