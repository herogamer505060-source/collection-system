# Feature Specification: System Completion — Charts, Reports, Exports, CRUD & UX Fixes

**Feature Branch**: `002-system-completion-2026`
**Created**: 2026-03-25
**Status**: Draft
**Input**: User description: "Complete the real estate collection system per plan2026.md — add dashboard charts, 8 report pages, Excel/CSV/PDF export, customer/contract/installment editing, follow-up delete, collector name display, and sidebar update"

## Clarifications

### Session 2026-03-25

- Q: Who should be allowed to edit customers, contracts, and installments? → A: Only admin and manager roles — enforced via a role check in the service layer (no new permission keys added).
- Q: In the "no follow-up" report, does any follow-up record count as contact, or only those with status "done"? → A: Any follow-up record counts as contact regardless of status (open, done, or missed). The report finds customers with zero follow-up records in the specified period.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Collector Name Display (Priority: P1)

As a manager or admin, I need to see the collector's **name** (not a UUID) on follow-ups and contracts so I can identify who is responsible for each account at a glance.

**Why this priority**: Currently the system displays raw UUIDs which are meaningless to users. This is a data-quality issue that affects every screen showing collector information and undermines trust in the system.

**Independent Test**: Navigate to the follow-ups list and verify that the "المحصل" column shows a human-readable name (e.g., "أحمد محمد") instead of a UUID string.

**Acceptance Scenarios**:

1. **Given** a follow-up record with an assigned collector, **When** a user opens the follow-ups list, **Then** the collector column displays the collector's full name.
2. **Given** a follow-up record with no assigned collector, **When** a user opens the follow-ups list, **Then** the collector column is empty or shows a dash.
3. **Given** a contracts list with assigned collectors, **When** a user views the contracts table, **Then** the collector column shows the collector's full name.
4. **Given** a collector whose profile was deleted, **When** the follow-up is displayed, **Then** the system shows the UUID as a fallback rather than crashing.

---

### User Story 2 - Customer Notes & Edit (Priority: P1)

As an admin or manager, I need to edit customer notes and contact details from the customer profile page so I can record important information without leaving the system. As any user with read access, I need to view customer notes on the profile page.

**Why this priority**: The user explicitly requested customer notes. Notes are essential for daily collection operations — officers need to record context about each customer (e.g., "customer travels frequently", "prefers WhatsApp contact").

**Independent Test**: Open a customer profile, click "تعديل بيانات العميل", update the notes field and mobile number, save, and verify the changes persist after page refresh.

**Acceptance Scenarios**:

1. **Given** a customer profile page, **When** the user clicks the edit button, **Then** an edit form appears with the customer's current data pre-filled (name, mobile, email, national ID, notes).
2. **Given** the edit form is open, **When** the user updates the notes field and clicks save, **Then** the notes are persisted and the profile page refreshes to show the updated notes.
3. **Given** the edit form is open, **When** the user enters an invalid email, **Then** a validation error message appears in Arabic.
4. **Given** a customer with existing notes, **When** any user views the customer profile, **Then** the notes are displayed prominently below the customer name.
5. **Given** the user clicks cancel on the edit form, **When** the form closes, **Then** no changes are saved.

---

### User Story 3 - Installment Payment Recording (Priority: P1)

As a collection officer, I need to record payments against installments (update amount collected, payment date, receipt reference) so the system reflects the latest collection status accurately.

**Why this priority**: This is the core operational function — without payment recording, the system cannot track collections and all KPIs become stale after the initial import.

**Independent Test**: Open an installment record, update the amount collected and payment date, save, and verify that payment status, outstanding amount, and delay days are automatically recalculated.

**Acceptance Scenarios**:

1. **Given** an unpaid installment, **When** the user records a partial payment (amount less than due), **Then** the payment status changes to "جزئي" and outstanding amount is recalculated.
2. **Given** an unpaid installment, **When** the user records a full payment (amount equals or exceeds due), **Then** the payment status changes to "مدفوع" and outstanding becomes zero.
3. **Given** an overdue installment, **When** the user records a full payment, **Then** the delay days reset to zero and the delay bucket updates accordingly.
4. **Given** the installment edit form, **When** the user updates the penalty amount, **Then** the penalty is persisted and reflected in dashboard KPIs.
5. **Given** an installment, **When** the user enters a negative amount collected, **Then** a validation error prevents saving.

---

### User Story 4 - Dashboard Charts (Priority: P2)

As a manager, I need visual charts on the dashboard showing collection performance by project and debt aging distribution so I can quickly understand the portfolio status without reading tables of numbers.

**Why this priority**: The dashboard currently has KPI cards only. Charts provide a visual summary that enables faster decision-making for management.

**Independent Test**: Open the dashboard page and verify that a bar chart (collection by project) and a pie chart (aging distribution) render with data matching the KPI numbers.

**Acceptance Scenarios**:

1. **Given** the dashboard page, **When** it loads with data, **Then** a bar chart showing collected vs. outstanding amounts per project is displayed.
2. **Given** the dashboard page, **When** it loads with data, **Then** a pie chart showing the distribution of outstanding debt across aging buckets is displayed.
3. **Given** the project filter is set to a specific project, **When** the dashboard reloads, **Then** the charts update to reflect only that project's data.
4. **Given** no installment data exists, **When** the dashboard loads, **Then** the charts display gracefully with an empty state.

---

### User Story 5 - Report Pages (Priority: P2)

As a manager, I need dedicated report pages (aging, who-paid, overdue customers, penalties, per-project status, collection notes, payment promises, customers without follow-up) so I can analyze collection performance from different angles.

**Why this priority**: Reports are the primary tool for management decision-making. Without them, managers must manually aggregate data from list pages.

**Independent Test**: Navigate to /reports, open the aging report, filter by project, and verify the table shows correct data with bucket summaries.

**Acceptance Scenarios**:

1. **Given** the reports index page, **When** a user navigates to /reports, **Then** they see 8 report cards with titles and descriptions in Arabic.
2. **Given** the aging report, **When** a user opens it, **Then** they see summary cards per delay bucket and a detailed table of overdue installments sorted by delay days.
3. **Given** the "who paid" report, **When** a user opens it, **Then** they see each customer's payment status (all paid / has outstanding / has overdue) with totals.
4. **Given** the "no follow-up" report with a 30-day threshold, **When** a user opens it, **Then** they see customers who have zero follow-up records (of any status) created in the last 30 days.
5. **Given** any report page, **When** a user applies a project filter, **Then** the report data filters to that project only.

---

### User Story 6 - Excel/CSV Export (Priority: P2)

As a manager, I need to export any report or list page to Excel or CSV so I can share data with stakeholders who do not have system access or perform further analysis in spreadsheets.

**Why this priority**: Export is the most requested feature for any internal business tool. It bridges the gap between the system and external analysis workflows.

**Independent Test**: Open the installments page, click "تصدير Excel", verify an .xlsx file downloads with correct Arabic headers and data matching the current filtered view.

**Acceptance Scenarios**:

1. **Given** any list page (customers, contracts, installments, follow-ups), **When** the user clicks the Excel export button, **Then** an .xlsx file downloads with the current filtered data.
2. **Given** any report page, **When** the user clicks the CSV export button, **Then** a .csv file downloads with UTF-8 BOM for correct Arabic display in Excel.
3. **Given** the export is in progress, **When** the user waits, **Then** the button shows a loading state and prevents double-clicks.
4. **Given** a filtered view (e.g., only overdue installments for a specific project), **When** the user exports, **Then** the exported file contains only the filtered data.

---

### User Story 7 - Contract Editing (Priority: P3)

As a manager, I need to edit contract details (notes, delivery date, assigned collector, status) so I can keep contract records accurate as projects progress.

**Why this priority**: Contract editing is less frequent than payment recording but necessary for data maintenance.

**Independent Test**: Open a contract detail page, edit the contract notes and change the collector, save, and verify changes persist.

**Acceptance Scenarios**:

1. **Given** a contract detail page, **When** the user clicks edit, **Then** a form appears with current values for notes, delivery date, collector, and status.
2. **Given** the edit form, **When** the user changes the contract status to "مغلق" and saves, **Then** the status updates and the page reflects the change.
3. **Given** the edit form, **When** the user selects a different collector, **Then** the new collector name appears on the contract after saving.

---

### User Story 8 - Follow-up Delete (Priority: P3)

As a collection officer, I need to delete a follow-up record that was created by mistake so I can keep follow-up history clean and accurate.

**Why this priority**: Lower priority because incorrectly created follow-ups are infrequent, and the existing update functionality can partially mitigate the issue.

**Independent Test**: Create a test follow-up, then delete it, and verify it no longer appears in the follow-up list or customer profile.

**Acceptance Scenarios**:

1. **Given** a follow-up the user has permission to edit, **When** the user clicks the delete button, **Then** a confirmation dialog appears in Arabic.
2. **Given** the confirmation is accepted, **When** the delete completes, **Then** the follow-up is removed from the list and the page refreshes.
3. **Given** a follow-up the user does not have permission to edit, **When** they view it, **Then** no delete button is shown.

---

### User Story 9 - Print / PDF Support (Priority: P3)

As a manager, I need to print any report page in a clean format so I can produce physical copies for meetings or archive purposes.

**Why this priority**: Print/PDF is a convenience feature that complements Excel export; lower priority because Excel export covers most sharing needs.

**Independent Test**: Open a report page, click "طباعة / PDF", and verify the browser print dialog opens with a clean layout (no sidebar, no navigation).

**Acceptance Scenarios**:

1. **Given** any report or list page, **When** the user clicks the print button, **Then** the browser print dialog opens.
2. **Given** the print preview, **When** the user reviews it, **Then** navigation, sidebar, and action buttons are hidden; only the data content is visible in RTL layout.

---

### User Story 10 - Sidebar Navigation Update (Priority: P3)

As any user, I need a "التقارير" link in the sidebar so I can navigate to the reports section easily.

**Why this priority**: This is a quick navigation fix that supports the reports feature (Story 5).

**Independent Test**: Log in and verify the sidebar shows "التقارير" link that navigates to /reports.

**Acceptance Scenarios**:

1. **Given** the sidebar, **When** the user views it, **Then** a "التقارير" link appears after "المتابعات".
2. **Given** the user is on a report page, **When** they view the sidebar, **Then** the "التقارير" link is highlighted as active.

---

### Edge Cases

- What happens when a customer has no contracts and a user tries to edit their profile? The edit should still work — notes and contact info are customer-level, not contract-dependent.
- What happens when an installment's amount collected exceeds amount due? The outstanding should clamp to zero (not go negative) and status should be "مدفوع".
- What happens when a report has zero matching rows? The page should display an empty state message rather than a blank table.
- What happens when the export is called with no data? The system should produce a valid file with headers only.
- What happens when a user tries to delete a follow-up while another user is editing it? The delete should succeed (last-write-wins); the editing user will see an error on save.
- What happens when the profiles table is empty (no users configured)? Collector names should fall back to showing the UUID.
- What happens when a collector or viewer role tries to access an edit API endpoint directly? The service layer returns a 403 Forbidden error.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display collector names (from profiles) instead of UUIDs on follow-ups and contracts lists.
- **FR-002**: System MUST allow admin and manager roles to edit customer details (name, mobile, email, national ID, notes) from the customer profile page. Collector and viewer roles MUST NOT see the edit button.
- **FR-003**: System MUST display customer notes on the customer profile page when present (visible to all roles with read access).
- **FR-004**: System MUST allow admin and manager roles to edit contract details (notes, delivery date, collector assignment, status) from the contract detail page.
- **FR-005**: System MUST allow admin and manager roles to record payments on installments (amount collected, payment date, receipt reference, penalty amount).
- **FR-006**: System MUST automatically recalculate payment status, outstanding amount, delay days, and delay bucket when an installment is updated.
- **FR-007**: System MUST allow deleting follow-up records with appropriate permission checks and confirmation.
- **FR-008**: System MUST display two charts on the dashboard: collection by project (bar) and aging distribution (pie).
- **FR-009**: System MUST provide a reports index page at /reports with navigation to 8 dedicated report pages.
- **FR-010**: System MUST provide the following report pages: aging, who-paid, overdue customers, penalties, per-project status, collection notes, payment promises, no-follow-up.
- **FR-011**: Each report page MUST support filtering by project at minimum.
- **FR-012**: System MUST support Excel (.xlsx) export from all list pages and report pages.
- **FR-013**: System MUST support CSV export with UTF-8 BOM for correct Arabic display.
- **FR-014**: System MUST provide a print-friendly layout that hides navigation and non-essential UI elements.
- **FR-015**: System MUST add a "التقارير" navigation item to the sidebar.
- **FR-016**: All new UI elements MUST use Arabic labels and support RTL layout.
- **FR-017**: All data mutations (edit, delete) MUST record audit events.
- **FR-018**: All new pages and API endpoints MUST enforce role-based permission checks.

### Key Entities

- **Profile**: Represents a system user with full name and email. Used to resolve collector names from UUIDs. Already exists in the database.
- **Customer**: Has name, contact details, and a notes field (already in DB). Now editable via the UI.
- **Contract**: Has notes, delivery date, collector assignment, and status. Now editable via the UI.
- **Installment**: Has financial amounts, payment status, and delay tracking. Now editable for payment recording.
- **Follow-up**: Existing entity gains a delete capability.
- **Report**: A derived view combining data from customers, contracts, installments, and follow-ups. Not a database entity — computed on read.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All collector references across the system display human-readable names instead of UUIDs (100% coverage on follow-ups and contracts lists).
- **SC-002**: Users can update customer notes and contact details in under 30 seconds from the customer profile page.
- **SC-003**: Users can record a payment on an installment and see the recalculated status within 5 seconds.
- **SC-004**: Dashboard displays at least 2 interactive charts that update when the project filter changes.
- **SC-005**: All 8 report pages are accessible from /reports with correct data and project filtering.
- **SC-006**: Users can export any list or report to Excel in under 10 seconds, producing a valid file with Arabic headers.
- **SC-007**: Users can delete a follow-up record with a single confirmation step.
- **SC-008**: The "no follow-up" report correctly identifies customers without contact in a configurable number of days (default 30).
- **SC-009**: All existing 92+ tests continue to pass after changes (no regressions).
- **SC-010**: The sidebar shows the reports link and correctly highlights the active page.

## Assumptions

- The `notes` column already exists on the `customers` table — no database migration is needed.
- The `profiles` table already contains `full_name` for all active users.
- Export functionality will use the `exceljs` library already installed in the project.
- Charts will use the `recharts` library already installed in the project.
- PDF export is handled via browser print (window.print) with print-specific CSS, not server-side PDF generation.
- Editing customers, contracts, and installments is restricted to admin and manager roles only. No new permission keys are added; the service layer performs a role check (admin or manager) before allowing mutations.
- All reports use the existing in-memory read-model pattern — no new database views or queries are needed.
- The "no follow-up" report defaults to 30 days but allows the user to specify a custom threshold via a form input.
