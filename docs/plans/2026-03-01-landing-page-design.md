# Agency OS Landing Page Design

## Context

Agency OS has a solid dark-first design system (Resend-inspired pure black palette, Framer Motion animations, glass morphism) but the home page is a placeholder — two lines of centered text. The goal is to build a world-class Linear.app-inspired landing page that sells Agency OS to agency owners.

## Architecture

### Route Group Separation

```
app/
  (marketing)/
    layout.tsx          # Landing-specific layout: floating nav + footer
    page.tsx            # Assembles all section components
  dashboard/
    layout.tsx          # Existing sidebar layout (unchanged)
```

The `(marketing)` route group gives the landing page its own nav/footer without affecting the dashboard layout.

### Component Structure

```
components/landing/
  navbar.tsx            # Floating glass nav bar (appears on scroll)
  hero.tsx              # Hero with gradient text + dashboard mockup
  features-grid.tsx     # 6-card bento grid
  workflow.tsx          # "How it works" 3-step visual
  metrics-showcase.tsx  # Animated number social proof
  pricing.tsx           # 3 pricing tiers
  cta-section.tsx       # Final CTA banner
  footer.tsx            # Minimal footer
```

All components are client components (need scroll/animation hooks) except footer (server component).

---

## Section Designs

### 1. Navbar

- **Behavior:** Floating, fixed at top. Transparent initially, gains `backdrop-blur-xl bg-glass-bg border-b border-glass-border` after scrolling past hero.
- **Content:** Logo (left) + "Sign In" button (right, `Button variant="secondary" size="sm"`).
- **Mobile:** Same — logo + sign in. No hamburger menu needed (single page).
- **Z-index:** 50 to float above all content.

### 2. Hero

- **Layout:** `min-h-screen` centered, `bg-dot-grid` background with radial blue glow behind headline.
- **Content stack (centered, max-w-4xl):**
  1. **Badge pill** — "Built for modern agencies" with shimmer animation, `text-xs uppercase tracking-wide`
  2. **Headline** — `text-5xl md:text-7xl font-bold tracking-[-0.04em]`:
     - Line 1: "Run your agency" (white)
     - Line 2: "from one system" (`gradient-text-subtle` — white-to-gray)
  3. **Subheadline** — `text-lg md:text-xl text-text-secondary max-w-xl mx-auto`
  4. **CTA row** — Primary "Get Started" (`Button variant="primary" size="lg"` → `/auth/signin`) + Secondary "See how it works" (`Button variant="secondary" size="lg"` → `#features` smooth scroll)
  5. **Dashboard mockup** — Browser-frame div with fake dashboard content. `perspective(1000px) rotateX(2deg)` tilt. Glass border, `bg-bg-secondary` inner. Shows a miniature version of the dashboard with metric cards and table rows.

- **Animations:**
  - Badge: `opacity 0→1, y 10→0`, delay 0.1s
  - Headline lines: stagger 0.1s, 0.2s
  - Subheadline: delay 0.3s
  - CTAs: delay 0.4s
  - Mockup: delay 0.6s, `y 40→0`, parallax on scroll

### 3. Features Grid (Bento)

- **Section header:** "Everything you need" `text-4xl font-bold` + subtitle `text-text-secondary`
- **Grid layout (bento):**
  ```
  Row 1: [Plans & Pricing — col-span-2, row-span-2] [Invoices — col-span-1]
                                                      [Contracts — col-span-1]
  Row 2: [Clients — col-span-1] [Deliverables — col-span-2]
  Row 3: [Metrics Dashboard — col-span-3, full-width]
  ```
- **Each card:**
  - `bg-bg-secondary border border-border-default rounded-xl p-6`
  - Hover: `border-border-hover`, `-translate-y-px`, `HoverCardGlow` radial glow
  - Icon (Lucide) + title (`text-lg font-semibold`) + description (`text-sm text-text-secondary`)
  - Bottom area: mini UI mockup (styled divs mimicking the actual feature UI)
- **Animation:** `ScrollStagger` with `staggerChildren: 0.06`

### 4. How It Works (Workflow)

- **Layout:** 3 columns with connecting gradient lines between them.
- **Each step:**
  - Large circled number (48px, `border-2 border-accent-blue rounded-full`)
  - Title: `text-xl font-semibold`
  - Description: `text-sm text-text-secondary`
- **Steps:** (1) Create a Plan → (2) Add Clients → (3) Get Paid
- **Connecting lines:** Horizontal gradient line (`border-default` → `accent-blue`) between circles.
- **Animation:** `ScrollReveal direction="left"` with staggered delays (0s, 0.15s, 0.3s). Lines animate width 0→100%.
- **Mobile:** Stack vertically with vertical connecting lines.

### 5. Metrics Showcase

- **Layout:** Full-width glass card (`bg-glass-bg backdrop-blur-xl border border-glass-border`) with `bg-aurora` overlay.
- **Content:** 4 metrics in a row:
  - "100%" — Automated
  - "5 min" — Setup Time
  - "Unlimited" — Clients
  - "$0" — To Start
- **Each metric:** `AnimatedNumber` (existing component) at `text-4xl md:text-5xl font-bold`. Label below in `text-xs uppercase tracking-wide text-text-tertiary`.
- **Animation:** Numbers count up when section enters viewport via `ScrollReveal`.

### 6. Pricing

- **Layout:** 3 cards side by side, center card elevated.
- **Tiers:**
  - **Free:** $0/mo — 3 clients, 1 plan, basic invoicing. Secondary CTA.
  - **Pro:** $29/mo — Unlimited clients, unlimited plans, contracts, deliverables, metrics. Primary CTA with glow. `animated-border` (rotating gradient). "Most Popular" badge.
  - **Enterprise:** Custom — Everything in Pro + priority support, custom integrations. Secondary CTA "Contact Us".
- **Card design:** `bg-bg-secondary border border-border-default rounded-xl p-8`. Pro card gets `border-accent-blue/30` instead.
- **Feature list:** Checkmark icons (`text-accent-green`) + feature text. Missing features in Free tier get `text-text-quaternary line-through`.
- **Animation:** `ScrollStagger` for the 3 cards.

### 7. Final CTA

- **Layout:** `py-24` section, centered content.
- **Headline:** "Ready to streamline your agency?" with `gradient-text-subtle`.
- **Subtext:** Single line `text-text-secondary`.
- **Button:** Large "Get Started" primary button wrapped in `MagneticHover`. Glow shadow.
- **Background:** Radial gradient glow (accent-blue, 5% opacity) centered behind button.

### 8. Footer

- **Layout:** 3-column grid above a `border-t border-border-default` separator.
  - Col 1: Logo + tagline `text-text-tertiary text-sm`
  - Col 2: "Product" links — Features, Pricing, Dashboard
  - Col 3: "Company" links — About, GitHub, Contact
- **Bottom row:** `text-text-quaternary text-xs` — "© 2026 Agency OS. All rights reserved."
- **Server component** — no client-side JS needed.

---

## Design Tokens Used

All existing tokens from the design system — no new CSS variables needed:
- Backgrounds: `bg-primary`, `bg-secondary`, `bg-tertiary`
- Text: `text-primary`, `text-secondary`, `text-tertiary`, `text-quaternary`
- Borders: `border-default`, `border-hover`
- Accents: `accent-blue`, `accent-green`
- Glass: `glass-bg`, `glass-border`
- Utilities: `bg-dot-grid`, `bg-aurora`, `gradient-text-subtle`, `animated-border`

## Motion Components Used

All existing — no new motion components needed:
- `ScrollReveal` — hero visual, workflow steps
- `ScrollStagger` + `ScrollStaggerItem` — features grid, pricing cards
- `MagneticHover` — final CTA button
- `HoverCardGlow` — feature cards
- `PressScale` — CTA buttons
- `StaggerChildren` + `StaggerItem` — hero content stack (above-the-fold, not scroll-triggered)

## Responsive Strategy

- **Desktop (lg+):** Full bento grid, horizontal workflow, 3-col pricing.
- **Tablet (md):** 2-col bento fallback, horizontal workflow, 3-col pricing (tighter).
- **Mobile (sm):** Single column everything. Workflow stacks vertically. Pricing stacks. Hero text scales to `text-4xl`. Dashboard mockup scales proportionally.

## Performance

- Server-rendered layout and footer.
- Client components only where needed (scroll animations, navbar scroll detection).
- No external images — all visuals are CSS/Tailwind (dot grids, gradients, styled divs).
- Dashboard mockup is pure HTML/CSS, not a screenshot image.
