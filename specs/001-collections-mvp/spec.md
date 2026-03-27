# Feature Specification: Collections Management MVP

**Feature Branch**: `001-collections-mvp`
**Created**: 2026-03-23
**Status**: Draft
**Input**: User description: "Build the MVP of an internal Arabic-first RTL real-estate collections management application. The MVP must include authentication, role-based access, normalized schema, Excel import center with preview and issue tracking, safe matching and upsert behavior, customer profiles, installments screen, follow-ups screen, units view, contracts view, and an Arabic operational dashboard. This MVP replaces scattered Excel-based collections tracking and must preserve internal follow-up notes during repeated accounting data imports."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Excel Data Import with Preview and Issue Tracking (Priority: P1)

A collection manager receives updated Excel exports from the accounting system (installment reports, sold unit lists, available unit lists). They upload these files into the system, preview the parsed data, review any validation issues (unknown projects, duplicate keys, malformed dates, missing fields), and approve or reject the import. The system creates or updates customers, contracts, units, and installments without overwriting any internally-created follow-up notes, assignments, or promise-to-pay records.

**Why this priority**: Without imported data, no other screen has content. The import pipeline is the foundation that populates every downstream view. It must also be safe — repeated imports from updated accounting exports must never destroy operational collection data.

**Independent Test**: Upload each of the three Phase 1 Excel source files (installments report, sold units, available units), verify preview displays correct row counts, approve import, and confirm that customers, contracts, units, and installments appear correctly in the database. Re-import the same file and verify no duplicates are created and no follow-up notes are lost.

**Acceptance Scenarios**:

1. **Given** no data exists in the system, **When** the manager uploads the installments Excel file and approves the import, **Then** all valid customer, contract, and installment records are created, summary/total rows are excluded, and the import batch log shows row counts (total, imported, skipped) with status `approved`.
2. **Given** data already exists from a previous import, **When** the manager uploads an updated installments Excel file, **Then** existing records are updated with new values, new records are inserted, and any follow-up notes or promise-to-pay records linked to those contracts remain untouched.
3. **Given** an Excel file contains rows with unknown project names, unparseable dates, or duplicate business keys, **When** the manager previews the import, **Then** each problematic row is listed as an import issue with severity level, row number, raw value, and a human-readable Arabic description of the problem.
4. **Given** a contract in the Excel file references multiple units (e.g., "B28+B29" or "T1-T2-T3-T4-T5-T6"), **When** the import runs, **Then** the system parses the composite unit code into individual units and creates the correct contract-to-unit linkages.
5. **Given** a sold unit file and an available unit file both list the same unit code for the same project, **When** both files are imported, **Then** the system logs a conflict as an import issue and does not silently overwrite one status with the other.

---

### User Story 2 - Customer & Contract Collection Status (Priority: P2)

A collection officer opens the customer list, searches by name (partial Arabic match), filters by project or payment status, and selects a customer to see their full collection profile. The profile shows all contracts, linked units, installment schedule with amounts due/collected/outstanding, payment status badges, delay days, penalties, and the full history of follow-up notes. This is the primary daily working screen.

**Why this priority**: The core reason the application exists is answering "who owes what and how much is overdue?" This screen replaces the officer's manual Excel lookup and must be faster and more reliable.

**Independent Test**: After data import (US1), search for a known customer by partial Arabic name, open their profile, and verify that all contracts, units, installments (with correct statuses and amounts), and any existing follow-ups are displayed accurately.

**Acceptance Scenarios**:

1. **Given** imported data exists, **When** an officer types a partial Arabic customer name in the search field, **Then** matching customers are displayed within 2 seconds, supporting partial Arabic matching.
2. **Given** a customer has multiple contracts across different projects, **When** the officer opens the customer profile, **Then** all contracts are listed with their project, linked units, total due, total collected, total outstanding, and derived contract status.
3. **Given** a contract has installments, **When** the officer views the installment table, **Then** each installment shows: type, due date, amount due, amount collected, outstanding balance, payment status (paid/partial/unpaid/overdue), delay days, and penalty amount. Overdue installments are visually highlighted.
4. **Given** a contract is linked to multiple units (e.g., B28+B29), **When** the officer views the contract detail, **Then** all linked units are listed individually with their codes and project.

---

### User Story 3 - Collection Follow-Up Management (Priority: P3)

A collection officer records follow-up interactions with customers: phone calls, WhatsApp messages, meetings, and emails. Each follow-up captures the date, contact type, notes, whether the customer promised to pay, the promised date, and the next scheduled action. Officers can view all upcoming follow-ups, overdue follow-ups, and open promise-to-pay commitments.

**Why this priority**: Follow-ups are the operational heart of collection work. Without structured follow-up tracking, officers revert to personal notes and spreadsheets, defeating the purpose of the system.

**Independent Test**: Create a new follow-up for an existing contract, set a promise-to-pay date, then verify it appears in the follow-up list, the customer profile, and the promises-due report.

**Acceptance Scenarios**:

1. **Given** a customer profile is open, **When** the officer clicks "add follow-up" and fills in contact type, notes, and a promise date, **Then** the follow-up is saved and immediately visible in the customer's follow-up history.
2. **Given** follow-ups exist with next-action dates in the past, **When** the officer opens the follow-ups list, **Then** overdue follow-ups are highlighted and filterable.
3. **Given** a follow-up has a promise-to-pay date of tomorrow, **When** the manager views the "promises due" report, **Then** that follow-up appears in the list with customer name, contract, promised amount context, and date.
4. **Given** an Excel re-import occurs after follow-ups have been created, **When** the import completes, **Then** all follow-up records remain intact and unchanged.

---

### User Story 4 - Management Dashboard (Priority: P4)

The collection manager or director opens the dashboard and sees at a glance: total due, total collected, total outstanding, total overdue, total penalties, number of customers paid/unpaid/overdue, number of open promise-to-pay commitments, breakdown by project, top overdue customers, and recent follow-up activity. All figures are in Arabic with Egyptian Pound formatting.

**Why this priority**: Management needs a single screen to assess collection health without clicking into individual customers. This drives resource allocation and escalation decisions.

**Independent Test**: After importing data and creating some follow-ups, open the dashboard and verify that all KPI cards show correct aggregated numbers matching manual calculations from the source data.

**Acceptance Scenarios**:

1. **Given** imported data exists across all three projects (IL Parco, IL Centro, Caza), **When** the manager opens the dashboard, **Then** KPI cards display: total due, total collected, total outstanding, total overdue, total penalties, collection percentage, count of customers who paid / did not pay / are overdue, and count of open promises.
2. **Given** dashboard is open, **When** the manager filters by a specific project, **Then** all KPIs recalculate for that project only.
3. **Given** follow-ups exist, **When** the dashboard loads, **Then** a "recent follow-ups" section shows the most recent follow-up entries with customer name, date, and summary.
4. **Given** overdue installments exist, **When** the dashboard loads, **Then** a "top overdue customers" section lists customers ranked by total overdue amount.

---

### User Story 5 - Units Inventory View (Priority: P5)

A team member opens the units screen to see all units across all projects, filtered by status (sold or available) and project. Sold units link to their associated contract and customer. Available units show list price and area information.

**Why this priority**: Units inventory is a supporting reference view. While less critical than collection workflows, it provides essential context for managers assessing project-level sales performance and available stock.

**Independent Test**: After importing sold and available unit files, open the units view, filter by project and status, and verify correct unit counts, prices, and areas. Click a sold unit and verify navigation to its contract.

**Acceptance Scenarios**:

1. **Given** sold and available unit files have been imported, **When** the user opens the units screen, **Then** all units are listed with project, unit code, status (sold/available), area, and price.
2. **Given** units are displayed, **When** the user filters by "sold" and "IL Parco", **Then** only sold units from IL Parco are shown.
3. **Given** a unit is sold and linked to a contract, **When** the user clicks the unit row, **Then** they can navigate to the associated contract and customer.

---

### Edge Cases

- What happens when the same Excel file is uploaded twice in succession? (System must be idempotent — no duplicates created.)
- What happens when a customer name in the Excel has leading/trailing spaces or inconsistent Arabic characters? (System must normalize text before matching.)
- What happens when an installment has a future due date but is already partially paid? (Status must be "partial", not "unpaid".)
- What happens when a contract references a unit code that does not exist in any imported unit file? (System must log an import issue but still create the contract.)
- What happens when the user's session expires while previewing an import? (System must require re-authentication; partial imports must not be committed.)
- What happens when monetary values in Excel contain text or special characters? (System must log as import issue with the raw value preserved.)

## Requirements *(mandatory)*

### Functional Requirements

**Authentication & Access**
- **FR-001**: System MUST require authentication for all screens. Unauthenticated users MUST be redirected to a login page.
- **FR-002**: System MUST support four roles with these permission boundaries:
  - **Admin**: All actions including user management, imports, follow-ups, and all views.
  - **Manager**: Trigger imports, view all customers and data, create/edit follow-ups on any contract, access dashboard and all reports.
  - **Collector**: View only customers who have contracts assigned to this collector, create/edit own follow-ups only, no import access, no user management.
  - **Viewer**: Read-only access to all screens. No imports, no follow-up creation, no edits.
- **FR-003**: Admin users MUST be able to manage user accounts and role assignments.

**Data Model**
- **FR-004**: System MUST store data in separate, normalized entities: projects, units, customers, contracts, contract-unit linkages, installments, follow-ups, import batches, import files, and import issues.
- **FR-005**: System MUST support three projects: IL Parco, IL Centro, and Caza, seeded on first deployment.
- **FR-006**: System MUST support contracts linked to one or more units through a many-to-many relationship (contract-unit linkage table).
- **FR-007**: System MUST preserve business keys (installment codes, unit keys, contract keys, canonical customer keys, and project-scoped customer import keys) as unique identifiers or matching references during re-imports.

**Import Pipeline**
- **FR-008**: System MUST accept Excel file uploads for three Phase 1 import types: installments report, sold units, and available units. Detailed contract enrichment is deferred to Phase 2.
- **FR-009**: System MUST display a preview of parsed rows before the user approves the import. Preview MUST show row count, sample data, and any detected issues.
- **FR-010**: System MUST parse composite unit codes (e.g., "B28+B29", "G3+G4", "T1-T2-T3-T4-T5-T6") into individual unit references and create appropriate linkages.
- **FR-011**: System MUST log every import operation as a batch with: file name, import type, status, total rows, imported rows, skipped rows, and error details.
- **FR-012**: System MUST log individual import issues with: severity (high/medium/low), issue type, raw value, human-readable Arabic message, and source row number. The system MUST provide a dedicated import issues screen with filters for batch, severity, and issue type.
- **FR-013**: System MUST support idempotent imports: uploading the same file twice MUST NOT create duplicate records. Matching MUST use business keys. For customers, matching MUST use a project-scoped customer identity built from `(normalized_name + project)` and stored as a deterministic `customer_import_key`; contracts and follow-ups remain linked to a canonical customer record.
- **FR-014**: System MUST NEVER overwrite or delete follow-ups, manual notes, collector assignments, or promise-to-pay records during an import operation. For source-owned fields (financial amounts, dates, payment status from Excel), the system MUST auto-apply updates from the accounting export without per-field approval. The import summary MUST show the count of updated records alongside created and skipped counts.
- **FR-015**: System MUST exclude summary/total rows from Excel files during parsing.
- **FR-016**: System MUST normalize imported data: trim whitespace, remove duplicate spaces, standardize project names, parse dates to ISO format, convert monetary values to decimal.

**Customer & Contract Views**
- **FR-017**: System MUST provide a searchable customer list with partial Arabic name matching.
- **FR-018**: System MUST provide filters on the customer list: by project, by payment status (all paid, has overdue, has outstanding).
- **FR-019**: System MUST provide a customer profile page showing: customer details, all contracts with linked units, installment schedule, follow-up history, and aggregate totals (due, collected, outstanding, penalties).
- **FR-020**: System MUST provide a contracts list view showing: contract code, customer, project, linked units, total due, collected, outstanding, and contract status.

**Installments**
- **FR-021**: System MUST derive installment payment status automatically using this precedence: "paid" if outstanding is zero or less, "overdue" if outstanding is positive and due date has passed (regardless of partial payment), "partial" if some amount collected but outstanding remains and due date has not passed, "unpaid" if no amount collected and due date has not passed.
- **FR-022**: System MUST calculate delay days as the number of days between today and the due date for any installment that is not fully paid and past due. Otherwise delay days MUST be zero.
- **FR-023**: System MUST compute stored `penalty_amount` in Phase 1 using the imported penalty value only: normalize it to a non-negative decimal, flag invalid or negative values as import issues, and default missing values to `0`. Phase 1 does not derive penalties from overdue duration or contract business formulas.

**Follow-Ups**
- **FR-024**: System MUST allow creating follow-up records linked to a contract and/or customer, with fields: date, contact type (call, WhatsApp, meeting, email, other), notes, customer response, promise-to-pay flag, promise date, next action date, assigned collector, and status (open, done, missed). Follow-ups MUST be editable (status, notes, promise date, next action date) but MUST NEVER be deletable. Edit history is not tracked in Phase 1.
- **FR-025**: System MUST provide a follow-ups list view with filters: by collector, by date range, by status, and by promise-to-pay commitments.

**Units**
- **FR-026**: System MUST provide a units list view with filters: by project, by status (sold/available).
- **FR-027**: System MUST display unit details: project, unit code, floor, built-up area, garden area, list price, contract price (if sold), and linked contract (if sold).

**Dashboard**
- **FR-028**: System MUST display a dashboard with KPI cards: total due, total collected, total outstanding, total overdue, total penalties, collection percentage, count of paid/unpaid/overdue customers, and count of open promise-to-pay commitments.
- **FR-029**: Dashboard MUST support filtering by project.
- **FR-030**: Dashboard MUST show a "top overdue customers" ranked list and a "recent follow-ups" activity feed.

**User Interface**
- **FR-031**: All screens MUST be rendered in Arabic with right-to-left (RTL) layout.
- **FR-032**: Monetary values MUST be formatted for Egyptian Pound display with thousands separators. All numerals (financial figures, dates, counts) MUST use Western/European digits (0-9), which is the standard in Egyptian business contexts. Arabic-Indic digits (٠-٩) MUST NOT be used.
- **FR-033**: All data tables MUST support pagination for datasets exceeding 50 rows.
- **FR-034**: The system MUST display a "last data update" timestamp indicating when the most recent import was completed.

### Key Entities

- **Project**: One of three real-estate developments (IL Parco, IL Centro, Caza). Container for units and contracts.
- **Unit**: A specific property within a project. Has a code, area measurements, price, and sold/available status. Identified uniquely by project + unit code.
- **Customer**: A buyer. Has a name, optional contact details, and one or more contracts.
- **Customer Import Identity**: A project-scoped matching identity used to make re-imports safe without fragmenting the canonical customer profile.
- **Contract**: A purchase agreement between a customer and the company for one or more units in a project. Central entity linking customer, units, and installments.
- **Contract-Unit Linkage**: Many-to-many relationship between contracts and units, supporting multi-unit contracts.
- **Installment**: A scheduled payment within a contract. Has due date, amounts (due, collected, outstanding), status, delay information, and a stored penalty amount normalized from imported data.
- **Follow-Up**: An operational record of a collection interaction. Linked to a contract and/or customer. Contains notes, promises, and next actions. NEVER overwritten by imports.
- **Import Batch**: A record of one import operation, tracking file, type, status, and row counts.
- **Import Issue**: A specific data quality problem found during an import, with severity, context, and resolution status.

### Assumptions

- The three Phase 1 Excel source files follow the column structures documented in DATA_DICTIONARY_AR.md. If column names shift, the import mapping layer handles the translation.
- The system operates in a single timezone (Egypt, UTC+2). All dates are stored and displayed in this timezone.
- The system serves a small internal team (under 50 concurrent users). Extreme scalability is not a Phase 1 concern.
- Contract-specific penalty formulas are not yet defined. Phase 1 computes stored `penalty_amount` from imported source values only.
- "Viewer" role users can see all data but cannot create follow-ups or trigger imports.

## Clarifications

### Session 2026-03-23

- Q: How should the system match an incoming Excel row to an existing customer during re-import? → A: Match by a project-scoped customer identity derived from `(normalized_name + project)`. Store that deterministic value as `customer_import_key`, while preserving a canonical customer record that can span multiple projects.
- Q: What are the exact permission boundaries for each role? → A: Admin: all actions. Manager: import, view all, create/edit follow-ups, dashboard. Collector: view assigned customers only, create/edit own follow-ups. Viewer: read-only all screens.
- Q: Can follow-ups be edited or deleted after creation? → A: Follow-ups can be edited (status, notes, promise date, next action date) but never deleted. Edit history not tracked in Phase 1.
- Q: When a re-import updates existing installment financial data, should changes apply automatically or require approval? → A: Auto-apply all source-owned field updates (amounts, dates, status). Import summary shows updated record counts. No per-field approval needed.
- Q: Which numeral system should be used for financial figures and dates? → A: Western/European digits (0-9), standard for Egyptian business. No Arabic-Indic digits.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Collection officers can look up any customer's full collection status (contracts, installments, follow-ups) within 10 seconds of logging in, replacing the previous multi-file Excel lookup that took 5+ minutes.
- **SC-002**: A complete import of the installments Excel file (all rows) completes within 3 minutes, with a clear summary showing exactly how many records were created, updated, and skipped.
- **SC-003**: Re-importing an updated Excel file preserves 100% of internally-created follow-up notes, promise-to-pay records, and collector assignments — zero data loss on operational records.
- **SC-004**: The dashboard accurately reflects aggregated collection data: total due, collected, outstanding, and overdue figures match manual verification from source Excel files within 1% tolerance (accounting for rounding).
- **SC-005**: 90% of collection officers can complete their daily workflow (look up customer, review status, log a follow-up) without training beyond a 15-minute walkthrough, validated by user testing.
- **SC-006**: Import issues (bad data, conflicts, unknown projects) are surfaced to the user with clear Arabic descriptions for every problematic row — zero silent data loss.
- **SC-007**: All composite unit codes (e.g., "B28+B29", "T1-T2-T3-T4-T5-T6") are correctly parsed and linked, verified by automated tests covering at least 5 composite patterns.
- **SC-008**: The system supports the four defined roles (admin, manager, collector, viewer) with appropriate access restrictions, verified by testing each role against all screens.
