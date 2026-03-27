# Data Model: System Completion — Charts, Reports, Exports, CRUD & UX Fixes

**Date**: 2026-03-25 | **Plan**: [plan.md](plan.md)

## Summary

No new database tables or migrations are required. All features operate on existing tables. This document maps each feature to the existing schema entities it reads from or writes to.

## Existing Schema (No Changes)

### Tables Used by New Features

| Table | Read By | Written By |
|-------|---------|------------|
| `profiles` | Collector name display, all report queries | — (not modified) |
| `customers` | Customer edit, all reports, export | Customer edit service |
| `contracts` | Contract edit, all reports, export | Contract edit service |
| `installments` | Installment edit, all reports, charts, export | Installment edit service |
| `follow_ups` | Follow-up delete, reports, charts | Follow-up delete service |
| `projects` | All reports, charts, export | — (not modified) |
| `units` | Unit reports, export | — (not modified) |
| `contract_units` | Contract detail, reports | — (not modified) |

### Key Columns for New Features

#### `profiles` (collector name resolution)
```
id          uuid PK
full_name   text NOT NULL
email       text
is_active   boolean DEFAULT true
```

#### `customers` (edit fields)
```
id              uuid PK
customer_name   text NOT NULL
normalized_name text
mobile          text
email           text
national_id     text
notes           text          ← already exists, used for customer notes feature
```

#### `contracts` (edit fields)
```
id                uuid PK
contract_code     text UNIQUE
contract_key      text UNIQUE
customer_id       uuid FK → customers
project_id        uuid FK → projects
collector_user_id uuid FK → profiles  ← used for collector assignment
contract_notes    text
delivery_date     date
actual_delivery_date date
contract_status   text CHECK (active/closed/cancelled/suspended)
```

#### `installments` (edit fields)
```
id                  uuid PK
contract_id         uuid FK → contracts
installment_type    text
due_date            date
amount_due          numeric NOT NULL CHECK >= 0
amount_collected    numeric NOT NULL CHECK >= 0  ← primary edit target
amount_outstanding  numeric NOT NULL CHECK >= 0  ← recalculated
payment_status      text CHECK (paid/partial/unpaid/overdue)  ← recalculated
payment_date        date          ← edit target
receipt_reference   text          ← edit target
delay_days          integer DEFAULT 0  ← recalculated
delay_bucket        text CHECK (not_due/1_30/31_60/61_90/90_plus)  ← recalculated
penalty_amount      numeric DEFAULT 0  ← edit target
```

#### `follow_ups` (delete target)
```
id                uuid PK
contract_id       uuid FK → contracts
customer_id       uuid FK → customers
collector_user_id uuid FK → profiles
created_by        uuid FK → profiles
contact_type      text CHECK (call/whatsapp/meeting/email/other)
follow_up_date    date
note              text
customer_response text
promised_to_pay   boolean DEFAULT false
promise_date      date
next_action_date  date
follow_up_status  text CHECK (open/done/missed)
```

## Derived Data (In-Memory, Not Stored)

### Report Aggregations

All report data is derived in-memory from `loadReadModelData()`. No database views or materialized tables.

| Report | Source Tables | Derivation |
|--------|-------------|------------|
| Aging | installments, contracts, customers, projects | Group by `delay_bucket`, sum `amount_outstanding` |
| Who Paid | installments, contracts, customers, projects | Group by customer, check if all installments paid |
| Overdue | installments, contracts, customers, projects | Filter `payment_status = 'overdue'`, sort by `delay_days` desc |
| Penalties | installments, contracts, customers, projects | Filter `penalty_amount > 0` |
| Project Status | installments, contracts, projects | Group by project, sum due/collected/outstanding |
| Collection Notes | follow_ups, contracts, customers, projects | Latest follow-ups per customer with notes |
| Promises | follow_ups, contracts, customers, projects | Filter `promised_to_pay = true` and `promise_date` not null |
| No Follow-up | customers, follow_ups, contracts, projects | Customers with zero follow-ups in last N days |

### Chart Data

| Chart | Source | Derivation |
|-------|--------|------------|
| Collection by Project (bar) | installments, contracts, projects | Group by project → sum `amount_collected`, `amount_outstanding` |
| Aging Distribution (pie) | installments | Group by `delay_bucket` → count or sum `amount_outstanding` |

## Permission Model Changes

### New Permission Key

```typescript
// Add to PermissionKey union type:
"reports.read"

// Add to AppScreen union type:
"reports"

// Add to SCREEN_PERMISSION_MAP:
reports: "reports.read"

// Add to ROLE_PERMISSION_MAP (all roles):
admin:     [...existing, "reports.read"]
manager:   [...existing, "reports.read"]
collector: [...existing, "reports.read"]
viewer:    [...existing, "reports.read"]
```

### Edit Authorization (No New Keys)

Editing customers, contracts, and installments uses a service-layer role check:

```typescript
// Shared pattern — no new permission keys
function requireAdminOrManager(sessionUser: SessionUser): void {
  const isAllowed = sessionUser.roles.some(
    (a) => a.role === "admin" || a.role === "manager"
  );
  if (!isAllowed) {
    throw new AuthorizationError("forbidden", FORBIDDEN_MESSAGE, 403);
  }
}
```

## Zod Schemas (New)

### Contract Edit Schema

```typescript
export const updateContractSchema = z.object({
  collectorUserId: z.string().uuid().nullable().optional(),
  contractNotes: z.string().trim().nullable().optional(),
  contractStatus: z.enum(["active", "closed", "cancelled", "suspended"]).optional(),
  deliveryDate: z.string().nullable().optional(),
});
```

### Installment Edit Schema

```typescript
export const updateInstallmentSchema = z.object({
  amountCollected: z.number().min(0, "المبلغ المحصل يجب أن يكون صفر أو أكثر").optional(),
  paymentDate: z.string().nullable().optional(),
  penaltyAmount: z.number().min(0, "الغرامة يجب أن تكون صفر أو أكثر").nullable().optional(),
  receiptReference: z.string().trim().nullable().optional(),
});
```

## Indexes (Existing — No Changes)

The following indexes already exist and support the new features:
- `contracts.contract_code` (unique)
- `installments.contract_id`
- `installments.due_date`
- `installments.payment_status`
- `customers.normalized_name`
- `follow_ups.customer_id`
- `follow_ups.contract_id`
- `units.project_id`
