---
globs:
  - "src/server/**"
  - "supabase/**"
  - "src/lib/supabase/**"
---
## Database Rules
- Always use parameterized queries — never string concatenation
- Never bypass RLS policies
- All migrations must be idempotent
- Unit key = project_id + unit_code (never unit_code alone)
- Contract key = contract_code (when available)
- Installments link to contracts, NOT directly to units
- Use contract_units junction table for multi-unit contracts
- Design tables as if they will feed Power BI later
- Required indexes: contract_code, installment_code, customer_name, project_id, unit_status, due_date
