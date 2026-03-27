# Speckit Plan Skill

## Description
Create a technical implementation plan for the current specification.

## Usage
```
$speckit-plan [tech-stack...]
```

## Steps

1. Read feature spec from `specs/[feature-name]/spec.md`
2. Read plan template from `.specify/templates/plan-template.md`
3. Document:
   - Technology choices and rationale
   - Project structure
   - API design (if applicable)
   - Data model (if applicable)
   - File structure
   - Implementation approach

## Output
Create `specs/[feature-name]/plan.md`
