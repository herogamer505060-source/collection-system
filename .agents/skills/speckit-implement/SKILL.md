# Speckit Implement Skill

## Description
Execute implementation tasks and build the feature.

## Usage
```
$speckit-implement [task-id]
```

## Steps

1. Read tasks from `specs/[feature-name]/tasks.md`
2. Execute tasks in dependency order
3. Update task status as completed (add ✅)
4. Log progress to `.specify/memory/implementation-log.md`
5. Verify implementation against plan
6. Run tests if available

## Output
Mark tasks complete and log progress.
