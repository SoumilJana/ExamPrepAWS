# CloudPrep Design System & Visual Specification

<!-- impeccable:design-schema 1 -->

## 1. Visual World & Character

- **Mode:** Operate (High-focus assessment, rigorous study console)
- **Aesthetic:** Minimalist, high-density, technical precision. Calm dark surfaces with high legibility and zero decorative distraction.
- **Atmosphere:** Feels like an official, distraction-free AWS examination console elevated with modern web craftsmanship—purposeful typography, tabular alignment, crisp 1px borders, and measured color accents.

## 2. Color System & Semantic Tokens

All values strictly preserve the requested dark palette and accessibility contrast (WCAG 2.1 AA):

### Base & Surface Grayscale
- `--bg-canvas`: `#111318` (Primary background, deepest canvas)
- `--bg-surface`: `#191D24` (Standard cards, top bar, question panes)
- `--bg-surface-elevated`: `#222833` (Dropdowns, modals, hover states, active questions)
- `--bg-surface-hover`: `#262E3B` (Interactive row / button hover)
- `--border-subtle`: `#252B35` (Secondary separators, subtle borders)
- `--border-base`: `#303744` (Default component and card borders)
- `--border-active`: `#4A5568` (Selected input state, active card focus)

### Text & Icon Tokens
- `--text-primary`: `#F1F3F5` (Headings, question stems, primary labels — contrast ratio > 12:1)
- `--text-secondary`: `#A0A8B5` (Metadata, domain tags, timestamps, secondary labels)
- `--text-muted`: `#687182` (Placeholders, disabled controls, question IDs)
- `--text-accent`: `#7C9CFF` (Interactive links, active states)

### Functional & Semantic Accents
- `--accent-primary`: `#7C9CFF` (Primary actions, selection highlights, active step)
- `--accent-primary-hover`: `#92ACFF`
- `--accent-subtle`: `rgba(124, 156, 255, 0.12)` (Pill backgrounds, active radio fill)
- `--status-success`: `#45B881` (Correct answers, score >= 75%, passed status)
- `--status-success-subtle`: `rgba(69, 184, 129, 0.12)`
- `--status-warning`: `#E5AD55` (Flagged for review, timer < 15 min, borderline score)
- `--status-warning-subtle`: `rgba(229, 173, 85, 0.12)`
- `--status-error`: `#E47777` (Incorrect answers, failed status, destructive actions)
- `--status-error-subtle`: `rgba(228, 119, 119, 0.12)`

### AWS CLF-C02 Domain Color Accents (Subtle Badges)
- **Domain 1 (Cloud Concepts - 24%):** `#60A5FA` (Sky Blue)
- **Domain 2 (Security and Compliance - 30%):** `#F87171` (Crimson / Shield Red)
- **Domain 3 (Cloud Technology and Services - 34%):** `#A78BFA` (Purple / Compute)
- **Domain 4 (Billing, Pricing and Support - 12%):** `#34D399` (Emerald / Cost)

## 3. Typography Hierarchy

- **Font Family:** `Inter`, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- **Code / Monospace / Numbers:** `JetBrains Mono`, `SFMono-Regular`, Menlo, monospace with `font-variant-numeric: tabular-nums` for timers and scores.

### Scale:
- `Display / Page Title`: 24px (1.5rem), Semibold (600), Line height 1.25, tracking -0.015em
- `Section Header`: 18px (1.125rem), Medium (500), Line height 1.35
- `Question Stem`: 16px (1.0rem), Regular (400) to Medium (500), Line height 1.55 (optimized for long-reading retention)
- `Answer Option Label`: 14px (0.875rem), Regular (400), Line height 1.45
- `Body / Descriptions`: 14px (0.875rem), Regular (400), Line height 1.5
- `Caption / Metadata`: 12px (0.75rem), Regular (400) to Medium (500), Line height 1.4
- `Timer & Counters`: 18px - 22px, Bold (700), `tabular-nums`

## 4. Spacing, Elevation & Shapes

- **Base Radius:** 6px (Standard controls, pills, answer blocks); 8px (Cards and modal dialogs).
- **Elevation / Shadows:** Restrained to subtle drop shadows for floating modals: `0 8px 24px rgba(0, 0, 0, 0.45)`.
- **Card Spacing:** 16px padding on mobile, 24px padding on desktop.
- **Layout Max-Width:** 1280px for general views; 1440px for full exam simulator desktop layout.

## 5. Component Standards

1. **Option Selection Tile (Radio & Checkbox):**
   - Resting: `#191D24` background, 1px border `#303744`, text `#F1F3F5`.
   - Hover: `#222833` background, border `#4A5568`.
   - Selected: `#191D24` background with `border: 1px solid #7C9CFF`, glowing key letter badge (`#7C9CFF` fill or border).
   - Review Correct: `#191D24` background, `border: 1px solid #45B881`, light green accent tint.
   - Review Incorrect: `#191D24` background, `border: 1px solid #E47777`, red accent tint.

2. **Exam Question Navigator Grid Tile (1 to 65):**
   - Size: 34px × 34px square with 4px border-radius.
   - States:
     - `Unanswered`: Border `#303744`, text `#A0A8B5`, bg transparent.
     - `Answered`: Bg `#222833`, border `#7C9CFF`, text `#F1F3F5`.
     - `Current`: Bold white border `#F1F3F5`, ring `2px #7C9CFF`.
     - `Marked for Review`: Top-right diagonal badge or warning dot in `#E5AD55`.
     - `Answered + Flagged`: Combined filled surface with warning flag corner indicator.

3. **Timer Pill:**
   - Fixed top-right in exam header.
   - Normal (> 15 min remaining): `#222833` bg, border `#303744`, text `#F1F3F5`.
   - Caution (5 - 15 min remaining): border `#E5AD55`, text `#E5AD55`.
   - Urgent (< 5 min remaining): border `#E47777`, text `#E47777`, subtle 1s pulse on clock icon.
