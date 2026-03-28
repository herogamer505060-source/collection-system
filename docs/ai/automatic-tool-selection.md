# Automatic Tool Selection

Treat tool, MCP, skill, and workflow selection as automatic by default.

## Core Rule

- Do not ask the user which tool, MCP, skill, or workflow to use unless the choice changes security, production risk, or irreversible side effects in a meaningful way.
- Proactively choose the strongest available option that improves correctness, speed, or safety.

## Automatic MCP Selection

- Use `supabase` automatically for database inspection, schema understanding, migrations impact, auth/RLS checks, and Supabase debugging.
- Use `context7` automatically when framework or library behavior may have changed or when exact docs matter.
- Use `gh_grep` automatically when implementation patterns, edge cases, or real-world examples would improve code quality.
- Use `playwright` automatically for route-level UI validation, browser smoke tests, and interactive workflow verification when the app can run locally.

## Automatic Skill Selection

- Load `fullstack-feature` automatically for changes that cross route, server, database, validation, and UI boundaries.
- Load `frontend-design-pass` automatically for visual polish, layout, hierarchy, responsiveness, Arabic UX, or component/page refinement.
- Load `supabase-safe-change` automatically for any data-model, migration, policy, query-shape, or generated-types work.
- Load `release-readiness` automatically near the end of meaningful implementation work or when validating ship readiness.

## Automatic Workflow Defaults

- Start by identifying route impact, data impact, validation impact, and auth impact.
- Prefer checking existing project patterns before inventing new abstractions.
- Prefer the smallest sufficient verification first, then broaden validation when the change affects app-wide behavior.
- When multiple useful helpers apply, combine them instead of choosing only one.

## User Experience Rule

- The user should not need to know MCP names, skill names, or internal OpenCode mechanics.
- Translate user intent directly into the best internal workflow and only explain the chosen tools briefly in the final response when useful.
