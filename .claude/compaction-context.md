# Post-Compaction Context Injection

## Project Identity
Arabic RTL real-estate collection system (نظام تحصيل عقاري ذكي)
Tech: Next.js 15 App Router | TypeScript strict | Supabase | shadcn/ui | Tailwind

## Critical Rules
- Arabic UI, English code names
- No `any` in TypeScript
- Unit key = project + unit_code (never unit_code alone)
- Contracts can have multiple units (contract_units table)
- Payment status is DERIVED, not stored directly
- EGP currency with Intl.NumberFormat
- RTL-first layout

## Auto-Invocation
- Use Context7 MCP for any library/framework docs
- Use Sequential Thinking MCP for complex multi-step reasoning
- Subagents (research, executor, reviewer) run on Sonnet model
- Main session runs on Opus for deep reasoning
- See AGENTS.md for full auto-selection tables

## Specs Location
- docs/specs/data-model.md — tables and relationships
- docs/specs/business-rules.md — derivation rules
- docs/specs/screens-and-reports.md — UI specs
- docs/specs/import-pipeline.md — Excel import details
- docs/specs/data-sources.md — source files and priority

## Scoped Rules
- .claude/rules/coding-standards.md (src/**)
- .claude/rules/database-rules.md (src/server/**, supabase/**)
- .claude/rules/rtl-arabic.md (src/components/**, src/app/**)
- .claude/rules/import-pipeline.md (src/features/imports/**)
- .claude/rules/design-system.md (src/components/**, src/app/**)
