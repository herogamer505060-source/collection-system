# Speckit Constitution Skill

## Description
Create or update the project constitution with development principles and guidelines.

## Usage
```
$speckit-constitution [principles...]
```

## Steps

1. Load existing constitution from `.specify/memory/constitution.md`
2. If missing, initialize from `.specify/templates/constitution-template.md`
3. Identify all placeholder tokens `[PLACEHOLDER]`
4. Collect values from user input or infer from project context
5. Update constitution with concrete values
6. Validate no placeholders remain
7. Write updated constitution

## Output
Update `.specify/memory/constitution.md` with completed constitution.
