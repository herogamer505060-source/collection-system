---
name: fullstack-feature
description: Ship a full-stack feature across Next.js routes, Supabase data, validation, UI, and verification with production-minded defaults.
compatibility: opencode
license: MIT
metadata:
  audience: full-stack
  stack: nextjs-supabase-tailwind
---

## What I do

- Break a feature into route, schema, auth, validation, UI, and testing concerns.
- Use `supabase` MCP before making database assumptions.
- Use `context7` for uncertain framework details and `gh_grep` for proven implementation patterns.
- Keep the implementation aligned with the current project structure and release gates.

## Workflow

1. Inspect the impacted route, data model, and user flow.
2. Check whether the change affects Supabase schema, RLS, queries, or generated types.
3. Update server/client boundaries carefully for Next.js App Router.
4. Validate data with Zod and forms with react-hook-form where applicable.
5. Run the smallest meaningful verification set, then expand to full validation if the change is broad.

## Guardrails

- Do not introduce client-side access to sensitive Supabase credentials.
- Do not make schema changes without checking downstream tables, imports, dashboards, and reports.
- Favor incremental edits over broad refactors unless duplication or instability clearly justifies it.
