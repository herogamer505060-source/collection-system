# Claude Code Ultimate Setup — Design Document

**Date:** 2026-03-28
**Status:** Approved
**Goal:** Optimize Claude Code for maximum performance, minimum token waste, and professional workflow

---

## 1. CLAUDE.md Restructuring (809→~100 lines)

**Current:** Monolithic 809-line file loaded every conversation (~42,000 tokens)
**Target:** ~100 lines with only universal rules + tech stack + critical conventions

Content moved to:
- `.claude/rules/` — scoped rule files (load per file path)
- `docs/specs/` — reference specs (load on demand via skills)

## 2. .claude/rules/ Directory (Scoped Rules)

| File | Scope | Content |
|------|-------|---------|
| `coding-standards.md` | `src/**` | TypeScript strict, naming, quality |
| `database-rules.md` | `src/server/**`, `supabase/**` | Query patterns, RLS, migrations |
| `rtl-arabic.md` | `src/components/**`, `src/app/**` | RTL, Arabic labels, currency format |
| `import-pipeline.md` | `src/features/imports/**` | Import logic, parsing, validation |
| `design-system.md` | `src/components/**`, `src/app/**` | The Financial Architect theme rules |

## 3. .claudeignore

Exclude: `.next/`, `node_modules/`, `dist/`, `build/`, `coverage/`, `*.lock`, `*.map`, `*.min.*`, `.git/`, `supabase/.temp/`

## 4. Security Fix

Remove hardcoded Supabase service_role JWT from `settings.json` and `settings.local.json`

## 5. Permissions Cleanup

Remove broken entries (`Bash(for f:*)`, `Bash(do echo:*)`, `Bash(done)`, hardcoded JWT curl)
Add clean wildcard permissions for common operations

## 6. Hooks

- **PostToolUse (Write|Edit):** Auto-format with Prettier
- **PreToolUse (Bash):** Block dangerous commands (rm -rf /, DROP TABLE/DATABASE)
- **PreToolUse (Write|Edit):** Block writes to .env files

## 7. Compaction Survival

`.claude/compaction-context.md` — critical context re-injected after compaction via hook

## 8. Token Optimization

- Environment: `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=75`
- Environment: `MAX_THINKING_TOKENS=10000`

## 9. Custom Slash Commands

- `/check-build` — Run typecheck + lint + build
- `/review-query` — Review Supabase query performance
- `/quick-test` — Run vitest on changed files

## 10. Model Routing

- Main session: Opus [1m] (keep current)
- Subagents: Default to Sonnet for execution tasks

## 11. MCPs to Add

- Sequential Thinking (Anthropic official)
- Brave Search (free 2K queries/month)

## 12. AGENTS.md Auto-Invocation Rules

Clear rules for when to auto-invoke each tool/skill/MCP based on context
