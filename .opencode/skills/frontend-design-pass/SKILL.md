---
name: frontend-design-pass
description: Improve production UI quality for this app with stronger hierarchy, Arabic-first usability, responsive behavior, and cleaner visual decisions.
compatibility: opencode
license: MIT
metadata:
  audience: frontend
  focus: design-quality
---

## What I do

- Review a page or component for visual hierarchy, spacing, states, readability, and workflow clarity.
- Preserve the product's existing language while avoiding bland, generic dashboard UI.
- Use `playwright` for route-level smoke checks when local validation is relevant.

## Workflow

1. Identify the page purpose, primary actions, and operator decision points.
2. Tighten spacing, hierarchy, and grouping before adding visual flourishes.
3. Improve empty, loading, error, and success states.
4. Check Arabic labels, number alignment, truncation, and dense table readability.
5. Verify mobile and desktop behavior for route-level work.

## Guardrails

- Reuse existing primitives and tokens when possible.
- Use color for meaning, not noise.
- Keep animations purposeful and light.
