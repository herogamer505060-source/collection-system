---
description: Run tests on changed/related files
---
Run vitest on files related to the current work:
1. Check `git diff --name-only` to find changed files
2. Run `npx vitest run --passWithNoTests` targeting the changed areas
3. Report results: number of tests passed/failed, any failures with details

If no test files are found for the changed code, mention which areas lack test coverage.
