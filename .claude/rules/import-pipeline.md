---
globs:
  - "src/features/imports/**"
  - "src/app/api/imports/**"
  - "src/server/services/import*"
---
## Import Pipeline Rules
- Use mapping layer — do not assume column names are stable
- Separate import service per file type
- Store results in import_batches table
- Provide preview/dry-run when possible
- Log failed rows with reasons
- Make imports idempotent
- Skip summary/total rows — only process operational data
- Normalize: trim, deduplicate spaces, ISO dates, safe decimal for money
- Generate fallback keys when primary code is missing — with clear log
- Parse multi-unit contracts: B28+B29, G3+G4, T1-T2-T3-T4-T5-T6
- Use tested parser — not naive split
