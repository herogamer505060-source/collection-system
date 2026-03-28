---
description: Analyze or implement a Supabase-backed change safely
agent: build
---

Use the `supabase-safe-change` skill if it applies.

Work on this database-related request:

```text
$ARGUMENTS
```

Requirements:
- inspect the current schema and affected tables first with `supabase`
- identify codepaths, auth impact, and migration risk before editing
- prefer additive and backward-compatible changes when possible
- summarize schema risk, changed files, and verification performed
