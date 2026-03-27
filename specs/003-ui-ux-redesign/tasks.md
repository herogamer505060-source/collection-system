# Tasks: UI/UX Redesign — "The Financial Architect"

**Input**: Design documents from `/specs/003-ui-ux-redesign/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md
**Authoritative implementation guide**: `designplan.md` at project root (contains exact old/new code values for every change)

**Tests**: Not requested — this is a visual-only redesign. Verification is visual inspection per quickstart.md.

**Organization**: Tasks grouped by user story. US4 (sidebar/topbar) is foundational and completed in Phase 2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Constraints (from FR-016)

**DO NOT** change any TypeScript logic, API routes, services, business rules, component props, or exported types. Only modify className values, JSX structure, and CSS. Refer to `designplan.md` for exact old→new values.

---

## Phase 1: Setup (Foundation Tokens)

**Purpose**: Replace the design foundation — fonts, CSS variables, and Tailwind config. Everything else depends on this.

- [X] T001 Replace font imports (Cairo/Noto_Kufi_Arabic → IBM_Plex_Sans_Arabic/Manrope/Inter) and add uiFont variable to body className in src/app/layout.tsx — follow designplan.md Step 1.1
- [X] T002 [P] Replace entire :root CSS variable block with Material Design tokens in src/app/globals.css — follow designplan.md Step 1.2 (preserve @tailwind directives, @layer base, print styles, ::selection)
- [X] T003 Replace body background rule (remove radial gradient, use flat #f8f9fa), update ::selection color, and add utility classes (.glass-nav, .gradient-primary, .ghost-border, .ambient-shadow) in src/app/globals.css — follow designplan.md Step 1.2 (runs after T002, same file)
- [X] T004 [P] Replace entire tailwind.config.ts with new config containing surface tokens, typography scale, Material colors, font families, border radius, and box shadows — follow designplan.md Step 1.3

**Checkpoint**: App compiles. Fonts load correctly. CSS variables resolve in DevTools. Body background is flat #f8f9fa.

---

## Phase 2: Foundational (Layout Shell + Shared Components)

**Purpose**: Layout infrastructure and shared components that ALL user stories depend on. Completing this phase also satisfies **User Story 4** (sidebar/topbar navigation).

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 [US4] Redesign sidebar: white bg with ambient-shadow, teal active accent with border-r-4, remove "جاهز"/"قريبا" labels, remove role badges, add brand header in src/components/layout/sidebar.tsx — follow designplan.md Step 2.1 (preserve data-sidebar attribute and signOutAction)
- [X] T006 [P] [US4] Redesign topbar: glassmorphism bar (bg-white/80 glass-nav), page title with font-display, user info section, remove "Secure Workspace" label, remove card border wrapper in src/components/layout/topbar.tsx — follow designplan.md Step 2.2 (preserve data-topbar attribute and LastDataUpdate component)
- [X] T007 [US4] Redesign dashboard layout: full-width CSS grid (lg:grid-cols-[280px_1fr]), remove max-w-7xl mx-auto, remove content card wrapper in src/app/(dashboard)/layout.tsx — follow designplan.md Step 2.3
- [X] T008 [P] Update DataTable: remove border border-border/70, use bg-surface-container-lowest + ambient-shadow outer wrapper, bg-surface-container-low thead, divide-outline-variant/[0.15] ghost borders, text-on-surface cells in src/components/ui/data-table.tsx — follow designplan.md Step 3.1
- [X] T009 [P] Update StatusBadge variants: danger→bg-error-container text-[#93000a], success→bg-[#d0f5f5] text-[#004f4f], warning→bg-[#fff3e0] text-[#7a4100], info→bg-[#cfe6f2] text-[#071e27], neutral→bg-surface-container-high text-on-surface-variant in src/components/ui/status-badge.tsx — follow designplan.md Step 3.2
- [X] T010 [P] Update FilterBar: remove border border-border/70, use bg-surface-container-lowest + ambient-shadow, update title to font-display text-title-lg text-on-surface in src/components/ui/filter-bar.tsx — follow designplan.md Step 3.3

**Checkpoint**: Navigation works between all pages. Sidebar shows teal active states, no "جاهز" labels. Topbar has frosted-glass effect. Content fills width. Tables show ghost borders. Badges use Material colors. **US4 is complete and independently testable.**

---

## Phase 3: User Story 1 — Dashboard Without Visual Fatigue (Priority: P1) 🎯 MVP

**Goal**: KPI cards display with editorial typography and accent strips. Dashboard charts use teal palette. The dashboard feels calm and premium.

**Independent Test**: Open dashboard → verify KPI values use display-scale font, cards have thin accent color strips (not gradient backgrounds), no 1px borders, no pure black/white.

### Implementation for User Story 1

- [X] T011 [US1] Update KpiGrid primary cards: replace gradient bg with bg-surface-container-lowest + ambient-shadow, add thin accent strip div (h-1 w-12 rounded-full), use text-display-sm for values, text-label-lg for labels in src/components/dashboard/kpi-grid.tsx — follow designplan.md Step 3.4
- [X] T012 [US1] Update KpiGrid secondary cards: replace border-border/70 bg-white/80 with bg-surface-container-low, use text-headline-sm for values in src/components/dashboard/kpi-grid.tsx — follow designplan.md Step 3.4
- [X] T013 [US1] Verify dashboard chart colors use teal palette (#0f666a, #337f83, #006767) and update any remaining page-level border/shadow wrappers in src/app/(dashboard)/dashboard/page.tsx — follow designplan.md Step 4.2
- [X] T014 [P] [US1] Update add user button to gradient-primary pattern in src/app/(dashboard)/users/page.tsx — follow designplan.md Step 3.5

**Checkpoint**: Dashboard KPIs render with display typography, accent strips, ambient shadows. Charts use teal palette. **US1 is complete and independently testable.**

---

## Phase 4: User Story 2 — List Pages with Clear Data Hierarchy (Priority: P1)

**Goal**: All list pages render DataTable + FilterBar with the new surface hierarchy. No remaining legacy borders. Status badges show Material semantic colors.

**Independent Test**: Open customers, contracts, installments, units, follow-ups, imports, and report pages → verify ghost-border tables, borderless filter bars, Material-colored badges.

### Implementation for User Story 2

- [X] T015 [P] [US2] Remove any page-level border/shadow wrappers and verify DataTable/FilterBar styling in src/app/(dashboard)/customers/page.tsx
- [X] T016 [P] [US2] Remove any page-level border/shadow wrappers and verify DataTable/FilterBar styling in src/app/(dashboard)/contracts/page.tsx
- [X] T017 [P] [US2] Remove any page-level border/shadow wrappers and verify DataTable/FilterBar styling in src/app/(dashboard)/installments/page.tsx
- [X] T018 [P] [US2] Remove any page-level border/shadow wrappers and verify DataTable/FilterBar styling in src/app/(dashboard)/units/page.tsx
- [X] T019 [P] [US2] Remove any page-level border/shadow wrappers and verify DataTable/FilterBar styling in src/app/(dashboard)/follow-ups/page.tsx
- [X] T020 [P] [US2] Remove any page-level border/shadow wrappers and verify DataTable/FilterBar styling in src/app/(dashboard)/imports/page.tsx
- [X] T021 [P] [US2] Remove any page-level border/shadow wrappers and verify DataTable/FilterBar styling in src/app/(dashboard)/import-issues/page.tsx
- [X] T022 [P] [US2] Update button to gradient-primary pattern in src/components/imports/import-upload-form.tsx — follow designplan.md Step 3.5
- [X] T023 [P] [US2] Verify report index and sub-pages use correct styling in src/app/(dashboard)/reports/page.tsx and src/app/(dashboard)/reports/*/page.tsx (8 report pages: aging, who-paid, overdue, penalties, project-status, collection-notes, promises, no-follow-up)

**Checkpoint**: All list pages render cleanly with ghost-border tables and borderless filters. **US2 is complete and independently testable.**

---

## Phase 5: User Story 3 — Premium Login Experience (Priority: P2)

**Goal**: Login page presents a two-panel layout with brand gradient heading, refined inputs with focus glow, and gradient CTA button. Register page matches.

**Independent Test**: Navigate to /login → verify two-panel layout, gradient text heading, gradient button, input focus glow ring.

### Implementation for User Story 3

- [X] T024 [US3] Redesign login page: two-panel layout (brand on surface-container-low, form on surface-container-lowest with ambient-shadow), gradient brand heading, gradient-primary CTA button, input focus glow (focus:ring-2 focus:ring-[#8ad3d7]/30) in src/app/(auth)/login/page.tsx — follow designplan.md Steps 4.1 and 6.1
- [X] T025 [US3] Apply refined input styling (rounded-xl, border-outline-variant/20, surface-container-lowest bg, focus glow) to all form inputs in src/app/(auth)/login/page.tsx — follow designplan.md Step 3.6
- [X] T026 [P] [US3] Update register page to match login page treatment (surface hierarchy, input focus glow, gradient button) in src/app/(auth)/register/page.tsx — follow designplan.md Step 4.1

**Checkpoint**: Login and register pages show premium brand experience. **US3 is complete and independently testable.**

---

## Phase 6: User Story 5 — Detail Pages with Consistent Visual Language (Priority: P3)

**Goal**: Customer profile and contract detail pages use the same surface hierarchy, typography scale, and shadow system as dashboard and list pages.

**Independent Test**: Open any customer profile or contract detail → verify section cards use white bg + ambient shadow, headings use title-lg, no solid borders.

### Implementation for User Story 5

- [X] T027 [P] [US5] Update customer detail page: section cards to bg-surface-container-lowest + ambient-shadow, headings to font-display text-title-lg, remove border/shadow legacy patterns in src/app/(dashboard)/customers/[customerId]/page.tsx — follow designplan.md Step 4.4
- [X] T028 [P] [US5] Update contract detail page: same surface hierarchy treatment as customer detail in src/app/(dashboard)/contracts/[contractId]/page.tsx — follow designplan.md Step 4.5
- [X] T029 [P] [US5] Update import batch detail page to match surface hierarchy in src/app/(dashboard)/imports/[batchId]/page.tsx
- [X] T030 [US5] Update add-follow-up-button to gradient-primary pattern in src/components/customers/add-follow-up-button.tsx — follow designplan.md Step 3.5

**Checkpoint**: All detail pages visually consistent with dashboard and list pages. **US5 is complete and independently testable.**

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Global refinement pass to eliminate ALL legacy patterns. Affects all files in src/.

- [X] T031 Search and remove all `border border-white/70` patterns across src/ — replace surrounding elements with appropriate surface-container backgrounds per designplan.md Step 5.1
- [X] T032 [P] Search and remove all `backdrop-blur-sm` occurrences except in topbar across src/ — per designplan.md Step 5.2
- [X] T033 [P] Replace all arbitrary rounded values (rounded-[1.75rem], rounded-[2rem], rounded-[1.5rem]) with design system tokens (cards→rounded-2xl, buttons→rounded-xl, badges→rounded-full) across src/ — per designplan.md Step 5.3
- [X] T034 [P] Replace all shadow-panel with ambient-shadow across src/ (except truly floating elements like dropdowns) — per designplan.md Step 5.4
- [X] T035 Typography audit: replace all raw text-sm, text-xs, text-3xl etc. with named scale (text-body-md, text-label-lg, text-display-sm, text-headline-sm, text-title-lg) across src/ — per designplan.md Step 5.5
- [X] T036 [P] Color audit: replace text-foreground→text-on-surface, text-muted-foreground→text-on-surface-variant, bg-white→bg-surface-container-lowest, bg-background→bg-surface, remove text-black/#000000 across src/ — per designplan.md Step 5.6
- [X] T037 [P] Input focus audit: apply refined focus ring glow (focus:ring-2 focus:ring-[#8ad3d7]/30 border-outline-variant/20) to all remaining form inputs across src/ not yet covered by T025/T026 (filter bars, follow-up forms, search inputs) — per designplan.md Step 3.6
- [ ] T038 Run `npm run test` to verify zero regressions — confirm all existing business logic tests pass with no changes
- [X] T039 Run `npm run build` to verify zero TypeScript compilation errors
- [ ] T040 Run full quickstart.md visual verification checklist (all phases) from specs/003-ui-ux-redesign/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 Dashboard (Phase 3)**: Depends on Phase 2 completion
- **US2 List Pages (Phase 4)**: Depends on Phase 2 completion — **can run in parallel with Phase 3**
- **US3 Login (Phase 5)**: Depends on Phase 1 only (login is outside dashboard layout) — **can run in parallel with Phases 3-4**
- **US5 Detail Pages (Phase 6)**: Depends on Phase 2 completion — **can run in parallel with Phases 3-5**
- **Polish (Phase 7)**: Depends on ALL user stories being complete

### User Story Dependencies

- **US4 (P2)**: Completed within Phase 2 (Foundational) — no dependencies on other stories
- **US1 (P1)**: Depends on Phase 2 (layout + shared components) — independent of US2, US3, US5
- **US2 (P1)**: Depends on Phase 2 (DataTable, FilterBar, StatusBadge) — independent of US1, US3, US5
- **US3 (P2)**: Depends only on Phase 1 (CSS tokens) — independent of all other stories
- **US5 (P3)**: Depends on Phase 2 (layout shell) — independent of US1, US2, US3

### Within Each Phase

- Tasks marked [P] can run in parallel (different files, no dependencies)
- Non-[P] tasks must execute sequentially within their phase

### Parallel Opportunities

Within Phase 2: T005 depends on T007 (sidebar→layout), but T008/T009/T010 can all run in parallel with each other and with T005-T007
Within Phase 3: T014 can run in parallel with T011-T013
Within Phase 4: ALL tasks (T015-T023) can run in parallel
Within Phase 5: T026 can run in parallel with T024-T025
Within Phase 6: T027/T028/T029 can all run in parallel
Within Phase 7: T032/T033/T034/T036 can all run in parallel

---

## Parallel Example: After Phase 2 Completes

```text
# These can all start simultaneously after Phase 2:

# US1 (Dashboard):
Task: "T011 [US1] Update KpiGrid primary cards in src/components/dashboard/kpi-grid.tsx"

# US2 (List Pages):
Task: "T015 [US2] Remove page-level wrappers in src/app/(dashboard)/customers/page.tsx"
Task: "T016 [US2] Remove page-level wrappers in src/app/(dashboard)/contracts/page.tsx"

# US3 (Login — only needs Phase 1):
Task: "T024 [US3] Redesign login page in src/app/(auth)/login/page.tsx"

# US5 (Detail Pages):
Task: "T027 [US5] Update customer detail in src/app/(dashboard)/customers/[customerId]/page.tsx"
```

---

## Implementation Strategy

### MVP First (Phase 1 + Phase 2 = Foundation + US4)

1. Complete Phase 1: Setup (foundation tokens)
2. Complete Phase 2: Foundational (layout shell + shared components)
3. **STOP and VALIDATE**: Sidebar, topbar, layout, tables, badges all render correctly
4. US4 is complete — the entire app has a new visual foundation

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready + US4 complete
2. Phase 3 → Dashboard upgraded → US1 complete
3. Phase 4 → List pages upgraded → US2 complete
4. Phase 5 → Login upgraded → US3 complete
5. Phase 6 → Detail pages upgraded → US5 complete
6. Phase 7 → All legacy patterns eliminated → Ship it

### Single Developer Strategy

Execute phases sequentially: 1 → 2 → 3 → 4 → 5 → 6 → 7. Verify visually after each phase per quickstart.md.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- **Always refer to `designplan.md`** for exact old→new CSS class values — it has the complete mapping
- Preserve all RTL behavior, print styles, data-sidebar/data-topbar attributes
- Do NOT change component props, exported types, or any TypeScript logic
- Commit after each phase or logical group
- Visually verify in browser after each phase before proceeding
