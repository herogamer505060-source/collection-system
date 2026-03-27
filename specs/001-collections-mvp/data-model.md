# Data Model: Collections Management MVP

**Feature**: 001-collections-mvp
**Date**: 2026-03-23
**Source**: `spec.md`, `constitution.md`, `APP_ARCHITECTURE_SUPABASE_AR.md`, `DB_SCHEMA_AR.md`, `DATA_DICTIONARY_AR.md`

## Entity Overview

```text
projects ──1:N──► units
projects ──1:N──► contracts
projects ──1:N──► customer_project_identities

customers ──1:N──► customer_project_identities
customers ──1:N──► contracts
customers ──1:N──► follow_ups

contracts ──1:N──► contract_units ◄──N:1── units
contracts ──1:N──► installments
contracts ──1:N──► follow_ups

import_batches ──1:N──► import_files
import_batches ──1:N──► import_issues

auth.users ──1:1──► profiles ──1:N──► user_roles
profiles ──1:N──► contracts (collector_user_id)
profiles ──1:N──► follow_ups (created_by / collector_user_id)
```

## Core Entities

### projects
Reference data for the three supported developments.

| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| project_code | text | UNIQUE NOT NULL (`parco`, `centro`, `caza`) |
| name_ar | text | NOT NULL |
| name_en | text | NOT NULL |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

Normalization map:
- `IL Parco` -> `parco`
- `IL Centro` -> `centro`
- `Caza` -> `caza`

### units
Unified inventory for sold and available units.

| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| project_id | uuid | FK -> projects.id, NOT NULL |
| unit_key | text | UNIQUE NOT NULL |
| unit_code | text | NOT NULL |
| floor_name | text | nullable |
| built_up_area | numeric(12,2) | nullable |
| garden_area | numeric(12,2) | nullable |
| other_area | numeric(12,2) | nullable |
| list_price | numeric(18,2) | nullable |
| contract_price | numeric(18,2) | nullable |
| unit_status | text | NOT NULL, CHECK in (`sold`, `available`) |
| source_sold | boolean | NOT NULL DEFAULT false |
| source_available | boolean | NOT NULL DEFAULT false |
| status_conflict | boolean | NOT NULL DEFAULT false |
| source_batch_id | uuid | FK -> import_batches.id, nullable |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

Rules:
- `unit_key` format: `{project_code}::{normalized_unit_code}`.
- `status_conflict = true` when the same unit appears in both sold and available imports; importer logs an issue and does not silently overwrite status.
- UNIQUE index on `(project_id, unit_code)` in addition to `unit_key`.

### customers
Canonical buyer entity used by screens and follow-ups.

| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| customer_key | text | UNIQUE NOT NULL |
| customer_name | text | NOT NULL |
| normalized_name | text | NOT NULL |
| customer_name_raw | text | nullable |
| mobile | text | nullable |
| email | text | nullable |
| national_id | text | nullable |
| notes | text | nullable |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

Rules:
- `customer_key` is a stable canonical internal key, not the project-scoped import key.
- Search uses `normalized_name` and `customer_name`.

### customer_project_identities
Project-scoped matching identities used only to make re-imports safe.

| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| customer_id | uuid | FK -> customers.id, NOT NULL |
| project_id | uuid | FK -> projects.id, NOT NULL |
| customer_import_key | text | UNIQUE NOT NULL |
| normalized_name | text | NOT NULL |
| customer_name_raw | text | nullable |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

Rules:
- `customer_import_key` format: `{project_code}::{normalized_name}`.
- UNIQUE constraint on `(project_id, normalized_name)`.
- All import matching for customers uses this table first.

### contracts
Commercial agreement linking a customer to one or more units in one project.

| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| contract_key | text | UNIQUE NOT NULL |
| contract_code | text | nullable |
| customer_id | uuid | FK -> customers.id, NOT NULL |
| project_id | uuid | FK -> projects.id, NOT NULL |
| collector_user_id | uuid | FK -> profiles.id, nullable |
| contract_notes | text | nullable |
| delivery_date | date | nullable |
| actual_delivery_date | date | nullable |
| contract_status | text | NOT NULL DEFAULT `active`, CHECK in (`active`, `closed`, `cancelled`, `suspended`) |
| source_batch_id | uuid | FK -> import_batches.id, nullable |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

Matching rules:
- Prefer source `contract_code` when it is trustworthy and unique.
- Fallback `contract_key` uses project + customer import identity + normalized ordered unit set.
- Detailed contract enrichment is deferred to Phase 2.

### contract_units
Many-to-many link between contracts and units.

| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| contract_id | uuid | FK -> contracts.id, NOT NULL, ON DELETE CASCADE |
| unit_id | uuid | FK -> units.id, NOT NULL |
| unit_order | integer | nullable |
| created_at | timestamptz | NOT NULL DEFAULT now() |

Constraint: UNIQUE `(contract_id, unit_id)`

### installments
Scheduled financial obligations within a contract.

| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| installment_key | text | UNIQUE NOT NULL |
| installment_code | text | nullable |
| contract_id | uuid | FK -> contracts.id, NOT NULL |
| installment_type | text | NOT NULL |
| due_date | date | NOT NULL |
| amount_due | numeric(18,2) | NOT NULL |
| net_amount | numeric(18,2) | nullable |
| amount_collected | numeric(18,2) | NOT NULL DEFAULT 0 |
| amount_outstanding | numeric(18,2) | NOT NULL DEFAULT 0 |
| payment_status | text | NOT NULL, CHECK in (`paid`, `partial`, `unpaid`, `overdue`) |
| payment_date | date | nullable |
| commercial_paper | text | nullable |
| receipt_reference | text | nullable |
| delay_days | integer | NOT NULL DEFAULT 0 |
| delay_bucket | text | NOT NULL DEFAULT `not_due`, CHECK in (`not_due`, `1_30`, `31_60`, `61_90`, `90_plus`) |
| penalty_amount | numeric(18,2) | NOT NULL DEFAULT 0 |
| source_batch_id | uuid | FK -> import_batches.id, nullable |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

Rules:
- `installment_key` uses source `installment_code` when present; otherwise importer generates a deterministic fallback key and logs the fallback in the batch summary.
- `payment_status` is always derived from due date and amounts; imported human-readable status text is not authoritative.
- `amount_outstanding` is normalized from source values and re-computed if necessary as `amount_due - amount_collected`.
- `delay_bucket` is persisted and derived from `delay_days` as `not_due`, `1_30`, `31_60`, `61_90`, or `90_plus`.
- `penalty_amount` is normalized from the imported penalty value, defaults to `0` when missing, and creates an import issue when negative or invalid.

### follow_ups
Internal operational collection records. These are never overwritten or deleted by imports.

| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| contract_id | uuid | FK -> contracts.id, nullable |
| customer_id | uuid | FK -> customers.id, NOT NULL |
| follow_up_date | timestamptz | NOT NULL |
| contact_type | text | NOT NULL, CHECK in (`call`, `whatsapp`, `meeting`, `email`, `other`) |
| note | text | NOT NULL |
| customer_response | text | nullable |
| promised_to_pay | boolean | NOT NULL DEFAULT false |
| promise_date | date | nullable |
| next_action_date | date | nullable |
| collector_user_id | uuid | FK -> profiles.id, nullable |
| follow_up_status | text | NOT NULL DEFAULT `open`, CHECK in (`open`, `done`, `missed`) |
| created_by | uuid | FK -> profiles.id, NOT NULL |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

Rules:
- Follow-ups are editable but never deletable.
- Collectors can edit only their own follow-ups; managers/admins can edit all.
- `missed` is used when the planned next action was not completed in time.

### import_batches
Top-level record for every import workflow.

| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| batch_type | text | NOT NULL, CHECK in (`installments`, `sold_units`, `available_units`) |
| status | text | NOT NULL, CHECK in (`uploaded`, `processing`, `ready_for_review`, `approved`, `approved_with_issues`, `rejected`, `failed`) |
| created_by | uuid | FK -> profiles.id, NOT NULL |
| started_at | timestamptz | NOT NULL DEFAULT now() |
| previewed_at | timestamptz | nullable |
| finished_at | timestamptz | nullable |
| rows_total | integer | NOT NULL DEFAULT 0 |
| rows_valid | integer | NOT NULL DEFAULT 0 |
| rows_imported | integer | NOT NULL DEFAULT 0 |
| rows_updated | integer | NOT NULL DEFAULT 0 |
| rows_skipped | integer | NOT NULL DEFAULT 0 |
| issue_count | integer | NOT NULL DEFAULT 0 |
| summary_json | jsonb | nullable |
| error_log | jsonb | nullable |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

### import_files
Metadata for uploaded Excel files attached to a batch.

| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| batch_id | uuid | FK -> import_batches.id, NOT NULL, ON DELETE CASCADE |
| file_name | text | NOT NULL |
| storage_path | text | NOT NULL |
| source_type | text | NOT NULL, CHECK in (`installments_report`, `sold_units_report`, `available_units_report`) |
| sheet_name | text | nullable |
| header_row_number | integer | nullable |
| detected_columns | jsonb | nullable |
| raw_rows_count | integer | NOT NULL DEFAULT 0 |
| valid_rows_count | integer | NOT NULL DEFAULT 0 |
| rejected_rows_count | integer | NOT NULL DEFAULT 0 |
| created_at | timestamptz | NOT NULL DEFAULT now() |

### import_issues
Structured data-quality problems discovered during parsing, validation, matching, or upsert preparation.

| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| batch_id | uuid | FK -> import_batches.id, NOT NULL, ON DELETE CASCADE |
| import_file_id | uuid | FK -> import_files.id, nullable, ON DELETE SET NULL |
| severity | text | NOT NULL, CHECK in (`high`, `medium`, `low`) |
| issue_type | text | NOT NULL |
| raw_value | text | nullable |
| message_ar | text | NOT NULL |
| source_row_number | integer | nullable |
| payload | jsonb | nullable |
| resolved | boolean | NOT NULL DEFAULT false |
| resolved_by | uuid | FK -> profiles.id, nullable |
| resolved_at | timestamptz | nullable |
| created_at | timestamptz | NOT NULL DEFAULT now() |

### profiles
Application profile data linked to Supabase Auth users.

| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK, FK -> auth.users.id |
| full_name | text | NOT NULL |
| email | text | nullable |
| default_project_id | uuid | FK -> projects.id, nullable |
| is_active | boolean | NOT NULL DEFAULT true |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

### user_roles
Role assignments for application users.

| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK -> profiles.id, NOT NULL, ON DELETE CASCADE |
| role | text | NOT NULL, CHECK in (`admin`, `manager`, `collector`, `viewer`) |
| project_id | uuid | FK -> projects.id, nullable |
| created_at | timestamptz | NOT NULL DEFAULT now() |

Constraint: UNIQUE `(user_id, role, project_id)`

## Derived Business Rules

### Installment Payment Status
- `paid` when `amount_outstanding <= 0`
- `partial` when `amount_collected > 0` and `amount_outstanding > 0`
- `overdue` when `amount_outstanding > 0` and `due_date < today`
- `unpaid` when `amount_collected = 0` and `due_date >= today`

### Delay Days
- `delay_days = today - due_date` when installment is not fully paid and `due_date < today`
- otherwise `delay_days = 0`

### Delay Bucket
- `not_due` when `delay_days = 0`
- `1_30` when `delay_days` is between 1 and 30
- `31_60` when `delay_days` is between 31 and 60
- `61_90` when `delay_days` is between 61 and 90
- `90_plus` when `delay_days > 90`

### Contract Status for Reports
Derived in query/report logic from installment outcomes and promise-to-pay state. Phase 1 report buckets:
- regular
- due_soon
- mildly_overdue
- moderately_overdue
- severely_overdue
- promise_to_pay_open

### Unit Conflict Rule
- If the same `unit_key` appears in both sold and available files, set `status_conflict = true`, log an `import_issues` record, and keep the last approved status unchanged until a user resolves the data conflict.

### Import Ownership Rule
- Source-owned and updatable on re-import: unit pricing/status fields, contract source details, installment dates and money fields.
- Internal-only and never overwritten by imports: follow-ups, promise tracking, collector assignments, manual operational notes, issue resolutions.

## State Transitions

### Import Batch Status
```text
uploaded -> processing -> ready_for_review -> approved
                                         -> approved_with_issues
                                         -> rejected
                    -> failed
```

### Follow-Up Status
```text
open -> done
open -> missed
missed -> done
```

### Contract Status
```text
active -> suspended
active -> closed
active -> cancelled
suspended -> active
```

## Key Indexes

- `projects(project_code)` unique
- `units(unit_key)` unique
- `units(project_id, unit_code)` unique
- `customers(customer_key)` unique
- `customers(normalized_name)` index
- `customer_project_identities(customer_import_key)` unique
- `customer_project_identities(project_id, normalized_name)` unique
- `contracts(contract_key)` unique
- `contracts(project_id)` index
- `contracts(customer_id)` index
- `contracts(collector_user_id)` index
- `installments(installment_key)` unique
- `installments(contract_id, due_date)` index
- `installments(payment_status, due_date)` index
- `installments(delay_bucket)` index
- `follow_ups(customer_id, follow_up_date)` index
- `follow_ups(collector_user_id, next_action_date)` index
- `import_issues(batch_id, severity)` index

## Out of Scope but Reserved

- `receipts` table for future receipt-level collections
- `penalty_rules` table for automated penalty calculation
- `audit_logs` for field-level history beyond Phase 1
