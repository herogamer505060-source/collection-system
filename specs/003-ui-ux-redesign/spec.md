# Feature Specification: UI/UX Redesign — "The Financial Architect"

**Feature Branch**: `003-ui-ux-redesign`
**Created**: 2026-03-25
**Status**: Draft
**Input**: User description: "UI/UX redesign based on Financial Architect design system from designplan.md"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Collection Agent Navigates Dashboard Without Visual Fatigue (Priority: P1)

A collection agent working an 8-hour shift opens the system dashboard. The interface presents financial data using a calm, high-contrast surface hierarchy with deep teal accents — no harsh borders, no visual clutter. Typography is clear and legible at every level, with large editorial-grade headings for KPI summaries and readable body text for data tables. The agent can quickly identify overdue amounts, collection progress, and pending follow-ups without eye strain.

**Why this priority**: The dashboard is the most-used screen. Collection agents spend their entire workday here. Visual fatigue directly impacts productivity and data accuracy. A calm, premium aesthetic with clear hierarchy is the foundation for every other improvement.

**Independent Test**: Can be fully tested by opening the dashboard after the redesign and verifying that all KPI cards, charts, and data tables render with the new surface hierarchy, typography scale, and color tokens — and that no legacy borders, gradients, or harsh shadows remain.

**Acceptance Scenarios**:

1. **Given** the agent opens the dashboard, **When** the page loads, **Then** all KPI metrics display with large editorial headings and subtle accent color strips (not gradient card backgrounds), and all content cards sit on a layered surface system without visible 1px borders.
2. **Given** the agent scans financial totals, **When** reading KPI values, **Then** primary metrics use a large display-scale font clearly distinguishable from labels and body text.
3. **Given** the agent works for several hours, **When** scanning the interface, **Then** the color palette uses no pure black or pure white — only warm neutrals and cool surfaces, reducing visual harshness.

---

### User Story 2 - Manager Browses List Pages with Clear Data Hierarchy (Priority: P1)

A manager opens the customers, contracts, or installments list page. Data tables display with ghost-border row separators (barely visible lines at 15% opacity) instead of heavy solid borders. Filter controls sit in clean surface cards without border outlines. Column headers are visually distinct through background color shifts rather than divider lines. The manager can efficiently scan, filter, and drill into records.

**Why this priority**: List pages are the second most-used screens. Clean data tables with proper surface hierarchy directly affect how quickly staff can locate and act on collection records.

**Independent Test**: Can be fully tested by opening any list page (customers, contracts, installments, units, follow-ups) and confirming that DataTable, FilterBar, and StatusBadge components render with Material Design token colors and the no-line rule is enforced.

**Acceptance Scenarios**:

1. **Given** the manager opens the customers page, **When** the table renders, **Then** row separators use ghost borders (outline-variant at 15% opacity) instead of solid visible border lines.
2. **Given** the manager views status badges (paid, overdue, partial), **When** badges render, **Then** they use semantic Material Design colors (error tints for danger, teal tints for success) instead of generic slate/rose/sky colors.
3. **Given** the manager uses the filter bar, **When** the filter section renders, **Then** it appears as a white surface card with ambient shadow — no visible border outline.

---

### User Story 3 - User Logs In with a Premium Brand Experience (Priority: P2)

A user navigates to the login page. Instead of a generic admin login form, they see a two-panel layout: a brand panel with the company's teal gradient identity and value proposition, and a clean white form panel with refined inputs. The login button uses the signature teal gradient. Input fields glow subtly on focus. The overall impression is "enterprise financial platform," not "generic admin template."

**Why this priority**: The login page is the first impression. While functional impact is lower than dashboard/list pages, brand perception and user confidence are established here. A polished login signals a professional, trustworthy tool.

**Independent Test**: Can be fully tested by navigating to the login page and verifying the two-panel layout, gradient brand heading, gradient CTA button, and refined input focus states render correctly.

**Acceptance Scenarios**:

1. **Given** a user visits the login page, **When** the page loads, **Then** it displays a two-panel layout with a brand information section and a form section, each using the appropriate surface hierarchy tier.
2. **Given** the user focuses on an input field, **When** the field receives focus, **Then** a subtle teal glow ring appears around the field.
3. **Given** the user views the login button, **When** inspecting the CTA, **Then** it displays a teal gradient instead of a flat solid color.

---

### User Story 4 - Team Member Uses Sidebar and Topbar for Efficient Navigation (Priority: P2)

A team member navigates between system sections using the sidebar. The sidebar is a clean white panel with teal accent indicators on the active item. Navigation items use background color shifts on hover instead of border outlines. The topbar displays the current page title, user identity, and last data update using a frosted-glass effect. Role badges and the "Secure Workspace" label are removed in favor of a streamlined, professional layout.

**Why this priority**: Navigation is used on every page. A cleaner sidebar and topbar improve orientation and reduce visual noise across the entire application.

**Independent Test**: Can be fully tested by navigating between pages and verifying sidebar active states, hover transitions, topbar frosted-glass effect, and the removal of legacy elements (role badges in sidebar, "Secure Workspace" label, "Ready/Soon" labels on nav items).

**Acceptance Scenarios**:

1. **Given** the user is on the dashboard, **When** viewing the sidebar, **Then** the active navigation item shows a teal background tint with a right-side border accent, and inactive items show a subtle background shift on hover.
2. **Given** the user scrolls the main content, **When** content passes behind the topbar, **Then** the topbar shows a frosted-glass effect (semi-transparent background with blur).
3. **Given** the user views the sidebar, **When** inspecting navigation items, **Then** the "Ready" and "Coming soon" labels are absent, and role badges are not displayed in the sidebar.

---

### User Story 5 - Administrator Reviews Detail Pages with Consistent Visual Language (Priority: P3)

An administrator opens a customer profile or contract detail page. Section cards for customer info, installments, and follow-up history use the surface hierarchy consistently — white cards with ambient shadows on a light surface background. Section headings use the title typography scale. No section uses heavy drop shadows or solid border outlines. The visual language is identical to the dashboard and list pages.

**Why this priority**: Detail pages are used less frequently but must maintain visual consistency with the rest of the system. Inconsistency between pages undermines the premium, architected feel.

**Independent Test**: Can be fully tested by opening any customer profile or contract detail page and verifying surface hierarchy, typography scale, and shadow treatment match the patterns established in dashboard and list pages.

**Acceptance Scenarios**:

1. **Given** the admin opens a customer profile, **When** section cards render, **Then** they use white backgrounds with ambient shadow and no solid borders.
2. **Given** the admin views section headings, **When** reading titles like "Installments" or "Follow-ups," **Then** they use the title typography scale with the display font family.
3. **Given** the admin compares the detail page to the dashboard, **When** inspecting visual patterns, **Then** card rounding, shadow intensity, and color tokens are consistent across both pages.

---

### Edge Cases

- What happens when the browser viewport is narrower than 1024px? The sidebar should collapse or stack, and the grid layout should adapt to single-column.
- How do very long Arabic customer names render in the sidebar or topbar? Text must truncate gracefully without breaking the layout.
- What happens with empty data tables? The empty state message must use the new design token colors, not legacy colors.
- How do print styles behave after the redesign? The `data-sidebar` and `data-topbar` attributes must remain intact, and all existing print rules must be preserved.
- What happens with report pages that use chart colors? Charts must use the teal palette consistently.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST replace the current font stack with IBM Plex Sans Arabic (body/default), Manrope (display headings), and Inter (UI labels and body text) across the entire application.
- **FR-002**: The system MUST implement a Material Design surface hierarchy using tiers: surface (foundation), surface-container-low (sectioning), surface-container-lowest (content cards), and surface-container-high (hover/overlay).
- **FR-003**: The system MUST eliminate all 1px solid borders used for visual sectioning ("No-Line Rule"). Section boundaries MUST be defined by background color shifts only.
- **FR-004**: Where row or item separation is required in data tables, the system MUST use ghost borders (outline-variant color at 15% opacity maximum).
- **FR-005**: Primary call-to-action buttons MUST display a 135-degree gradient from the primary teal to a lighter teal instead of a flat solid color.
- **FR-006**: The system MUST NOT use pure black or pure white anywhere in the UI. The darkest neutral MUST be `#191c1d` (on-surface) and the lightest surface MUST be `#f8f9fa`.
- **FR-007**: The topbar MUST use a frosted-glass effect (semi-transparent background with backdrop blur) and MUST be the only element in the application with this treatment.
- **FR-008**: The sidebar MUST display navigation items with background color shifts for hover and active states — not border-based or badge-based indicators. The "Ready/Coming Soon" labels and role badges MUST be removed from the sidebar.
- **FR-009**: The dashboard layout MUST use a full-width grid (sidebar + content area) instead of a max-width centered container with a card wrapper.
- **FR-010**: All KPI metric cards MUST display values using the display typography scale with thin color accent strips replacing gradient card backgrounds.
- **FR-011**: Status badges (paid, overdue, partial, etc.) MUST use Material Design semantic colors: error tints for danger, teal tints for success, amber tints for warning.
- **FR-012**: Input fields MUST show a subtle teal ring glow on focus instead of a simple border color change.
- **FR-013**: The login page MUST present a two-panel layout: brand/value proposition panel and form panel, each using the appropriate surface hierarchy tier.
- **FR-014**: All existing RTL (Right-to-Left) behavior MUST be preserved. The `dir="rtl"` attribute, `text-right` alignments, and directional icons MUST remain intact.
- **FR-015**: All existing print styles and layout-related data attributes MUST be preserved without modification.
- **FR-016**: No application logic, API routes, services, business rules, component props, or exported types may be changed. This redesign is purely visual.
- **FR-017**: The typography hierarchy MUST follow a named scale: display (2.25-3.5rem), headline (1.5-2rem), title (1-1.375rem), body (0.75-1rem), label (0.6875-0.75rem). Generic size classes MUST be replaced with named scale equivalents.
- **FR-018**: Floating elements (dropdowns, modals) MUST use a soft ambient shadow instead of heavy panel shadows.
- **FR-019**: Border radius MUST be standardized: cards use a consistent large radius, buttons/inputs use a medium radius, badges use fully rounded. Arbitrary non-standard radius values MUST be eliminated.

### Key Entities

- **Design Token**: A named value (color, spacing, typography, shadow) from the Material Design system that serves as the single source of truth for visual properties across all components.
- **Surface Tier**: One of the hierarchical background levels that replace borders as the primary means of visual sectioning.
- **Component**: A reusable UI element (DataTable, StatusBadge, FilterBar, KpiGrid, Sidebar, Topbar) that must be updated to use the new design tokens.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of visible 1px solid section borders are eliminated from the application — visual sectioning is achieved exclusively through background color shifts.
- **SC-002**: All affected pages and components render correctly with the new design tokens when visually inspected in a browser after each phase of implementation.
- **SC-003**: The typography hierarchy uses only the named scale (display, headline, title, body, label) — zero instances of generic size classes remain in component and page files.
- **SC-004**: All existing functionality (navigation, data display, filtering, form submission, login, logout) continues to work identically after the redesign — zero regressions in user-facing behavior.
- **SC-005**: The color palette contains zero instances of pure black or pure white as text or background colors in any component or page file.
- **SC-006**: Users report that the interface feels "premium" and "professional" — qualitatively assessed by the product owner after each phase delivery.
- **SC-007**: All RTL layout behavior is preserved — Arabic text alignment, directional icons, and reading flow remain correct on every page.
- **SC-008**: Print functionality continues to work correctly — sidebar and topbar hide appropriately, and content prints cleanly.

## Assumptions

- The existing design plan (`designplan.md`) is the authoritative source for all visual specifications, token values, and implementation order.
- The `stitch_login_page_redesign/DESIGN.md` document defines the creative north star ("The Financial Architect") and all Material Design token values.
- No new packages or external dependencies are required — all fonts are available through the existing font loading mechanism, and all styling uses the existing CSS framework.
- The redesign is phased (foundation → layout → components → pages → refinement → login polish) and each phase should be visually verified before proceeding to the next.
- The target audience (Arabic-speaking financial professionals) works 8+ hour sessions, making long-session accessibility and reduced visual fatigue a core requirement, not a nice-to-have.
- The application is light-mode only for this version. Dark mode is out of scope.
