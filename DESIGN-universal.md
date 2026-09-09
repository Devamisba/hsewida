---
name: Modern Enterprise Blue (Universal Template)
colors:
  surface: '#ffffff'
  surface-dim: '#eff6ff'
  surface-bright: '#ffffff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f9fafb'
  surface-container: '#eff6ff'
  surface-container-high: '#dbeafe'
  surface-container-highest: '#bfdbfe'
  on-surface: '#111827'
  on-surface-variant: '#4b5563'
  inverse-surface: '#1f2937'
  inverse-on-surface: '#f9fafb'
  outline: '#d1d5db'
  outline-variant: '#f3f4f6'
  surface-tint: '#2563eb'
  primary: '#2563eb'
  on-primary: '#ffffff'
  primary-container: '#dbeafe'
  on-primary-container: '#1e40af'
  inverse-primary: '#93c5fd'
  secondary: '#3b82f6'
  on-secondary: '#ffffff'
  secondary-container: '#eff6ff'
  on-secondary-container: '#1d4ed8'
  tertiary: '#9333ea'
  on-tertiary: '#ffffff'
  tertiary-container: '#faf5ff'
  on-tertiary-container: '#7e22ce'
  success: '#16a34a'
  on-success: '#ffffff'
  success-container: '#dcfce7'
  on-success-container: '#166534'
  error: '#dc2626'
  on-error: '#ffffff'
  error-container: '#fee2e2'
  on-error-container: '#991b1b'
  background: '#eff6ff'
  on-background: '#111827'
  surface-variant: '#f3f4f6'
typography:
  display-lg:
    fontFamily: System UI
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg:
    fontFamily: System UI
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: System UI
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: System UI
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: System UI
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: System UI
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: System UI
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: System UI
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: System UI
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: System UI
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
rounded:
  sm: 0.375rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  container-max: 1152px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 24px
---

## How to Use This Template
This is a **portable design system**, extracted from a proven internal enterprise/dashboard app and generalized so it can be dropped into any new project (admin panels, internal tools, CMMS/field apps, dashboards) and immediately feel cohesive — without starting the design decisions from zero each time.

**To adapt it per project, only these things should change:**
1. `name:` in the frontmatter — rename to the project.
2. `primary` (and its `-container`/`on-*` pairs) — swap the hue if the project needs a different brand color; keep the *structure* (a primary + container + on-color triplet) identical.
3. Logo asset and app name in the **Iconography & Logo** section.
4. The specific page/route list in the **Navigation & Page Icons** table.

**Everything else — spacing scale, radius scale, shadow tiers, motion timing, badge system, table variants, responsive rules, canonical component specs — should stay the same across every project that uses this template.** That consistency *is* the point: someone who worked on one project should feel instantly at home in the next.

## Brand & Style
Built for **internal, data-dense operational tools** — admin panels, dashboards, field-reporting apps — where clarity, speed of cognition, and professional reliability matter more than decorative flair. The aesthetic is **Clean Corporate Blue**: functional minimalism, soft layering (white cards on a light blue canvas) instead of heavy borders, and restrained motion that makes a dense UI feel responsive rather than static.

This direction assumes the product is used for real work, often on the move — so information density and mobile usability are treated as equally important from day one, not tablet/phone as an afterthought.

## Colors
Rooted in a single **Blue** primary — every other primary-family color is a tonal step of the same hue, not a separate accent. This keeps branding coherent without needing a second "brand color" to manage.

- **Primary:** `#2563eb` for buttons, active nav, links, focus states. Hover `#1d4ed8`, pressed `#1e40af`.
- **Semantic palette:** Green = success/positive, Red = error/destructive/critical alerts, Amber/Yellow = warning/mid-range, Purple = optional tertiary accent for a secondary category that isn't a status (use sparingly — one or two spots per project, never for anything state-related).
- **Neutrals:** A gray scale for all text/borders — keeps a cool, professional temperature so it never competes with primary blue.
- **Surfaces:** Canvas sits on `blue-50`(-equivalent); cards/modals/nav are pure white. This white-on-tint contrast, not shadow depth, is the main layering cue.

**To reskin for a new project:** replace `primary`/`secondary`/`tertiary` hues, keep every other token (neutrals, semantic colors, surface structure) as-is unless the brief specifically calls for a different temperature (e.g. a warmer neutral).

## Typography
No custom webfont by default — use the **native OS font stack** (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`) for fast load and a "native app" feel. Swap in a webfont (e.g. Inter) only if a project explicitly wants a more branded, less "OS-native" feel — if you do, keep the same scale below, just change `fontFamily`.

The scale favors body sizes over display sizes — most UI in this category lives in `body-md`(14px)/`body-sm`(12px), since these are form- and table-heavy apps, not marketing sites.

**Usage:** `display-lg`/`headline-lg` for page titles and hero metrics · `body-md` as the default for nearly all UI text · `label-sm` (uppercase, tracked, semibold) for table headers, section dividers, and small metadata captions.

## Layout & Spacing
4px base unit (Tailwind default). Components should reach for `sm`(12px)/`md`(16px)/`lg`(24px) — avoid inventing one-off spacing values.

- **Card padding:** `lg` (24px) for stat cards/modal bodies, `md` (16px) for headers/toolbars.
- **Field grouping:** `sm` (12px) between related fields, `lg` (24px) between distinct sections.
- **Nav rail width:** 280px expanded / 80px collapsed is the reference size for a collapsible sidebar; adjust only if content genuinely needs more/less room.
- **Max width:** cap primary content containers around `container-max` (~1152px) so nothing over-stretches on ultrawide monitors.

## Elevation & Depth
Depth comes from **white-on-tint layering** plus soft ambient shadows — borders are a secondary hint, not the primary separator.

- **Level 0 (Background):** tinted canvas (`background` token) — the app shell.
- **Level 1 (Cards/Panels):** white, `1px` neutral border, `shadow-sm`/`shadow-md`. Sidebar, headers, stat cards, table containers.
- **Level 2 (Dropdowns/Modals):** `shadow-xl`/`shadow-2xl`, spring-in entrance (`damping: 25, stiffness: 300`), dimmed backdrop.
- **Interactive state:** cards lift on hover (`y: -5`, shadow expands); nav items/buttons get a light primary-tint hover before committing to the solid active/primary state.

## Shapes
Rounded and soft — keeps dense admin UI approachable rather than sterile.

- **Components** (inputs, standard buttons): `rounded-md`/`rounded-lg` (0.375–0.5rem).
- **Containers** (cards, modals, nav shell): `rounded-xl`/`rounded-2xl` (0.75–1rem).
- **Avatars/icon buttons:** fully rounded (`rounded-full`).

## Grid & Breakpoints
Use Tailwind's default breakpoints, `md` (768px) as the dominant one — this is where the sidebar collapses, tables fit without scrolling, and multi-column layouts begin. `sm` (640px) is for fine mobile tuning, `lg` (1024px) for wide grids, `2xl` reserved for rare ultra-wide tuning only.

| Context | Pattern |
|---|---|
| Stat card row | `grid-cols-1 md:grid-cols-3` or `lg:grid-cols-4` |
| Filter/form fields | `grid-cols-1 sm:grid-cols-2` or `md:grid-cols-2` |
| Feature/selection cards | `flex-col md:flex-row`, equal `md:w-1/2`+ |
| Calendar (if applicable) | `grid-cols-7` fixed |

**Rule:** mobile is always `grid-cols-1`/stacked; `md:` is where multi-column starts. Reserve anything denser than 4 columns for `lg:` and only for genuinely wide/dense views (e.g. a calendar grid).

## Motion Timing
Five duration tiers, used by *purpose* — pick from this list rather than inventing a new duration:

| Duration | Use case |
|---|---|
| `150ms` | Fast micro-feedback (small toolbar/filter hover) |
| `200ms` | **Default** hover/active state changes (nav items, buttons, icon buttons) |
| `300ms` | Sidebar collapse/expand, dropdown/mobile menu slide |
| `500ms` | Card/section entrance (fade-up on mount) |
| `700ms` | Full-page entrance choreography (e.g. login screen) |

- **Modal/overlay entrance:** spring (`type: "spring", damping: 25, stiffness: 300`), not duration-based — the one deliberate exception, used consistently for every modal/overlay.
- **Hover lift:** `whileHover={{ y: -5 }}` for cards, `scale: 1.05` for compact icon/nav buttons, `whileTap={{ scale: 0.98 }}` for press feedback.

## Status & Badge System
One recipe everywhere: **`px-2 py-1 rounded-full text-xs font-medium` + tinted bg/text pair.** Each semantic color maps to exactly one meaning across the whole app — never reuse a color for a different meaning in a different feature.

| Meaning | Classes |
|---|---|
| Success / Complete / Positive | `bg-green-100 text-green-800` |
| Pending / In-progress / Info | `bg-blue-100 text-blue-800` |
| Error / Overdue / Failed | `bg-red-100 text-red-800` |
| Neutral / N/A / Not yet applicable | `bg-gray-100 text-gray-500` |
| Warning / Mid-range | `bg-yellow-100 text-yellow-800` |

Reuse this exact 5-color system for any new status type a project introduces (order status, approval status, sync status, etc.) instead of inventing new colors per feature — the palette should stay closed.

## Data Tables — Two Variants
Two intentional patterns, pick based on role, not habit:

1. **Boxed Data Table** — `<thead className="bg-{primary}-50">`, `<th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">`. Use when the table **is** the page's primary content (a listing/CRUD page).
2. **Inline Report Table** — no header background, just `border-b border-gray-200`, `<th className="text-left py-3 text-sm font-medium text-gray-500">`. Use when the table is a **secondary/supporting** view nested under other content (e.g. below a calendar or stat summary).

## Iconography & Logo
One real logo asset + one icon library (e.g. `lucide-react`) — never mix multiple icon styles/weights in one project.

### Logo
- Single logo asset (PNG/SVG), reused at different sizes by context — no separate "icon-only" logo variant needed unless the brand system requires one:
  - Sidebar (expanded): ~36px, next to the app name in bold primary color.
  - Sidebar (collapsed) / mobile menu header: ~32px, logo only, centered.
  - Auth pages (login/logout): ~40px, paired with the full company/app name.
- If the project will ever run on a dark or colored background, budget for a monochrome/reversed logo variant up front — most single-PNG setups don't have one and it becomes a scramble later.

### Navigation & Page Icons
Every primary nav item and every page header gets **one dedicated icon**, consistent between desktop and mobile — this is what gives users a fast visual anchor for "where am I." Build this table per project (example shape below, fill with the project's real routes):

| Menu / Page | Icon | Notes |
|---|---|---|
| Dashboard / Home | `Home` or `Gauge` | Landing/overview page |
| Primary feature area | *(pick one distinct icon per feature)* | Reuse the same icon in sidebar nav **and** that page's header |
| Settings / Admin | `Settings` / `UserCog` | Usually restricted-access pages |
| Reports / Monitoring | `Gauge` / `BarChart` | If the project has a reporting module |

**Rule:** once an icon is assigned to a concept (e.g. `MapPin` = "location/area"), don't reuse it for an unrelated concept elsewhere in the same project — icon meaning should stay 1:1 across the whole app.

### Functional / Action Icons
Keep this set identical across every project using this template — consistency here matters more than customization:

| Action | Icon |
|---|---|
| Add / Create | `Plus` |
| Search | `Search` |
| Filter | `Filter` |
| Edit | `Edit` |
| Delete | `Trash2` |
| Save | `Save` |
| Close / Cancel | `X` |
| Back | `ArrowLeft` |
| Success / Confirm | `CheckCircle` |
| Warning / Alert | `AlertTriangle` |
| Download / Share | `Download` / `Share2` |
| Loading / Pending | `Loader` |
| Notifications | `Bell` |
| Logout | `LogOut` |

## Responsive Behavior
Treat phone/tablet as **primary usage**, not an edge case — especially for any project involving field work, camera capture, or on-the-go data entry.

### Breakpoint strategy
Use one consistent JS threshold (`window.innerWidth < 768`) that mirrors Tailwind's `md:` breakpoint, so CSS-driven and JS-driven layout switches (sidebar, header, camera UI) never disagree.

| Tier | Width | Sidebar | Grid | Table |
|---|---|---|---|---|
| Phone | `<640px` | Fullscreen drawer | `grid-cols-1` | Card list (see below) |
| Large phone / small tablet | `640–767px` | Fullscreen drawer | `sm:grid-cols-2` | Card list or scroll |
| Tablet / small laptop | `768–1023px` | Collapsible, starts collapsed | `md:grid-cols-2/3` | Table fits |
| Desktop | `≥1024px` | Collapsible, starts expanded | `lg:grid-cols-3/4` | Table fits comfortably |

### Baseline requirements (non-negotiable per project)
1. **Every data table gets a mobile card fallback** below `640px` — never ship a table that only horizontally scrolls on phone. Same data, stacked label:value card instead.
2. **Icon-only buttons are minimum `p-2.5` (≈44px tap target)** anywhere they can appear on a touch device — smaller is only acceptable for desktop-only controls.
3. **If the project captures photos on mobile**, use `<input type="file" accept="image/*" capture="environment">` to open the native camera directly instead of a generic file picker.
4. **Add a `sm:` tier to forms**, not just `md:` — a form that jumps straight from 1 column (phone) to 2 columns (768px) skips real tablet-portrait widths (~600–700px) where 2 columns would already fit.
5. **Modals are always capped** (`max-w-md`/`max-w-xl`) with outer padding (`p-4`) so they never touch screen edges on small phones.

## Components — Canonical Specs
These are the **only accepted variants** — new components should match these exactly, not whatever similar-looking component they were copy-pasted from. (This list exists because letting each page invent its own button/input padding is the single most common way a design system silently drifts — enforce this from the first page of a new project, not after the fact.)

### Primary Button
```
px-4 py-2.5 rounded-lg bg-{primary}-600 text-white text-sm font-medium
hover:bg-{primary}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-{primary}-500
shadow-sm transition-colors duration-200 flex items-center gap-2
```
Full-width variant (modal/form submit): same tokens + `w-full justify-center`.

### Secondary / Ghost Button
```
px-4 py-2.5 rounded-lg bg-gray-50 text-gray-700 text-sm font-medium
hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300
transition-colors duration-200
```

### Destructive Button
Same shape as Primary, swap `blue` → `red` throughout.

### Text Input
```
w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900
focus:outline-none focus:ring-2 focus:ring-{primary}-500 focus:border-{primary}-500
transition-all duration-200
```
Disabled/read-only fields: same shape, swap to a distinct light-tint fill (e.g. `bg-{primary}-50`) — never leave a locked field looking identical to an editable one.

### Cards
White background, `1px` neutral border, `rounded-xl`/`rounded-2xl`, `shadow-sm`/`shadow-md`, `p-6` internal padding. Hover lift (`y: -5`, deeper shadow) only if the card is actually clickable.

### Modals
Centered, dimmed backdrop (`backdrop-brightness-50`), header strip in `{primary}-50` with bold title + circular close button, spring-in entrance, `max-h-[90vh]` scrollable body.

### Status / Badges
See **Status & Badge System** above — do not define a new badge style per feature.

### Lists & Tables
Row separators via bottom border only, no vertical grid lines. Hover state on rows/pills is mandatory. Primary data in `gray-900`/`gray-800`, secondary/meta data in `gray-500`/`gray-400`.

## Consistency Checklist (apply before merging any new page)
- [ ] Buttons match one of the canonical specs above — no new padding/radius/weight combination invented.
- [ ] Inputs match the canonical spec — disabled state is visually distinct, not just `disabled` attribute with no styling change.
- [ ] Any new status type reuses the 5-color badge system — no new ad-hoc color introduced.
- [ ] Any new icon reuses an existing meaning if the concept already has one elsewhere in the app.
- [ ] Any table over ~4 columns has a mobile card fallback, not just horizontal scroll.
- [ ] Any icon-only button reachable on mobile is at least `p-2.5`.
- [ ] Spacing uses the defined scale (`xs/sm/md/lg/xl`) — no arbitrary `px-[13px]`-style one-offs.
