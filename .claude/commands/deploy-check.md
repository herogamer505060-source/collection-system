---
description: Pre-deployment readiness check
---
Run a comprehensive deployment readiness check:

1. **TypeScript**: `npx tsc --noEmit`
2. **Lint**: `npm run lint`
3. **Tests**: `npm test`
4. **Build**: `npm run build`
5. **Env vars**: Verify all required env vars are in .env.example
6. **Git**: Check for uncommitted changes and untracked files
7. **Dependencies**: Look for any security advisories with `npm audit --production`

Report a final GO/NO-GO recommendation with any issues found.
