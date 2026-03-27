# UI/UX Redesign Plan — "The Financial Architect"

> This plan transforms the current generic admin aesthetic into the editorial-grade financial command center defined in `stitch_login_page_redesign/DESIGN.md`. Every step is self-contained with exact file paths, old values, and new values. Execute top-to-bottom.

---

## Design Context (for the executing model)

- **Target audience**: Internal collection teams at a real-estate company (3 projects: IL Parco, IL Centro, Caza). Arabic-speaking financial professionals working 8+ hour sessions.
- **Brand personality**: Authoritative, premium, precise. "The Financial Architect" — think modern architecture: structural integrity, expansive space, premium materials, zero clutter.
- **Tone**: Deep teal professional fintech — NOT generic admin blue. Editorial-grade typography. Long-session accessible.
- **RTL**: Everything is Right-to-Left Arabic first. Never break RTL flow.
- **Framework**: Next.js 15 App Router, TypeScript, Tailwind CSS. All changes must be Tailwind-compatible.

### Key Rules from DESIGN.md
1. **No-Line Rule**: 1px solid borders are PROHIBITED for sectioning. Use background color shifts instead.
2. **Surface Hierarchy**: `surface` → `surface-container-low` → `surface-container-lowest` (white) → `surface-container-high` (hover)
3. **No pure black/white**: Use `#191c1d` (on-surface) and `#f8f9fa` (surface) instead
4. **Signature gradient**: `linear-gradient(135deg, #0f666a, #337f83)` for primary CTAs
5. **Ghost borders only**: Where separation is needed, use `outline-variant` at 15% opacity
6. **Ambient shadows**: `0 8px 24px rgba(25, 28, 29, 0.06)` for floating elements
7. **Glassmorphism**: Only for top nav — `background: surface/80%`, `backdrop-filter: blur(12px)`

---

## Phase 1: Foundation (CSS Variables, Fonts, Tailwind Config)

### Step 1.1 — Replace fonts in `src/app/layout.tsx`

**File**: `src/app/layout.tsx`

**Current fonts**: `Cairo` + `Noto_Kufi_Arabic`
**New fonts**: `IBM_Plex_Sans_Arabic` + `Manrope` + `Inter`

Replace the entire import and font setup:

```tsx
// OLD
import { Cairo, Noto_Kufi_Arabic } from "next/font/google";

const bodyFont = Cairo({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-cairo",
});

const displayFont = Noto_Kufi_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-kufi",
});
```

```tsx
// NEW
import { IBM_Plex_Sans_Arabic, Manrope, Inter } from "next/font/google";

const bodyFont = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-ibm-plex-arabic",
});

const displayFont = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-manrope",
});

const uiFont = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-inter",
});
```

Also update the body className to include all three font variables:

```tsx
// OLD
<body className={cn(bodyFont.variable, displayFont.variable, "antialiased")}>

// NEW
<body className={cn(bodyFont.variable, displayFont.variable, uiFont.variable, "antialiased")}>
```

### Step 1.2 — Replace CSS variables in `src/app/globals.css`

**File**: `src/app/globals.css`

Replace the entire `:root` block with Material Design tokens from DESIGN.md. Keep the `@tailwind` directives, `@layer base`, print styles, and `::selection` intact.

```css
/* OLD :root */
:root {
  --background: 42 40% 97%;
  --foreground: 192 35% 18%;
  --card: 0 0% 100%;
  --card-foreground: 192 35% 18%;
  --border: 190 22% 84%;
  --input: 190 22% 84%;
  --ring: 183 72% 34%;
  --primary: 183 72% 34%;
  --primary-foreground: 0 0% 100%;
  --secondary: 37 89% 92%;
  --secondary-foreground: 21 52% 24%;
  --muted: 186 28% 92%;
  --muted-foreground: 192 20% 40%;
  --accent: 21 83% 91%;
  --accent-foreground: 21 52% 24%;
}
```

```css
/* NEW :root — Material Design tokens from DESIGN.md */
:root {
  /* Core palette */
  --primary: 183 73% 24%;           /* #0f666a */
  --primary-foreground: 0 0% 100%;  /* white */
  --primary-container: 183 43% 36%; /* #337f83 */
  --on-primary-container: 180 100% 97%; /* #f3ffff */

  /* Surface hierarchy — the backbone of the "no-line" system */
  --background: 200 14% 98%;        /* #f8f9fa — Surface foundation */
  --foreground: 195 11% 10%;        /* #191c1d — on-surface */
  --surface: 200 14% 98%;           /* #f8f9fa */
  --surface-container-low: 210 7% 95%;  /* #f3f4f5 — sectioning */
  --surface-container: 210 4% 93%;      /* #edeeef — grouping */
  --surface-container-high: 210 4% 91%; /* #e7e8e9 — hover/overlay */
  --surface-container-lowest: 0 0% 100%; /* #ffffff — content cards */

  /* Cards use surface-container-lowest */
  --card: 0 0% 100%;
  --card-foreground: 195 11% 10%;

  /* Borders — ghost borders, never 1px solid for sections */
  --border: 180 8% 76%;             /* #bcc9c8 outline-variant */
  --input: 180 8% 76%;
  --ring: 183 73% 24%;

  /* Secondary — muted slate */
  --secondary: 200 16% 36%;         /* #4c616c */
  --secondary-foreground: 0 0% 100%;

  /* Muted */
  --muted: 180 4% 91%;              /* surface-container-high area */
  --muted-foreground: 180 10% 27%;  /* #3d4949 on-surface-variant */

  /* Accent — success/tertiary teal */
  --accent: 180 100% 20%;           /* #006767 tertiary */
  --accent-foreground: 0 0% 100%;

  /* Semantic */
  --destructive: 0 74% 42%;         /* #ba1a1a */
  --destructive-foreground: 0 0% 100%;

  /* Outline tokens */
  --outline: 180 5% 45%;            /* #6d7979 */
  --outline-variant: 180 8% 76%;    /* #bcc9c8 */
}
```

Also update the `body` rule — remove the current background gradient and replace:

```css
/* OLD body rule */
body {
  @apply min-h-screen bg-background text-foreground;
  background-image:
    radial-gradient(circle at top, rgba(13, 148, 136, 0.12), transparent 38%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.86));
  font-feature-settings: "kern" 1;
}
```

```css
/* NEW body rule — clean surface, no decorative gradient */
body {
  @apply min-h-screen bg-[#f8f9fa] text-[#191c1d];
  font-feature-settings: "kern" 1;
}
```

Update selection color:

```css
/* OLD */
::selection {
  background: rgba(13, 148, 136, 0.18);
}

/* NEW — using primary */
::selection {
  background: rgba(15, 102, 106, 0.18);
}
```

Add these utility classes AFTER the `:root` block, inside `@layer base`:

```css
/* Add inside @layer base, after :root */
.glass-nav {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.gradient-primary {
  background: linear-gradient(135deg, #0f666a, #337f83);
}

.ghost-border {
  border: 1px solid rgba(188, 201, 200, 0.15);
}

.ambient-shadow {
  box-shadow: 0 8px 24px rgba(25, 28, 29, 0.06);
}
```

### Step 1.3 — Update Tailwind config `tailwind.config.ts`

**File**: `tailwind.config.ts`

Replace with:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./tests/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          container: "hsl(var(--primary-container))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        /* Material surface tokens */
        surface: {
          DEFAULT: "#f8f9fa",
          dim: "#d9dadb",
          container: {
            DEFAULT: "#edeeef",
            low: "#f3f4f5",
            high: "#e7e8e9",
            highest: "#e1e3e4",
            lowest: "#ffffff",
          },
        },
        "on-surface": {
          DEFAULT: "#191c1d",
          variant: "#3d4949",
        },
        outline: {
          DEFAULT: "#6d7979",
          variant: "#bcc9c8",
        },
        tertiary: {
          DEFAULT: "#006767",
          container: "#008282",
        },
        error: {
          DEFAULT: "#ba1a1a",
          container: "#ffdad6",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
        lg: "0.75rem",
        md: "0.375rem",
        sm: "0.25rem",
        xl: "0.5rem",
      },
      fontFamily: {
        sans: ["var(--font-ibm-plex-arabic)", "sans-serif"],
        display: ["var(--font-manrope)", "var(--font-ibm-plex-arabic)", "sans-serif"],
        body: ["var(--font-inter)", "var(--font-ibm-plex-arabic)", "sans-serif"],
        label: ["var(--font-inter)", "var(--font-ibm-plex-arabic)", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["3.5rem", { lineHeight: "1.15", fontWeight: "800" }],
        "display-md": ["2.75rem", { lineHeight: "1.2", fontWeight: "800" }],
        "display-sm": ["2.25rem", { lineHeight: "1.25", fontWeight: "700" }],
        "headline-lg": ["2rem", { lineHeight: "1.3", fontWeight: "700" }],
        "headline-md": ["1.75rem", { lineHeight: "1.35", fontWeight: "700" }],
        "headline-sm": ["1.5rem", { lineHeight: "1.4", fontWeight: "600" }],
        "title-lg": ["1.375rem", { lineHeight: "1.4", fontWeight: "600" }],
        "title-md": ["1rem", { lineHeight: "1.5", fontWeight: "600" }],
        "body-lg": ["1rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body-md": ["0.875rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body-sm": ["0.75rem", { lineHeight: "1.5", fontWeight: "400" }],
        "label-lg": ["0.75rem", { lineHeight: "1.4", fontWeight: "500" }],
        "label-md": ["0.6875rem", { lineHeight: "1.4", fontWeight: "500" }],
      },
      boxShadow: {
        ambient: "0 8px 24px rgba(25, 28, 29, 0.06)",
        panel: "0 24px 60px -30px rgba(15, 23, 42, 0.15)",
      },
      spacing: {
        "spacing-8": "1.75rem",
        "spacing-10": "2.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## Phase 2: Layout Shell (Sidebar, Topbar, Dashboard Layout)

### Step 2.1 — Redesign the Sidebar `src/components/layout/sidebar.tsx`

Replace the entire component. The new sidebar should:
- Be **visually anchored** on the right (RTL) using the grid layout from the parent
- Use `surface-container-lowest` (white) background with `ambient-shadow`
- Show the brand header: "Collection System" with gradient text + "The Financial Architect" subtitle
- Navigation items: use Material Symbols icons, active state with `bg-teal-50` + `border-r-4 border-primary`
- Inactive items: `text-on-surface-variant` with `hover:bg-surface-container-low`
- No 1px borders between nav items — only background shifts
- Logout button at bottom: `text-error` with `hover:bg-error-container`

Key CSS classes for nav items:

```
// Active
"flex items-center gap-3 px-4 py-3 bg-teal-50 text-primary font-semibold border-r-4 border-primary rounded-l-xl"

// Inactive
"flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-colors"
```

Remove the "جاهز" and "قريبا" labels from nav items. Remove the role badges from the sidebar header — move user info to topbar.

The sidebar should render the brand section at top, then nav, then logout at bottom using `mt-auto`.

### Step 2.2 — Redesign the Topbar `src/components/layout/topbar.tsx`

Replace the component. The new topbar should:
- Use glassmorphism: `bg-white/80 glass-nav` (the utility class from Step 1.2)
- Be a horizontal bar with: page title (left/start in RTL) and user info (right/end in RTL)
- Page title uses `font-display text-headline-sm font-bold`
- Page description uses `text-body-md text-on-surface-variant`
- Remove the "Secure Workspace" label at top
- User info section: email + role label in a subtle pill
- Include `LastDataUpdate` component
- Remove the rounded card border styling — topbar should feel like a clean toolbar strip

Key structure:

```tsx
<header className="flex items-center justify-between bg-white/80 glass-nav rounded-2xl px-6 py-4 ambient-shadow">
  <div>
    <h1 className="font-display text-headline-sm text-on-surface">{page.title}</h1>
    <p className="text-body-md text-on-surface-variant mt-1">{page.description}</p>
  </div>
  <div className="flex items-center gap-4">
    <LastDataUpdate lastImportAt={lastImportAt} />
    <div className="text-label-lg text-on-surface-variant">
      <span className="font-semibold text-on-surface">{sessionUser.email ?? sessionUser.fullName}</span>
      <span className="mr-2 text-label-md">{primaryRole ? ROLE_LABELS_AR[primaryRole] : ""}</span>
    </div>
  </div>
</header>
```

### Step 2.3 — Redesign the Dashboard Layout `src/app/(dashboard)/layout.tsx`

The layout wraps sidebar + topbar + content. Update it to match the Stitch HTML structure:

```tsx
// NEW layout structure
<div className="min-h-screen bg-surface">
  <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
    <Sidebar sessionUser={sessionUser} />
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <Topbar lastImportAt={lastImportAt} sessionUser={sessionUser} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  </div>
</div>
```

Key changes:
- Remove `max-w-7xl mx-auto` — use full width
- Remove the content wrapper card (`rounded-[2rem] border border-white/70 bg-card/85 p-6 shadow-panel backdrop-blur-sm`) — content pages manage their own containers now
- Background is flat `bg-surface` — no gradient
- Sidebar and main are in a CSS grid

---

## Phase 3: Core Components

### Step 3.1 — DataTable `src/components/ui/data-table.tsx`

Replace the table styling to follow DESIGN.md rules:

- **Outer wrapper**: Remove `border border-border/70 bg-white/85`. Replace with `bg-surface-container-lowest rounded-2xl ambient-shadow`
- **Header row**: Replace `bg-muted/60 text-muted-foreground` with `bg-surface-container-low text-on-surface-variant`
- **Body dividers**: Replace `divide-y divide-border/60` with `divide-y divide-outline-variant/15` (ghost borders)
- **Row cells**: Replace `text-foreground` with `text-on-surface`
- **Empty state**: Replace `text-muted-foreground` with `text-on-surface-variant`

```tsx
// Key class changes:
// Outer div:
"overflow-hidden rounded-2xl bg-surface-container-lowest ambient-shadow"
// (remove border)

// thead:
"bg-surface-container-low text-on-surface-variant"

// tbody:
"divide-y divide-outline-variant/[0.15]"

// td:
"px-4 py-4 text-on-surface"
```

### Step 3.2 — StatusBadge `src/components/ui/status-badge.tsx`

Update the variants to use the Material Design token colors:

```ts
// NEW variants
variant: {
  danger: "bg-error-container text-[#93000a]",
  info: "bg-[#cfe6f2] text-[#071e27]",
  neutral: "bg-surface-container-high text-on-surface-variant",
  success: "bg-[#d0f5f5] text-[#004f4f]",
  warning: "bg-[#fff3e0] text-[#7a4100]",
},
```

### Step 3.3 — FilterBar `src/components/ui/filter-bar.tsx`

Update to use surface hierarchy instead of borders:

```tsx
// OLD
"filter-bar rounded-[1.75rem] border border-border/70 bg-white/80 p-5"

// NEW
"filter-bar rounded-2xl bg-surface-container-lowest p-5 ambient-shadow"
```

Title: change `font-display text-xl font-bold text-foreground` to `font-display text-title-lg text-on-surface`

### Step 3.4 — KpiGrid `src/components/dashboard/kpi-grid.tsx`

Primary cards:
```tsx
// OLD
`rounded-[1.75rem] border border-border/70 bg-gradient-to-br ${card.accentClassName} p-5 shadow-sm`

// NEW — use surface-container-lowest with subtle tonal tint
"rounded-2xl bg-surface-container-lowest p-6 ambient-shadow"
```

Update `accentClassName` to be a thin top-border color band:
```tsx
// Instead of gradient backgrounds, use a top accent strip
// Add this above the content inside each card:
<div className="h-1 w-12 rounded-full bg-primary mb-4" />
// Or use different colors per card: bg-primary, bg-accent, bg-[#e89a00], bg-error
```

KPI value: Replace `font-display text-3xl font-bold text-foreground` with `font-display text-display-sm text-on-surface`

KPI label: Replace `text-sm font-semibold text-muted-foreground` with `text-label-lg text-on-surface-variant`

Secondary cards:
```tsx
// OLD
"rounded-[1.5rem] border border-border/70 bg-white/80 p-4"

// NEW
"rounded-xl bg-surface-container-low p-4"
```

Secondary value: `font-display text-headline-sm text-on-surface`

### Step 3.5 — Buttons (global pattern)

Primary buttons throughout the app currently use:
```
bg-primary text-primary-foreground
```

Replace with the signature gradient:
```
gradient-primary text-white font-semibold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all
```

Secondary buttons currently use varied styles. Standardize to:
```
bg-surface-container-high text-on-surface font-semibold rounded-xl hover:bg-surface-container-highest transition-all
```

Ghost/tertiary buttons:
```
text-primary font-semibold hover:text-primary-container transition-colors
```

Apply these patterns in:
- `src/app/(auth)/login/page.tsx` (login button)
- `src/app/(dashboard)/users/page.tsx` (add user button)
- `src/components/customers/add-follow-up-button.tsx`
- `src/components/imports/import-upload-form.tsx`
- Any other button instances

### Step 3.6 — Input fields (global pattern)

Current inputs use:
```
rounded-2xl border border-border bg-background px-4 py-3 text-sm
```

Replace with:
```
rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30 transition-all
```

Apply in:
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- Any filter forms and search inputs

---

## Phase 4: Page-Level Adjustments

### Step 4.1 — Login page `src/app/(auth)/login/page.tsx`

Key changes:
- Remove `shadow-panel backdrop-blur-sm` from the two section cards
- Left section (info): `bg-surface-container-low rounded-2xl p-8`
- Right section (form): `bg-surface-container-lowest rounded-2xl p-8 ambient-shadow`
- Main heading: `font-display text-display-sm` instead of `text-4xl`
- Button: Use `gradient-primary` class
- Error/success alerts: Use `bg-error-container text-[#93000a]` and `bg-[#d0f5f5] text-[#004f4f]`

### Step 4.2 — Dashboard page `src/app/(dashboard)/dashboard/page.tsx`

No structural changes needed — the KpiGrid fix (Step 3.4) handles the cards. Verify the charts (Recharts) use the primary teal palette: `#0f666a`, `#337f83`, `#006767`.

### Step 4.3 — All list pages (customers, contracts, installments, units, follow-ups)

These pages use `FilterBar` + `DataTable`. The component-level fixes from Steps 3.1 and 3.3 handle most of the work. Verify:
- No remaining `border border-border/70` wrappers — replace with `ambient-shadow` or surface-container backgrounds
- Page `<section>` wrappers should not add extra borders

### Step 4.4 — Customer profile page `src/app/(dashboard)/customers/[customerId]/page.tsx`

The profile overview uses cards for customer info, installments table, and follow-up history. Ensure:
- Section cards: `bg-surface-container-lowest rounded-2xl p-6 ambient-shadow`
- Section headings: `font-display text-title-lg text-on-surface`
- Dividers between sections: Use `bg-surface-container-low` gap instead of border-bottom

### Step 4.5 — Contract detail page `src/app/(dashboard)/contracts/[contractId]/page.tsx`

Same treatment as customer profile — surface hierarchy, no borders, ambient shadows.

### Step 4.6 — Reports pages `src/app/(dashboard)/reports/*/page.tsx`

Report pages render tables. The DataTable fix handles styling. Verify:
- Report title sections match the topbar hierarchy
- ExportButton uses the secondary button pattern

---

## Phase 5: Refinement Pass

### Step 5.1 — Remove all `border border-white/70` patterns

Search the entire `src/` directory for `border-white/70` and remove them. These are legacy glass-morphism borders that violate the no-line rule. Replace the surrounding element with appropriate surface-container background.

### Step 5.2 — Remove all `backdrop-blur-sm` except on topbar

Search for `backdrop-blur` — only the topbar should have it. Remove from all other elements.

### Step 5.3 — Replace all `rounded-[1.75rem]` and `rounded-[2rem]` with design system tokens

- `rounded-[2rem]` → `rounded-3xl` (1.5rem) or `rounded-2xl` (1rem)
- `rounded-[1.75rem]` → `rounded-2xl` (1rem)
- `rounded-[1.5rem]` → `rounded-xl` (0.5rem) or `rounded-2xl` (1rem)

Use consistent rounding. Cards = `rounded-2xl`. Buttons/inputs = `rounded-xl`. Badges = `rounded-full`.

### Step 5.4 — Replace all `shadow-panel` usage

Current `shadow-panel` is very heavy: `0 24px 60px -30px rgba(15, 23, 42, 0.35)`.
Replace with `ambient-shadow` everywhere except where a truly floating element needs it (dropdowns).

### Step 5.5 — Verify typography hierarchy

Scan all pages and ensure:
- Page titles: `font-display text-headline-sm` or `text-headline-md`
- Section headings: `font-display text-title-lg`
- Body text: `text-body-md` (0.875rem default)
- Labels/metadata: `text-label-lg` or `text-label-md`
- KPI values: `text-display-sm` or `text-headline-md`
- No raw `text-sm`, `text-xs`, `text-3xl` etc. — use the named scale

### Step 5.6 — Color audit

Search and replace these anti-patterns:
- `text-foreground` → `text-on-surface`
- `text-muted-foreground` → `text-on-surface-variant`
- `bg-white` (raw) → `bg-surface-container-lowest`
- `bg-background` → `bg-surface`
- `text-slate-*` → appropriate `on-surface` variant
- `bg-slate-*` → appropriate `surface-container-*` variant
- Remove any `text-black` or `#000000` usage

---

## Phase 6: Login Page Special Treatment

The login page is the first thing users see. Apply extra polish:

### Step 6.1 — Login page structure

Rewrite `src/app/(auth)/login/page.tsx` to follow Stitch HTML aesthetic:
- Full viewport height, centered content
- Left panel: Brand + value proposition on `surface-container-low` background
- Right panel: Form on white (`surface-container-lowest`) with `ambient-shadow`
- Brand heading with gradient text: `bg-gradient-to-br from-primary to-primary-container bg-clip-text text-transparent`
- Primary CTA button: full-width `gradient-primary` with `shadow-lg shadow-primary/20`
- Input focus glow: `focus:ring-2 focus:ring-[#8ad3d7]/30`

---

## Execution Checklist

Execute phases in order. After each phase, visually verify the result before proceeding.

- [ ] **Phase 1**: Foundation (fonts, CSS vars, tailwind config) — do this FIRST
- [ ] **Phase 2**: Layout shell (sidebar, topbar, dashboard layout)
- [ ] **Phase 3**: Core components (DataTable, StatusBadge, FilterBar, KpiGrid, buttons, inputs)
- [ ] **Phase 4**: Page-level adjustments (login, dashboard, list pages, detail pages)
- [ ] **Phase 5**: Refinement pass (remove legacy patterns, color audit, typography audit)
- [ ] **Phase 6**: Login page special treatment

---

## Files Modified (complete list)

| File | Phase | Change Summary |
|------|-------|----------------|
| `src/app/layout.tsx` | 1.1 | Replace fonts (Cairo/NotoKufi → IBM Plex Arabic/Manrope/Inter) |
| `src/app/globals.css` | 1.2 | Replace CSS variables with Material Design tokens, add utility classes |
| `tailwind.config.ts` | 1.3 | Add surface tokens, typography scale, Material colors, font families |
| `src/components/layout/sidebar.tsx` | 2.1 | Full redesign: white bg, teal accents, Material icons, no borders |
| `src/components/layout/topbar.tsx` | 2.2 | Glassmorphism bar, clean layout, remove card wrapper |
| `src/app/(dashboard)/layout.tsx` | 2.3 | Full-width grid, remove content card wrapper |
| `src/components/ui/data-table.tsx` | 3.1 | Surface hierarchy, ghost borders, no solid borders |
| `src/components/ui/status-badge.tsx` | 3.2 | Material Design semantic colors |
| `src/components/ui/filter-bar.tsx` | 3.3 | Surface bg, ambient shadow, no border |
| `src/components/dashboard/kpi-grid.tsx` | 3.4 | Metric tiles with accent strips, display typography |
| `src/app/(auth)/login/page.tsx` | 4.1, 6.1 | Full redesign with brand gradient, surface hierarchy |
| `src/app/(auth)/register/page.tsx` | 4.1 | Match login page treatment |
| All list pages under `src/app/(dashboard)/` | 4.3 | Remove legacy borders, verify surface hierarchy |
| Customer/contract detail pages | 4.4, 4.5 | Section cards with surface hierarchy |
| Report pages | 4.6 | Verify table styling, export button pattern |

---

## Important Constraints

1. **Do NOT change any TypeScript logic, API routes, services, or business rules** — this is a pure UI/UX pass
2. **Do NOT change component props or exported types** — only className values and JSX structure
3. **Do NOT install new npm packages** — all fonts come from `next/font/google`, all styling is Tailwind
4. **Do NOT add dark mode** — light mode only for v1
5. **Preserve all RTL behavior** — `dir="rtl"` on html, `text-right` on table headers
6. **Preserve all print styles** in globals.css
7. **Preserve the `data-sidebar` and `data-topbar` attributes** — they're used by print styles
8. **Test each phase visually** before moving to the next
