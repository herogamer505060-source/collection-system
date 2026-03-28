# OpenCode Workflow

Use this project workflow by default.

## Full-Stack Delivery

- Start by identifying the affected route, data model, permissions, and validation rules before editing code.
- For database-affecting work, use `supabase` MCP first to inspect tables, RLS, migrations, and generated types.
- For framework uncertainty, use `context7` before guessing Next.js, React, Tailwind, Supabase, Zod, or Vitest behavior.
- For implementation pattern discovery, use `gh_grep` to compare established community solutions before inventing new abstractions.
- For UI flows and acceptance checks, use `playwright` when the route can be exercised locally.

## Validation Standard

- For meaningful code changes, prefer this verification order: `npm run lint`, `npm run typecheck`, `npm test`, then `npm run build` when the change touches routing, rendering, or production behavior.
- If you cannot run a verification step, say exactly why and state the next best command.
- Do not claim database changes are safe without checking the impacted tables, relations, and auth behavior.

## App-Specific Priorities

- Preserve the Arabic-first UX and existing dashboard navigation patterns.
- Keep imports resilient: imported financial data may overwrite source-owned fields, but must not destroy manual follow-up work.
- Prefer server-safe data access patterns and keep Supabase secrets out of client code.
- Keep tables, filters, and dashboard summaries performant for operational datasets.
