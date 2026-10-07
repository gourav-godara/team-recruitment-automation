---
name: Neo-Memphis Pop-Studio
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#6d5e00'
  on-secondary: '#ffffff'
  secondary-container: '#fcdf46'
  on-secondary-container: '#726200'
  tertiary: '#ad0033'
  on-tertiary: '#ffffff'
  tertiary-container: '#d22348'
  on-tertiary-container: '#ffecec'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#ffe24c'
  secondary-fixed-dim: '#e2c62d'
  on-secondary-fixed: '#211b00'
  on-secondary-fixed-variant: '#524600'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 44px
    fontWeight: '800'
    lineHeight: 52px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.04em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '800'
    lineHeight: 14px
    letterSpacing: 0.06em
  tabular-score:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-sm: 0.75rem
  gutter-lg: 1.75rem
  margin: 2rem
  margin-mobile: 1rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system embodies a balanced Neo-Memphis aesthetic engineered specifically for high-velocity hackathon curation, judging pipelines, and application scoring. It fuses the energetic, tactile spirit of retro-modern pop art with the disciplined precision of an enterprise review console. 

The emotional signature is electric, decisive, and celebratory:
- **Audience:** Hackathon organizers, venture scouts, developer relations leads, and technical evaluators managing thousands of project submissions under tight deadlines.
- **Visual Stance:** Playful yet uncompromised rigor. High-contrast solid outlines, tactile extruded drop shadows, and vivid electric accents inject joy into dense triage workflows without sacrificing density or legibility.
- **Tone:** Kinetic, tactile, authoritative, and celebratory. Organizing events should feel like operating an interactive synthesizer rather than auditing a spreadsheet.

## Colors

The palette leverages pure light canvas foundations anchored by structural deep ink borders and charged with high-saturation primary and secondary accents.

### Palette Architecture
- **Primary (`#2563EB` / Electric Cobalt):** Core interactive focus, primary actions, selected navigation items, and high-priority metrics. Paired with hover state `#1D4ED8`.
- **Secondary (`#FDE047` / Canary Yellow):** Warning cues, standout spotlight callouts, active filters, and highlight badges. Paired with deep ink text for extreme legibility.
- **Tertiary (`#F43F5E` / Bubblegum Coral):** Disqualifications, critical alerts, rejection triggers, and high-urgency notifications.
- **Neutral (`#0F172A` / Deep Ink Slate):** Primary text, heavy structural borders (2px to 2.5px), and solid unblurred hard drop shadows.
- **Surface Foundations:** Primary cards rest on crisp `#FFFFFF`, while page viewports use `#F8FAFC` layered with subtle 16px geometric dot matrix or graph grid patterns.
- **Auxiliary Accents:** Mint/Emerald (`#10B981`) for submissions locked and validated; Vibrant Violet (`#8B5CF6`) for specialized tracks and track winners; Amber (`#F59E0B`) for judging score deviations.

## Typography

The typography pairs the expressive, geometric personality of Plus Jakarta Sans for displays, headings, and micro-labels with the neutral, hyper-legible utility of Inter for dense tabular figures, evaluation notes, and system body copy.

- **Headlines:** Display scales prioritize high impact with heavy weights (700 and 800) and tight letter spacing to evoke poster and magazine layouts.
- **Labels & Micro-Tags:** Rendered in bold, uppercase Plus Jakarta Sans with deliberate positive tracking (`+0.04em` to `+0.06em`) to anchor sticker pills and status indicators.
- **Data & Numeric Displays:** Set using `font-variant-numeric: tabular-nums` in Inter to ensure column alignment across judging leaderboards, submission tallies, and percentile matrices.

## Layout & Spacing

Layouts follow an adaptable 12-column modular grid anchored to an 8px base rhythm.

### Grid & Responsive Scaling
- **Desktop (1280px+):** 12 columns, 28px (`gutter-lg`) gutters, 48px (`margin-desktop`) margins. Workspaces organize into bento dashboard panels, sticky triage toolbars, and split-screen submission inspection drawers.
- **Tablet (768px - 1279px):** 8 columns, 20px (`gutter`) gutters, 32px (`margin`) margins. Dual-column bento modules stack into single/split configurations.
- **Mobile (<768px):** 4 columns, 12px (`gutter-sm`) gutters, 16px (`margin-mobile`) margins. Filter rails collapse into full-width bottom sheets with persistent review triggers.

### Spacing Philosophy
Compact micro-spacing (`space-xs`, `space-sm`) packs tags, rating stars, and badges closely together inside tabular rows. Structural container spacing (`space-lg`, `space-xl`) isolates discrete bento cards, providing breathing room against heavy border strokes and hard drop shadows.

## Elevation & Depth

This design system avoids soft, atmospheric blur-based drop shadows in favor of crisp, tactile Neo-Memphis hard edge offsets. Depth represents physical tactile mechanics:

- **Level 0 (Flat / Inactive):** Pure 2px solid `#0F172A` border with zero drop shadow. Used for inset inputs, inactive table rows, and disabled components.
- **Level 1 (Resting Cards & Bento Cells):** 2px solid `#0F172A` border with `3px 3px 0px #0F172A`. Creates immediate structural separation over the `#F8FAFC` grid surface.
- **Level 2 (Interactive Buttons, Chips & Floating Badges):** 2px solid `#0F172A` border with `4px 4px 0px #0F172A`.
- **Level 3 (Modals, Slide-overs & Sticky Controls):** 2.5px solid `#0F172A` border with `6px 6px 0px #0F172A`.
- **Active / Pressed State:** All Level 1 and Level 2 tactile components collapse their shadow on click: `transform: translate(2px, 2px)` with shadow reduced to `1px 1px 0px #0F172A` or `0px 0px 0px #0F172A`, delivering instant mechanical feedback.

## Shapes

The shape system employs roundedness level `2`:
- **Standard Controls & Cards:** Base radius of `0.5rem` (`8px`), expanding to `1rem` (`16px`) on bento cards and review containers, and `1.5rem` (`24px`) on overarching modal layouts.
- **Stickers & Micro-Tags:** High-visibility status indicators, pill buttons, filter toggles, and avatar frames use full-capsule pill borders (`9999px`) while retaining the rigid 2px solid dark stroke.
- **Corner Balance:** Curvature softens high-density numeric tables while preserving the punchy edge geometry demanded by the Neo-Memphis direction.

## Components

### Buttons
- **Primary Action:** Background `#2563EB`, text `#FFFFFF`, 2px solid `#0F172A` border, `4px 4px 0px #0F172A` hard shadow. `label-lg` uppercase typography. Active state translates `+2px, +2px` with shadow reduced to `1px 1px 0px`.
- **Secondary Spotlight:** Background `#FDE047`, text `#0F172A`, 2px solid `#0F172A` border, `4px 4px 0px #0F172A` hard shadow.
- **Destructive Action:** Background `#F43F5E`, text `#FFFFFF`, 2px solid border, `4px 4px 0px #0F172A` hard shadow.

### Status Pills & Sticker Chips
- Fully rounded pill geometry (`rounded-full`) with 2px solid `#0F172A` border and `2px 2px 0px #0F172A` shadow.
- **Preset Variants:**
  - `LOCKED IN`: Emerald background (`#10B981`), white text.
  - `BUBBLE ALERT`: Canary yellow background (`#FDE047`), deep ink text (`#0F172A`).
  - `HARD DISQUALIFIED`: Bubblegum coral background (`#F43F5E`), white text.
  - `404 HUNTER`: Violet background (`#8B5CF6`), white text.
  - `100% READY`: Electric cobalt background (`#2563EB`), white text.

### Bento Cards
- Crisp white (`#FFFFFF`) surfaces framed with 2px solid `#0F172A` borders and `rounded-lg` (16px) corners.
- Cast `3px 3px 0px #0F172A` resting shadows. Top header bands can feature optional inverted contrast strips or subtle pastel background fills to delineate judging criteria and track divisions.

### Input Fields & Search Bars
- Background `#FFFFFF`, 2px solid `#0F172A`, `rounded-md` (8px). 
- Inner padding: `0.75rem 1rem`.
- Focus state does not produce soft outer glows; it introduces a high-contrast accent outline: `box-shadow: 3px 3px 0px #2563EB`.

### Checkboxes & Radio Buttons
- 2px solid `#0F172A` border, 4px corner radius for checkboxes, full circle for radios.
- Unchecked: `#FFFFFF` fill with `2px 2px 0px #0F172A` offset shadow.
- Checked: `#2563EB` fill with a sharp white checkmark or center pip; shadow maintained for tactile pop.

### Tables & Leaderboard Matrices
- Table containers bounded by 2px solid `#0F172A` and `rounded-lg`.
- Header row styled in `#0F172A` with `#FFFFFF` text in `label-md`.
- Alternating subtle row striping using `#F8FAFC` and `#FFFFFF`. Row hover applies a canary yellow tint (`#FEF08A`) with an active 2px outline highlight.
- Score values rendered with tabular numerals and accompanied by inline delta indicator pills.