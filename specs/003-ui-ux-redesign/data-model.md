# Data Model: UI/UX Redesign — "The Financial Architect"

**Date**: 2026-03-25
**Status**: N/A — No data model changes

## Summary

This feature is a purely visual redesign (FR-016). No database tables, columns, relationships, migrations, or data handling logic are modified.

## Entities

No new entities. No modified entities. The existing data model (projects, units, customers, contracts, contract_units, installments, follow_ups, import_batches, import_files, import_issues, profiles) remains unchanged.

## Design Tokens (Non-Persistent)

The following design tokens are defined in CSS and Tailwind configuration only — they are not stored in the database:

| Token Category | Examples | Storage |
|---------------|----------|---------|
| Colors | `--primary`, `--surface`, `--on-surface` | CSS variables in `globals.css` |
| Typography | `display-sm`, `headline-md`, `body-md` | Tailwind `fontSize` config |
| Shadows | `ambient`, `panel` | Tailwind `boxShadow` config |
| Spacing | `spacing-8`, `spacing-10` | Tailwind `spacing` config |
| Surface tiers | `surface-container-low`, `surface-container-lowest` | Tailwind `colors` config |

These tokens are consumed by component className attributes at render time.
