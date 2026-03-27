# Research: UI/UX Redesign — "The Financial Architect"

**Date**: 2026-03-25
**Status**: Complete — no unknowns to resolve

## Summary

This feature is a purely visual redesign with no NEEDS CLARIFICATION items. All design decisions, token values, file paths, and implementation details are fully specified in:

1. **`designplan.md`** (project root) — authoritative implementation guide with exact old/new code values
2. **`stitch_login_page_redesign/DESIGN.md`** — creative north star and Material Design token definitions
3. **`stitch_login_page_redesign/code.html`** — reference HTML prototype showing target aesthetic

## Decisions

### Font Stack

- **Decision**: IBM Plex Sans Arabic (body) + Manrope (display) + Inter (UI labels)
- **Rationale**: IBM Plex Sans Arabic provides excellent Arabic legibility for long sessions. Manrope provides distinctive editorial display headings. Inter provides clean UI labels and body text. All available via `next/font/google` — no new packages needed.
- **Alternatives considered**: Cairo + Noto Kufi Arabic (current stack — replaced because it contributes to the generic admin aesthetic)

### Color System

- **Decision**: Material Design surface hierarchy with teal primary (`#0f666a`) palette
- **Rationale**: Surface hierarchy (4 tiers) replaces 1px borders with background color shifts, following the "No-Line Rule" from DESIGN.md. Teal palette maintains brand identity while moving away from generic admin blue.
- **Alternatives considered**: Keeping current HSL-based system (rejected — doesn't support the surface hierarchy model)

### Shadow System

- **Decision**: Single ambient shadow (`0 8px 24px rgba(25, 28, 29, 0.06)`) replacing heavy panel shadows
- **Rationale**: Soft, diffused shadow mimics natural office lighting. Current `shadow-panel` (`0 24px 60px -30px rgba(15, 23, 42, 0.35)`) is too aggressive for a premium, calm aesthetic.
- **Alternatives considered**: No shadows at all (rejected — floating elements like topbar and cards need some depth indication)

### Glassmorphism Scope

- **Decision**: Glassmorphism (backdrop blur + semi-transparent bg) applied ONLY to the topbar
- **Rationale**: DESIGN.md restricts glassmorphism to top navigation only. Overuse of glassmorphism is identified as an anti-pattern in the design skill guidelines.
- **Alternatives considered**: Applying to sidebar too (rejected — DESIGN.md is explicit about topbar-only)

### Border Radius Standardization

- **Decision**: Cards = rounded-2xl (1rem), Buttons/Inputs = rounded-xl (0.5rem), Badges = rounded-full
- **Rationale**: Eliminates arbitrary values like `rounded-[1.75rem]` and creates a consistent, predictable system. DESIGN.md specifies at least `md` (0.375rem) roundedness for all components.
- **Alternatives considered**: Keeping current arbitrary values (rejected — inconsistent and not part of a system)

## No Remaining Unknowns

All technical decisions are resolved. Proceed to Phase 1 (data-model.md / contracts).
