---
name: supabase-safe-change
description: Plan and implement safe Supabase changes with schema awareness, auth caution, migration discipline, and validation against project workflows.
compatibility: opencode
license: MIT
metadata:
  audience: backend
  focus: database-safety
---

## What I do

- Use `supabase` MCP to inspect the current schema, policies, and database shape before changing code.
- Evaluate the effect of database changes on imports, dashboards, follow-ups, and reporting.
- Keep schema, generated types, and application usage in sync.

## Workflow

1. Inspect the relevant tables, columns, relations, and policies.
2. Identify all codepaths that read or write the affected data.
3. Prefer additive migrations and backward-compatible transitions.
4. Update generated types or affected query helpers if the schema changes.
5. Validate auth and operational workflows after the change.

## Guardrails

- Treat destructive schema changes as high risk.
- Check RLS assumptions whenever adding or changing user-facing data access.
- Keep manual collection workflows intact when touching imported data models.
