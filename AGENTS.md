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

Choose the best tools, MCPs, skills, and workflow automatically. **Never ask the user which tool — just do the right thing.**

---

### STEP 0 — Start of Every Conversation

| Trigger              | Action                                                                      |
| -------------------- | --------------------------------------------------------------------------- |
| Any new conversation | Invoke `superpowers:using-superpowers` first to discover which skills apply |

---

### MCP Auto-Selection

| Context                      | MCP                       | When                                                                 |
| ---------------------------- | ------------------------- | -------------------------------------------------------------------- |
| Database work                | `supabase` MCP            | Schema, migrations, SQL, RLS, edge functions                         |
| Framework/library docs       | `context7` MCP            | Next.js, React, Supabase, Tailwind, shadcn/ui, Zod, Vitest, TanStack |
| Complex multi-step reasoning | `sequential-thinking` MCP | Architecture decisions, root-cause debugging, technical planning     |
| Browser/UI testing           | `playwright` MCP          | Visual verification, E2E testing, screenshot comparison              |
| Design generation            | `stitch` MCP              | Generate screens, design systems, UI variants from text              |
| Deployment/monitoring        | `vercel` MCP              | Deploy, check logs, monitor build errors                             |
| GitHub operations            | `github` MCP              | PRs, issues, code search, reviews                                    |

---

### Skill Auto-Selection

#### Planning & Ideation

| Task                           | Skill                                                                      | Priority                           |
| ------------------------------ | -------------------------------------------------------------------------- | ---------------------------------- |
| New feature or idea            | `superpowers:brainstorming` → `superpowers:writing-plans`                  | Always brainstorm first, then plan |
| Feature spec needed            | `speckit.specify` → `speckit.clarify` → `speckit.plan` → `speckit.tasks`   | Full spec workflow                 |
| Convert tasks to GitHub issues | `speckit.taskstoissues`                                                    | After tasks.md is ready            |
| Executing a written plan       | `superpowers:executing-plans` or `superpowers:subagent-driven-development` | Based on size                      |

#### Building

| Task                    | Skill                                     | When                        |
| ----------------------- | ----------------------------------------- | --------------------------- |
| Any code implementation | `superpowers:test-driven-development`     | Before writing code         |
| UI components/pages     | `frontend-design`                         | Design-quality interfaces   |
| UI implementation       | `frontend-developer`                      | Pure code, no design needed |
| 2+ independent tasks    | `superpowers:dispatching-parallel-agents` | Parallelize immediately     |
| Feature branch work     | `superpowers:using-git-worktrees`         | Isolate from main workspace |

#### Design & UI Polish

| Task                         | Skill                                      | When                        |
| ---------------------------- | ------------------------------------------ | --------------------------- |
| Generate UI from description | `stitch` MCP (`generate_screen_from_text`) | First pass for any screen   |
| Design system                | `stitch` MCP (`create_design_system`)      | Establish tokens/components |
| Design review                | `critique` → `polish`                      | Evaluate then refine        |
| Layout/spacing issues        | `arrange`                                  | Visual rhythm, hierarchy    |
| Color lacking                | `colorize` or `bolder`                     | Based on intensity needed   |
| Too aggressive               | `quieter`                                  | Tone it down                |
| Typography                   | `typeset`                                  | Font, sizing, readability   |
| Responsive                   | `adapt`                                    | Mobile/tablet/desktop       |
| Animations                   | `animate`                                  | Motion, micro-interactions  |
| Design system drift          | `normalize`                                | Realign to tokens           |
| Over-complex design          | `distill`                                  | Strip to essence            |
| Polish pass                  | `polish`                                   | Pre-ship quality check      |

#### Debugging & Quality

| Task                      | Skill                                        | When                                |
| ------------------------- | -------------------------------------------- | ----------------------------------- |
| Any bug or test failure   | `superpowers:systematic-debugging`           | Before proposing any fix            |
| About to claim done       | `superpowers:verification-before-completion` | Run checks, not just promise        |
| Code complete/pre-merge   | `superpowers:requesting-code-review`         | Every PR                            |
| Receiving review feedback | `superpowers:receiving-code-review`          | Before implementing suggestions     |
| Finishing a branch        | `superpowers:finishing-a-development-branch` | Structured merge/PR options         |
| Code quality pass         | `code-reviewer` or `/review-query`           | After writing queries or components |
| DB query optimization     | `database-optimizer`                         | Slow queries, schema design         |
| Backend architecture      | `backend-architect`                          | System design, API design           |

---

### Subagent Model Routing

| Task                          | Agent               | Model  | Reason                                  |
| ----------------------------- | ------------------- | ------ | --------------------------------------- |
| Codebase research/exploration | `research` subagent | Sonnet | Fast, no deep reasoning needed          |
| Focused code changes          | `executor` subagent | Sonnet | Execution, not analysis                 |
| Code review                   | `reviewer` subagent | Sonnet | Pattern matching, well-defined criteria |
| Architecture decisions        | Main session        | Opus   | Requires deep reasoning                 |
| Complex debugging             | Main session        | Opus   | Multi-step causal analysis              |
| Long planning sessions        | Main session        | Opus   | Context retention matters               |

---

### Slash Commands

| Command         | When                                          |
| --------------- | --------------------------------------------- |
| `/check-build`  | After completing a feature, before committing |
| `/quick-test`   | After code changes                            |
| `/review-query` | After writing any Supabase query              |
| `/deploy-check` | Before deployment                             |

---

### Decision Principles

1. **Start every conversation** with `superpowers:using-superpowers`
2. **Never ask the user which tool** — infer from context and invoke automatically
3. **Brainstorm before building** — new feature → brainstorm → plan → implement
4. **Use speckit** for feature work requiring specs, tasks, or GitHub issues
5. **Debug systematically** — `systematic-debugging` before any fix attempt
6. **Verify before claiming done** — `verification-before-completion` always
7. **Parallelize** with `dispatching-parallel-agents` when 2+ tasks are independent
8. **Use Context7** before relying on training data for any library question
9. **Use Stitch MCP** for generating UI screens and design systems
10. **Use Sonnet for execution, Opus for thinking** — save cost on routine work
