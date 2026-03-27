# Quickstart: UI/UX Redesign Verification Guide

**Date**: 2026-03-25
**Feature Branch**: `003-ui-ux-redesign`

## Prerequisites

- Node.js 18+ installed
- Project dependencies installed (`npm install`)
- Development server running (`npm run dev`)

## Phase-by-Phase Verification

### After Phase 1 (Foundation)

1. Open the app in browser — it should compile without errors
2. Inspect the `<body>` element — verify three font CSS variables are present: `--font-ibm-plex-arabic`, `--font-manrope`, `--font-inter`
3. Inspect `:root` in DevTools — verify new CSS variables exist: `--primary` (183 73% 24%), `--surface`, `--surface-container-low`, etc.
4. Verify the body background is flat `#f8f9fa` — no radial gradient
5. Verify text selection highlight uses teal tint

### After Phase 2 (Layout Shell)

1. Navigate to dashboard — verify sidebar is white with ambient shadow, not gradient background
2. Verify active nav item shows teal background tint (not gradient), no "جاهز" labels visible
3. Verify topbar has frosted-glass effect — scroll content behind it to confirm blur
4. Verify content area fills full width — no max-w-7xl centering, no card wrapper around content
5. Navigate between pages — verify sidebar active state updates correctly

### After Phase 3 (Core Components)

1. Open any list page (e.g., customers) — verify DataTable has no visible 1px borders
2. Inspect table row separators — they should be barely visible (15% opacity ghost borders)
3. Verify FilterBar has no border — just white surface with ambient shadow
4. Check status badges — danger should use error-container color (pinkish-red bg), success should use teal tint
5. Verify KPI cards on dashboard — values should use large display typography, cards should have thin accent color strips at top
6. Click any primary button — verify teal gradient instead of flat color

### After Phase 4 (Page-Level Adjustments)

1. Open login page — verify two-panel layout with brand panel and form panel
2. Focus an input field on login — verify subtle teal glow ring
3. Open a customer detail page — verify section cards use white bg + ambient shadow, no borders
4. Open a contract detail page — verify same treatment as customer detail
5. Open any report page — verify table styling matches the new design

### After Phase 5 (Refinement Pass)

1. Search codebase for `border-white/70` — should return zero results
2. Search codebase for `backdrop-blur` — should appear only in topbar-related code
3. Search codebase for `rounded-[1.75rem]` or `rounded-[2rem]` — should return zero results
4. Search codebase for `shadow-panel` in component code — should be replaced with `ambient-shadow`
5. Search codebase for `text-foreground` in component code — should be replaced with `text-on-surface`

### After Phase 6 (Login Polish)

1. Open login page — verify it matches the Stitch HTML reference aesthetic
2. Verify brand heading has gradient text (teal gradient)
3. Verify CTA button spans full width with gradient background
4. Verify input focus states show teal glow ring
5. Test login flow — verify it still works correctly end-to-end

## Regression Checks (After Every Phase)

- [ ] App compiles without errors
- [ ] All existing navigation works (sidebar links, page transitions)
- [ ] Login/logout flow works
- [ ] RTL layout correct on all pages (text-right headers, directional flow)
- [ ] Arabic text renders correctly with new font stack
- [ ] Print styles work (Ctrl+P — sidebar and topbar should hide)
- [ ] Run `npm run build` — no build errors
