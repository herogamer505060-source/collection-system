---
description: Run full build quality checks (typecheck + lint + build)
---
Run the following checks in sequence and report results concisely:
1. `npx tsc --noEmit` (TypeScript type checking)
2. `npm run lint` (ESLint)
3. `npm run build` (Next.js build)

For each step, report PASS or FAIL. If any step fails, show the first 10 errors with file paths and line numbers. Do not proceed to the next step if the current one fails critically.
