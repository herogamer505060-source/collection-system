---
globs:
  - "src/**"
---
## Coding Standards
- TypeScript strict — never use `any`
- English names in code, Arabic labels in UI
- Keep functions focused and short
- Use repository/services pattern moderately — no overengineering
- Separate parser, mapper, service, repository
- No business logic inside Next.js page files
- Use Zod for validation at system boundaries
- Use server-side data fetching for heavy screens
- Pagination for large tables
