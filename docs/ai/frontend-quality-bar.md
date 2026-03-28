# Frontend Quality Bar

Apply this quality bar to UI work in this project.

## Visual Direction

- Respect the existing product language, but avoid generic AI-looking layouts.
- Maintain strong hierarchy with clear section titles, restrained card usage, and deliberate spacing.
- Prefer meaningful color emphasis tied to status, urgency, and workflow state rather than decorative accents.

## Arabic-First UX

- Verify directionality, spacing, and overflow for Arabic text.
- Keep labels, table headers, and form messaging concise and easy to scan.
- Ensure mixed Arabic and numeric content stays readable in dense operational views.

## Interaction Quality

- Forms should show clear validation, disabled states, loading states, and success/error outcomes.
- Tables and dashboards should preserve readability under filters, empty states, and long values.
- Add motion only when it clarifies state changes or improves perceived responsiveness.

## Implementation Expectations

- Reuse existing UI primitives and tokens before introducing new patterns.
- Check mobile and desktop behavior for any route-level change.
- Use `playwright` for route smoke tests when local UI validation matters.
