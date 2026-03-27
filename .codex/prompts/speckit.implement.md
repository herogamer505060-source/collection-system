---
description: Execute tasks and build the feature according to the plan
---

# Speckit Implement Command

Execute implementation tasks and build the feature.

## Usage

```
$speckit-implement [task-id]
```

## Guidelines

1. Read the tasks from `specs/[current-feature]/tasks.md`
2. Execute tasks in dependency order
3. Update task status as completed
4. Log progress to `.specify/memory/implementation-log.md`
5. Ensure all tests pass before marking complete
