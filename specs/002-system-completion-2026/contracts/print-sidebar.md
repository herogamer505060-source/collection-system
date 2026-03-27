# Contract: Print Support & Sidebar Update

## Purpose
Add print-friendly CSS for report pages and add "التقارير" to sidebar navigation.

## 1. Sidebar Update

**File**: `src/components/layout/sidebar.tsx`

Add to `navItems` array after the follow-ups entry:

```typescript
{ href: "/reports", label: "التقارير", ready: true },
```

**File**: `src/lib/auth/permissions.ts`

Add to types and maps:

```typescript
// PermissionKey union — add:
| "reports.read"

// AppScreen union — add:
| "reports"

// SCREEN_PERMISSION_MAP — add:
reports: "reports.read",

// ROLE_PERMISSION_MAP — add "reports.read" to ALL roles:
admin: [..., "reports.read"],
manager: [..., "reports.read"],
collector: [..., "reports.read"],
viewer: [..., "reports.read"],
```

## 2. Print CSS

**File**: `src/app/globals.css`

Add at the end:

```css
@media print {
  /* Hide navigation and non-essential UI */
  nav,
  [data-sidebar],
  [data-topbar],
  .no-print,
  button,
  .filter-bar form {
    display: none !important;
  }

  /* Reset layout */
  body {
    background: white !important;
  }

  main {
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  /* Ensure tables print well */
  table {
    font-size: 10pt !important;
    width: 100% !important;
  }

  th, td {
    padding: 4px 8px !important;
    border: 1px solid #ccc !important;
  }

  /* Keep RTL in print */
  html {
    direction: rtl !important;
  }

  /* Page margins */
  @page {
    margin: 1cm;
    size: A4 landscape;
  }
}
```

## 3. Print Button Component

Add a simple print button to report pages (alongside export buttons):

```tsx
// Can be inline in FilterBar actions, no separate component needed
<button
  className="rounded-2xl border border-border/70 bg-background px-4 py-2 text-sm font-semibold no-print"
  onClick={() => window.print()}
  type="button"
>
  طباعة / PDF
</button>
```

Note: The `no-print` class hides the button itself during printing.

## Verification

### Sidebar
- "التقارير" link appears in sidebar after "المتابعات"
- Link navigates to /reports
- Active state highlights correctly when on /reports or /reports/*

### Print
- Browser print dialog opens from any report page
- Sidebar, topbar, and buttons are hidden in print preview
- Table data renders cleanly in RTL
- A4 landscape fits most report tables
