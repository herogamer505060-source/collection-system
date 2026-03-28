# Collection System — Development Guidelines

Auto-generated + manually enhanced. Last updated: 2026-03-28

## Active Technologies

TypeScript 5.x | Node.js 20 LTS | Next.js 15 App Router | React 19 | Supabase (Auth/Postgres/Storage) | Tailwind CSS | shadcn/ui | Zod | react-hook-form | exceljs | TanStack Table | Recharts

## Commands

```bash
npm test          # Run tests (vitest)
npm run lint      # ESLint
npm run typecheck # TypeScript check
npm run build     # Next.js build
npm run dev       # Dev server
```

## Code Style

- TypeScript strict — never use `any`
- English names in code, Arabic labels in UI
- RTL-first layout for all components
- EGP currency with `Intl.NumberFormat`

---

## Auto-Invocation Rules

Choose the best tools, MCPs, skills, and workflow automatically based on the task. Do NOT ask the user to pick — just do the right thing.

### MCP Auto-Selection

| Context | MCP to Use | When |
|---------|-----------|------|
| Database work | `supabase` | Schema, migrations, SQL, RLS policies |
| Framework/library docs | `context7` | Next.js, React, Supabase, Tailwind, shadcn/ui, TanStack, Zod, Vitest |
| Complex reasoning | `sequential-thinking` | Architecture decisions, debugging, multi-step planning |
| Browser testing | `playwright` | UI verification, visual testing |
| Code patterns | `gh_grep` (if available) | Real-world implementation examples |

### Skill Auto-Selection

| Task Type | Skills to Invoke | Priority |
|-----------|-----------------|----------|
| New feature/idea | `brainstorming` → `writing-plans` | Always brainstorm first |
| Building UI | `frontend-design` or `frontend-developer` | Based on design vs implementation |
| Bug/test failure | `systematic-debugging` | Before proposing any fix |
| Writing code | `test-driven-development` | Before implementation |
| Code complete | `verification-before-completion` | Before claiming done |
| Multiple independent tasks | `dispatching-parallel-agents` | 2+ independent tasks |
| Design review | `critique` → `polish` | Evaluate then refine |
| Layout issues | `arrange` | Spacing, rhythm, hierarchy |
| Performance | `optimize` | Slow, laggy, bundle size |
| Pre-merge | `requesting-code-review` | Before merge/PR |
| Responsive design | `adapt` | Mobile/tablet/desktop |
| Typography | `typeset` | Font, sizing, readability |
| Color/visual | `colorize` or `bolder` | Based on need |
| Database optimization | `database-optimizer` | Query/schema issues |
| Backend architecture | `backend-architect` | System design, APIs |

### Subagent Auto-Selection

| Task | Agent | Model |
|------|-------|-------|
| Research/exploration | `research` | Sonnet (fast, cheap) |
| Focused code changes | `executor` | Sonnet (fast, cheap) |
| Code review | `reviewer` | Sonnet (fast, cheap) |
| Planning/architecture | Main session | Opus (deep reasoning) |
| Complex debugging | Main session | Opus (deep reasoning) |

### Slash Commands

| Command | When to Use |
|---------|-------------|
| `/check-build` | After completing a feature, before committing |
| `/quick-test` | After code changes, verify tests pass |
| `/review-query` | After writing Supabase queries |
| `/deploy-check` | Before deployment |

### Decision Principles

1. **Never ask the user which tool to use** — infer from context
2. **Brainstorm before building** — any new feature goes through brainstorming first
3. **Debug systematically** — never guess at fixes
4. **Verify before claiming done** — run checks, not just promise
5. **Use Sonnet for execution, Opus for thinking** — save tokens on routine work
6. **Delegate to subagents** when tasks are independent and can run in parallel
7. **Use Context7** before relying on training data for any library/framework question
8. **Use Sequential Thinking** for complex multi-step reasoning
