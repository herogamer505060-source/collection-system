---
description: Run a release-readiness pass for the current change set
agent: build
---

Use the `release-readiness` skill if it applies.

Review the current change set and determine release readiness.

Requirements:
- inspect changed files and impacted workflows first
- run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` when relevant and feasible
- include browser validation notes when the change affects routes or UX
- report one of: ready, ready with risk, or blocked
- keep the final report concise and decision-oriented
