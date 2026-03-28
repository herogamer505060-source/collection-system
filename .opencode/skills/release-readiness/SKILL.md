---
name: release-readiness
description: Finish a change with pragmatic release checks, risk review, verification coverage, and concise ship/no-ship reporting.
compatibility: opencode
license: MIT
metadata:
  audience: maintainers
  focus: validation
---

## What I do

- Turn a finished change into a release-ready outcome.
- Run or recommend the right verification sequence for this stack.
- Highlight real blockers, residual risks, and operator follow-ups.

## Workflow

1. Review the scope of the change and identify impacted routes, data flows, and critical workflows.
2. Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` when they are relevant and feasible.
3. Include Playwright or manual browser checks for route-heavy changes.
4. Call out anything unverified, flaky, or blocked by environment limitations.
5. Report the result as ready, ready-with-risk, or blocked.

## Guardrails

- Do not present partial validation as complete validation.
- Keep the report concise and decision-friendly.
- Prefer concrete commands and observed outcomes over generic confidence statements.
