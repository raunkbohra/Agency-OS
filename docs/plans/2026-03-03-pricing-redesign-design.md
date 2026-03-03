# Pricing Redesign Design

## Problem
The pricing section uses a completely different design language from the rest of the site: Playfair Display serif font, Tailwind blue-500 colors, raw inline styles, CSS keyframe animations instead of Framer Motion, and no section badge pills. It needs to be rebuilt from scratch to match the site's design system.

## Decision
- Homepage (`/#pricing`): Three-card layout (Free / Basic / Pro) with visual impact
- Dedicated page (`/pricing`): Comparison table for detailed feature breakdown
- Shared hook and toggle component extracted for both views

## Homepage Pricing (Three-Card)

**Component**: `components/landing/pricing.tsx` (rewrite)

### Structure
1. Section badge pill ("Pricing") + Plus Jakarta Sans heading + subtitle
2. Monthly/Yearly billing toggle with "Save ~20%" badge
3. Three cards: Free / Basic / Pro in `grid-cols-1 md:grid-cols-3`
4. "All plans include" footer row

### Card Design
- Background: `var(--landing-card-bg)` + `backdrop-filter: blur(10px)`
- Border: `var(--landing-card-border)`, Pro gets `rgba(107,126,147,0.4)` glow
- Border radius: `rounded-2xl`
- Pro card: "Most Popular" badge pill in steel-blue
- Animations: `ScrollStagger` + `ScrollStaggerItem`
- CTA: `SparkleButton` for Pro, secondary button for Free/Basic

### Tiers
- **Free**: 3 clients, 5 plans, 1 team member, Basic invoicing
- **Basic**: 15 clients, 50 plans, 5 team members, Invoicing, Basic reporting
- **Pro**: Unlimited everything, Contracts, Advanced reporting, API access, Priority support

### Colors
All steel-blue palette: `#6b7e93`, `#8fa0b0`, `#c4d0d8`. No `rgba(59, 130, 246, ...)`.

## /pricing Page (Comparison Table)

**Component**: `components/landing/pricing-table.tsx` (new)

### Structure
1. Page header section with title + subtitle
2. Monthly/Yearly toggle (shared component)
3. Full-width comparison table

### Table Design
- Header row: tier name + price + CTA per column
- Sticky header on scroll
- Feature groups: Limits, Core Features, Advanced, Support
- Checkmarks: `#6b7e93` steel-blue, X marks: `var(--text-quaternary)`
- Subtle alternating row backgrounds
- Background: `var(--landing-card-bg)`, borders: `var(--landing-card-border)`

### Mobile
Collapses to card-per-tier view (not a table) on small screens.

## Shared Infrastructure

- **`hooks/use-pricing.ts`**: Location detection, price maps, currency logic
- **`components/landing/billing-toggle.tsx`**: Monthly/yearly toggle pill
- Remove Playfair Display import entirely

## Files to Create/Modify
1. `hooks/use-pricing.ts` — new shared hook
2. `components/landing/billing-toggle.tsx` — new shared toggle
3. `components/landing/pricing.tsx` — full rewrite (three-card)
4. `components/landing/pricing-table.tsx` — new (comparison table)
5. `app/(marketing)/pricing/page.tsx` — use pricing-table component
