---
globs:
  - "src/components/**"
  - "src/app/**"
---
## RTL & Arabic Rules
- App direction is always RTL
- All UI text must be in Arabic
- Tables must be readable in Arabic
- Currency: use Intl.NumberFormat with EGP (Egyptian Pound)
- Numbers and dates must display clearly
- Support flexible Arabic text search (partial matching)
- Do not mix display language with code language
