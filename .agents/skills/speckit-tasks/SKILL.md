# Speckit Tasks Skill

## Description
Break down implementation plan into dependency-ordered tasks.

## Usage
```
$speckit-tasks
```

## Steps

1. Read plan from `specs/[feature-name]/plan.md`
2. Read tasks template from `.specify/templates/tasks-template.md`
3. Identify all implementation steps
4. Order tasks by dependencies
5. Add acceptance criteria to each task
6. Categorize tasks (setup, core, testing, documentation)

## Output
Create `specs/[feature-name]/tasks.md`
