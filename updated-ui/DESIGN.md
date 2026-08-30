---
name: Sentinel Oversight
colors:
  surface: '#fcf8ff'
  surface-dim: '#dbd8e4'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2fe'
  surface-container: '#efecf8'
  surface-container-high: '#e9e6f3'
  surface-container-highest: '#e4e1ed'
  on-surface: '#1b1b23'
  on-surface-variant: '#464554'
  inverse-surface: '#303038'
  inverse-on-surface: '#f2effb'
  outline: '#767586'
  outline-variant: '#c7c4d7'
  surface-tint: '#494bd6'
  primary: '#4648d4'
  on-primary: '#ffffff'
  primary-container: '#6063ee'
  on-primary-container: '#fffbff'
  inverse-primary: '#c0c1ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#825100'
  on-tertiary: '#ffffff'
  tertiary-container: '#a36700'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#fcf8ff'
  on-background: '#1b1b23'
  surface-variant: '#e4e1ed'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.02em
  metric-lg:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: -0.03em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: '1.3'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-padding: 2rem
  section-gap: 1.5rem
  element-gap: 0.75rem
  grid-gutter: 1rem
  inner-padding: 1.25rem
---

## Brand & Style

The design system for this agent is built on the principles of **Modern Corporate Precision**. It is designed for financial analysts and risk officers who require high-density data visualization without the cognitive load of traditional enterprise software.

The personality is **Vigilant, Systematic, and Transparent**. It balances a lightweight, airy aesthetic with rigorous data structures. The UI utilizes a "Soft Professional" approach—mixing the cleanliness of Minimalism with the structural reliability of SaaS platforms. By using vast white space and subtle tonal shifts, the system ensures that high-priority alerts (Mule-Patterns) stand out immediately against a calm, organized background.

## Colors

This design system uses a restricted palette to maintain professional clarity. The **Neutral Background (#F8FAFC)** serves as the canvas, while **Pure White (#FFFFFF)** surfaces denote interactive containers and content blocks.

- **Indigo (#6366F1):** Used for primary actions, navigation states, and brand presence.
- **Green (#10B981):** Represents "Clear" status, verified merchants, and positive growth.
- **Amber (#F59E0B):** Reserved for "Caution" or "Early Warning" states requiring investigation.
- **Red (#EF4444):** Exclusively for "High Risk" mule patterns and critical system errors.
- **Borders (#E2E8F0):** Thin, 1px strokes used to define container boundaries without adding visual weight.

## Typography

The system utilizes **Inter** for its neutral, highly legible character across varying densities. 

- **Scale:** High-contrast sizing is used to separate high-level metrics from granular data.
- **Metrics:** For dashboard cards, use `metric-lg` to ensure key numerical data is the first thing a user sees.
- **Hierarchy:** Headlines use semi-bold weights with slight negative letter-spacing to feel "tight" and modern. Labels are always uppercase or semi-bold to distinguish them from body copy.

## Layout & Spacing

The system follows a **Fluid Grid** model with a max-width container for desktop viewing. 

- **The 8px Rule:** All spacing increments are multiples of 8px.
- **Margins:** Global page margins are set to `2rem` (32px) to provide a "breathing" frame around the data.
- **Data Density:** While the overall layout is airy, internal card components use high-density spacing (`0.75rem`) to allow for complex merchant data comparison.
- **Breakpoints:**
  - *Desktop:* 12-column grid, 24px gutters.
  - *Tablet:* 8-column grid, 16px gutters.
  - *Mobile:* Single column, 16px margins, cards stack vertically.

## Elevation & Depth

Depth is conveyed through **Tonal Separation** rather than heavy shadows. 

- **Level 0 (Background):** #F8FAFC.
- **Level 1 (Cards/Surfaces):** #FFFFFF with a 1px #E2E8F0 border.
- **Level 2 (Dropdowns/Modals):** #FFFFFF with a subtle, highly-diffused shadow (0px 10px 15px -3px rgba(0, 0, 0, 0.05)).
- **Interactions:** Hover states on cards should not lift the element; instead, the border color should shift to #CBD5E1 (a slightly darker neutral) to maintain the flat, architectural feel.

## Shapes

The design system adopts a **Rounded** language to soften the analytical nature of the content.

- **Standard Radius:** 12px (`rounded-xl` / 0.75rem) for all primary cards, input fields, and containers.
- **Small Radius:** 6px for smaller elements like tags, chips, and nested buttons.
- **Pills:** Used exclusively for status indicators and "Active" filter states to differentiate them from functional buttons.

## Components

### Buttons & Actions
- **Primary:** Solid #6366F1 with white text, 12px corner radius.
- **Ghost:** No background, #6366F1 text, subtle border on hover.
- **Quick Actions:** Small icon-plus-text buttons with light tinted backgrounds (e.g., Light Indigo background with Indigo text).

### Metric Cards
- Should feature a large `metric-lg` value.
- Include a small sparkline or percentage indicator in the top right.
- Use a 1px border separator between the title and the primary value.

### Chips & Badges
- **Status Badges:** Pill-shaped with light background tints of the accent colors (e.g., Red-50 background for Red-600 text).
- **Project Chips:** Subtly rounded (6px) with grey borders for inactive, and primary color for active.

### Input Fields
- White background, #E2E8F0 border, 12px radius. 
- Placeholder text in #94A3B8. 
- Focus state: Border changes to #6366F1 with a 2px outer "halo" (ring).

### Data Lists
- Use horizontal dividers (#F1F5F9) rather than boxed rows to keep the vertical flow clean.
- Left-align primary identifiers (Merchant Name/ID); right-align numerical values and timestamps.