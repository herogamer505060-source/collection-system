# Implementation Plan: UI/UX Redesign — "The Financial Architect"

**Branch**: `003-ui-ux-redesign` | **Date**: 2026-03-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-ui-ux-redesign/spec.md`

## Summary

Transform the existing collection system UI from a generic admin aesthetic into an editorial-grade financial command center. This is a **purely visual redesign** — no logic, API, service, or type changes. The redesign implements a Material Design surface hierarchy, replaces the font stack, eliminates 1px solid borders in favor of tonal layering, and standardizes typography, shadows, and color tokens across all pages and components.

The authoritative implementation guide is `designplan.md` at the project root, which provides exact file paths, old/new CSS values, and phase ordering.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 15 (App Router), Tailwind CSS, next/font/google (for IBM Plex Sans Arabic, Manrope, Inter)
**Storage**: N/A — no database changes
**Testing**: Visual inspection per phase; existing Vitest suite must continue passing (no logic changes)
**Target Platform**: Web (Chromium/Firefox/Safari, desktop-first, responsive)
**Project Type**: Web application (Next.js fullstack)
**Performance Goals**: N/A — CSS-only changes; no new JS bundles
**Constraints**: No new npm packages; no dark mode; preserve all RTL, print styles, and data attributes
**Scale/Scope**: ~15 files modified across 6 phases; 19 functional requirements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Justification |
|-----------|--------|---------------|
| I. Architecture First | PASS | No business logic touched — FR-016 explicitly prohibits logic changes |
| II. Database Integrity First | PASS | Zero database or schema changes |
| III. Safe Import and Upsert | PASS | Import pipeline untouched |
| IV. Security by Default | PASS | No auth, RLS, or role changes |
| V. Arabic-First UX | PASS | RTL preserved (FR-014); all Arabic labels preserved; only CSS class values change |
| VI. Testability | PASS | Visual-only changes; existing automated tests unaffected |
| VII. Data Quality Rules | PASS | No data handling changes |
| VIII. Simplicity Before Complexity | PASS | No new packages, no new features, no new abstractions |
| IX. Documentation and Traceability | PASS | `designplan.md` documents every decision; `DESIGN.md` provides the creative north star |
| X. Incremental Delivery | PASS | 6 phases, each leaving the system in a working, visually verifiable state |

**Gate Result: ALL PASS — no violations.**

## Project Structure

### Documentation (this feature)

```text
specs/003-ui-ux-redesign/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output — minimal (no unknowns)
├── data-model.md        # Phase 1 output — N/A for visual redesign
├── quickstart.md        # Phase 1 output — verification guide
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx                          # Phase 1: Font stack replacement
│   ├── globals.css                         # Phase 1: CSS variables, utility classes
│   ├── (auth)/
│   │   ├── login/page.tsx                  # Phase 4 + 6: Login redesign
│   │   └── register/page.tsx               # Phase 4: Register page treatment
│   └── (dashboard)/
│       ├── layout.tsx                      # Phase 2: Grid layout, remove card wrapper
│       ├── dashboard/page.tsx              # Phase 4: Verify chart colors
│       ├── customers/
│       │   ├── page.tsx                    # Phase 4: List page verification
│       │   └── [customerId]/page.tsx       # Phase 4: Detail page surface hierarchy
│       ├── contracts/
│       │   ├── page.tsx                    # Phase 4: List page verification
│       │   └── [contractId]/page.tsx       # Phase 4: Detail page surface hierarchy
│       ├── installments/page.tsx           # Phase 4: List page verification
│       ├── units/page.tsx                  # Phase 4: List page verification
│       ├── follow-ups/page.tsx             # Phase 4: List page verification
│       ├── users/page.tsx                  # Phase 3: Button pattern
│       ├── imports/page.tsx                # Phase 4: List page verification
│       └── reports/*/page.tsx              # Phase 4: Report pages
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx                     # Phase 2: Full redesign
│   │   └── topbar.tsx                      # Phase 2: Glassmorphism bar
│   ├── ui/
│   │   ├── data-table.tsx                  # Phase 3: Surface hierarchy, ghost borders
│   │   ├── status-badge.tsx                # Phase 3: Material semantic colors
│   │   └── filter-bar.tsx                  # Phase 3: Surface bg, ambient shadow
│   ├── dashboard/
│   │   └── kpi-grid.tsx                    # Phase 3: Metric tiles, accent strips
│   ├── customers/
│   │   └── add-follow-up-button.tsx        # Phase 3: Button pattern
│   └── imports/
│       └── import-upload-form.tsx          # Phase 3: Button pattern
tailwind.config.ts                          # Phase 1: Complete replacement
```

**Structure Decision**: No new files or directories. All changes modify existing files. The structure follows the existing Next.js App Router layout.

## Implementation Phases

### Phase 1: Foundation (CSS Variables, Fonts, Tailwind Config)

**Files**: `src/app/layout.tsx`, `src/app/globals.css`, `tailwind.config.ts`
**Requirements**: FR-001, FR-002, FR-006, FR-017
**Verification**: App compiles and renders; fonts load correctly; CSS variables resolve

1. Replace font imports in `layout.tsx`: Cairo/Noto Kufi Arabic → IBM Plex Sans Arabic/Manrope/Inter
2. Add third font variable (`uiFont`) to body className
3. Replace entire `:root` CSS variable block in `globals.css` with Material Design tokens
4. Replace body background rule — remove radial gradient, use flat surface color
5. Update `::selection` color to primary teal
6. Add utility classes: `.glass-nav`, `.gradient-primary`, `.ghost-border`, `.ambient-shadow`
7. Replace entire `tailwind.config.ts` with new config: surface tokens, typography scale, Material colors, font families, border radius, box shadows

### Phase 2: Layout Shell (Sidebar, Topbar, Dashboard Layout)

**Files**: `src/components/layout/sidebar.tsx`, `src/components/layout/topbar.tsx`, `src/app/(dashboard)/layout.tsx`
**Requirements**: FR-007, FR-008, FR-009
**Verification**: Navigation works; sidebar active states correct; topbar glassmorphism visible; content fills width

1. Redesign sidebar: white bg, teal active accent, remove "جاهز"/"قريبا" labels, remove role badges, add brand header
2. Redesign topbar: glassmorphism bar, page title + user info, remove "Secure Workspace" label, remove card wrapper
3. Redesign dashboard layout: full-width CSS grid, remove max-w-7xl, remove content card wrapper

### Phase 3: Core Components

**Files**: `data-table.tsx`, `status-badge.tsx`, `filter-bar.tsx`, `kpi-grid.tsx`, button/input instances
**Requirements**: FR-003, FR-004, FR-005, FR-010, FR-011, FR-012, FR-018, FR-019
**Verification**: Tables render with ghost borders; badges use semantic colors; KPIs use display scale; buttons use gradient

1. DataTable: remove border, add surface-container-lowest bg + ambient shadow; ghost border row separators
2. StatusBadge: replace slate/rose/sky/emerald/amber with Material semantic colors
3. FilterBar: remove border, add surface bg + ambient shadow
4. KpiGrid: replace gradient card backgrounds with accent strips; display typography for values
5. Buttons: standardize primary (gradient), secondary (surface-container-high), ghost (text-primary)
6. Inputs: standardize focus ring glow, surface-container-lowest bg, outline-variant border

### Phase 4: Page-Level Adjustments

**Files**: Login, register, dashboard, all list pages, detail pages, report pages
**Requirements**: FR-013, FR-014, FR-015
**Verification**: Each page renders correctly; no legacy border/shadow patterns remain

1. Login page: two-panel layout, gradient brand heading, gradient CTA, refined inputs
2. Dashboard: verify chart colors use teal palette
3. All list pages: verify DataTable + FilterBar styling propagated; remove any remaining border-border/70 wrappers
4. Customer/contract detail pages: section cards with surface hierarchy
5. Report pages: verify table styling, export button pattern

### Phase 5: Refinement Pass

**Files**: All files in `src/`
**Requirements**: FR-003, FR-006, FR-017, FR-019
**Verification**: Global search confirms zero legacy patterns remain

1. Search and remove all `border border-white/70` patterns
2. Search and remove all `backdrop-blur-sm` except topbar
3. Replace all `rounded-[1.75rem]`, `rounded-[2rem]`, `rounded-[1.5rem]` with design system tokens
4. Replace all `shadow-panel` with `ambient-shadow`
5. Typography audit: replace raw text-sm/text-xs/text-3xl with named scale
6. Color audit: replace text-foreground→text-on-surface, text-muted-foreground→text-on-surface-variant, bg-white→bg-surface-container-lowest, etc.

### Phase 6: Login Page Special Treatment

**Files**: `src/app/(auth)/login/page.tsx`
**Requirements**: FR-013
**Verification**: Login page matches Stitch HTML aesthetic; gradient text, gradient CTA, focus glow all work

1. Full rewrite of login page JSX structure following Stitch HTML reference
2. Brand panel with gradient text heading
3. Form panel with refined inputs and focus glow
4. Full-width gradient CTA button

## Complexity Tracking

> No constitution violations. No complexity justifications needed.
