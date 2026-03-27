# Design System Document

## 1. Overview & Creative North Star: "The Financial Architect"

This design system is engineered to transform a standard collections management tool into a high-authority, editorial-grade financial command center. The **Creative North Star** is **"The Financial Architect."** Like modern architecture, the system relies on structural integrity, expansive space, and premium materials rather than decorative clutter.

We move beyond the "generic admin" look by embracing a Right-to-Left (RTL) first philosophy. Instead of rigid boxes, we use **intentional asymmetry** and **tonal depth**. Large, editorial headings in the `display` scale anchor the eye, while data density is managed through a sophisticated hierarchy of layered surfaces. This creates a "secure workspace" feeling—a digital environment where every pixel conveys precision, trust, and enterprise-grade power.

---

## 2. Colors

The palette evolves the core teal identity into a sophisticated range of deep teals and professional grays, optimized for long-session accessibility.

### The Palette (Material Design Tokens)
- **Primary (`#0f666a`):** The core of the identity. Used for high-emphasis actions.
- **Surface (`#f8f9fa`):** The foundational base. A slightly cooled neutral that reduces eye strain.
- **Secondary (`#4c616c`):** A muted slate for supportive elements and secondary navigation.
- **Semantic (Error: `#ba1a1a`, Success/Tertiary: `#006767`):** High-contrast colors for immediate status recognition.

### Implementation Rules
*   **The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning. Boundaries must be defined by background color shifts. For instance, a list of collections should sit on `surface-container-low` while the surrounding page remains `surface`.
*   **Surface Hierarchy & Nesting:** Use tiers to create depth.
    *   *Foundation:* `surface`
    *   *Sectioning:* `surface-container-low`
    *   *Primary Content Cards:* `surface-container-lowest` (White)
    *   *Active/Hover Overlays:* `surface-container-high`
*   **Signature Textures:** For primary CTAs and critical data headers, use a subtle linear gradient transitioning from `primary` (#0f666a) to `primary_container` (#337f83) at a 135-degree angle. This adds "soul" and prevents the interface from looking "flat."

---

## 3. Typography

The typography stack uses **IBM Plex Sans Arabic** (or a similar high-quality Neo-Naskh font) for maximum legibility in complex fintech data.

*   **Display (`manrope`, 2.25rem - 3.5rem):** Reserved for high-level dashboard summaries. These are "Editorial Moments" that give the user a clear sense of scale.
*   **Headline (`manrope`, 1.5rem - 2rem):** Used for section titles. These should feel authoritative and provide clear landmarks.
*   **Title (`inter`, 1.0rem - 1.375rem):** Used for card headings and modal titles.
*   **Body (`inter`, 0.75rem - 1.0rem):** The workhorse for data tables and descriptions. The `body-md` (0.875rem) is the default for readability.
*   **Label (`inter`, 0.6875rem - 0.75rem):** Used for metadata, small captions, and form labels.

**Hierarchy Strategy:** Always pair a `display-sm` value for primary metrics (e.g., total debt collected) with a `label-md` descriptive tag to create a clear, high-contrast relationship.

---

## 4. Elevation & Depth

We eschew traditional shadows in favor of **Tonal Layering** and **Atmospheric Depth**.

*   **The Layering Principle:** Stacking surfaces creates hierarchy. A white card (`surface-container-lowest`) on a light gray background (`surface-container`) provides all the "lift" needed.
*   **Ambient Shadows:** If an element must "float" (like a dropdown or a sidebar), use a diffused shadow: `y: 8px, blur: 24px, color: rgba(25, 28, 29, 0.06)`. This mimics soft, natural office lighting.
*   **The "Ghost Border" Fallback:** In high-density data tables where rows require separation, use the `outline-variant` token at **15% opacity**. It should be felt, not seen.
*   **Glassmorphism:** For top navigation or floating action toolbars, use `surface` with 80% opacity and a `backdrop-filter: blur(12px)`. This makes the layout feel integrated and "frosted," allowing data to move behind it without losing legibility.

---

## 5. Components

### Buttons
*   **Primary:** Solid gradient (`primary` to `primary_container`), `xl` (0.75rem) roundedness.
*   **Secondary:** `surface-container-high` background with `on-surface` text. No border.
*   **Tertiary/Ghost:** No background, `primary` text. Use for low-priority actions like "Cancel."

### Input Fields
*   **Structure:** `surface-container-lowest` background with a subtle `outline-variant` (20% opacity). 
*   **Focus:** Border shifts to `primary` (100% opacity) with a 2px "glow" using `primary_fixed_dim`.

### Cards & Data Lists
*   **Constraint:** Forbid divider lines between list items. Use the `8px` grid for vertical white space or shift the background to `surface-container-low` on every other row (zebra striping) for readability.
*   **Fintech Specific - The "Metric Tile":** A specialized card using `display-md` for the amount and a micro-sparkline in `tertiary` for trend visualization.

---

## 6. Do's and Don'ts

### Do
*   **Do** respect the RTL flow. Icons that indicate direction (arrows, chevrons) must be flipped.
*   **Do** use "Breathing Room." Use the `spacing-8` (1.75rem) and `spacing-10` (2.25rem) tokens to separate major dashboard widgets.
*   **Do** ensure all text on `primary` or `tertiary` backgrounds uses the `on-primary` (White) token for AA accessibility.

### Don't
*   **Don't** use 100% black (#000000). Use `on-surface` (#191c1d) for a softer, premium feel.
*   **Don't** use "Generic" admin blue. Stick to the signature teals to maintain the brand’s professional Fintech niche.
*   **Don't** use sharp corners. Every component must use at least the `md` (0.375rem) roundedness scale to feel modern and approachable.