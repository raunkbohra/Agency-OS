# UI/UX Overhaul Design: Linear-Inspired Dark-First Agency OS

**Date:** March 1, 2026
**Version:** 1.0
**Status:** Approved for Implementation

---

## Executive Summary

Complete UI/UX overhaul of Agency OS from functional-but-basic to world-class Linear/Vercel-inspired dark-first aesthetic. Covers design system foundation, microanimation catalog, component library (shadcn/ui customized), and full sweep of all 19 pages.

**Goal:** Transform Agency OS into a visually premium, animation-rich, dark-first agency management platform that feels as polished as Linear, Vercel, or Raycast.

**Approach:** Core shell first (design tokens + sidebar + shared components), then full page sweep. Dark-first with light mode toggle.

**Tech:** Tailwind CSS 4, Framer Motion, shadcn/ui (Radix primitives), Inter font, CSS variables for theming.

---

## Design System Foundation

### Color Palette (Dark-First)

```
Background layers (dark — default):
  --bg-primary:    #0A0A0B    (app background)
  --bg-secondary:  #111113    (card/panel background)
  --bg-tertiary:   #1A1A1D    (elevated surfaces, hover states)
  --bg-hover:      #222225    (interactive hover)

Background layers (light):
  --bg-primary:    #FFFFFF
  --bg-secondary:  #FAFAFA
  --bg-tertiary:   #F4F4F5
  --bg-hover:      #EBEBED

Borders:
  --border-default:  rgba(255,255,255,0.06)   (subtle dividers)
  --border-hover:    rgba(255,255,255,0.12)   (interactive borders)
  --border-active:   rgba(255,255,255,0.20)   (focused states)

Text:
  --text-primary:    #EDEDEF   (headings, primary content)
  --text-secondary:  #8B8B8E   (descriptions, labels)
  --text-tertiary:   #5C5C5F   (placeholders, disabled)

Accent (minimal — used sparingly):
  --accent-blue:     #5B7FFF   (primary actions, links)
  --accent-purple:   #8B5CF6   (highlights, badges)
  --accent-green:    #34D399   (success, paid, approved)
  --accent-amber:    #FBBF24   (warnings, in review)
  --accent-red:      #EF4444   (errors, overdue)

Glass effects:
  --glass-bg:        rgba(255,255,255,0.03)
  --glass-border:    rgba(255,255,255,0.06)
  --glass-blur:      blur(20px)
```

### Typography

```
Font: Inter (variable weight) — self-hosted via @fontsource/inter

Scale:
  xs:    12px / 16px  (badges, captions)
  sm:    13px / 18px  (secondary text, table cells)
  base:  14px / 20px  (body text — Linear uses 14px base)
  md:    15px / 22px  (emphasized body)
  lg:    18px / 26px  (section headers)
  xl:    22px / 30px  (page titles)
  2xl:   28px / 36px  (hero numbers, metrics)

Weight:
  normal: 400  (body)
  medium: 500  (labels, nav items)
  semibold: 600 (headings, buttons)

Letter spacing:
  tight: -0.02em  (headings)
  normal: 0       (body)
  wide: 0.04em    (uppercase labels, badges)
```

### Spacing & Layout

```
Sidebar: 240px fixed width
Content: fluid, max-w-6xl centered
Page padding: 32px (desktop), 16px (mobile)
Card padding: 20px
Card radius: 12px
Button radius: 8px
Input radius: 8px
Gap between cards: 16px
Section gap: 32px
```

---

## Microanimations & Transitions

### Global Motion Tokens

```
Timing:
  --duration-fast:    120ms   (hover states, toggles)
  --duration-normal:  200ms   (page transitions, modals)
  --duration-slow:    350ms   (layout shifts, charts)

Easing:
  --ease-out:    cubic-bezier(0.16, 1, 0.3, 1)     (elements entering)
  --ease-in:     cubic-bezier(0.55, 0, 1, 0.45)     (elements exiting)
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)  (bouncy interactions)
```

### Microanimation Catalog

**Page transitions:**
- Content fades in + slides up 8px on route change (Framer Motion AnimatePresence)
- Staggered children: each card/row enters 30ms after the previous

**Hover states:**
- Cards: border brightens 0.06 → 0.12 opacity, subtle translateY(-1px)
- Buttons: background lightens, scale(1.01), 120ms ease-out
- Table rows: background shifts to --bg-hover, 100ms
- Nav items: text color shifts secondary → primary, left accent bar slides in

**Click feedback:**
- Buttons: scale(0.98) on press → scale(1) on release (spring physics)
- Cards: subtle scale(0.995) press effect

**Status transitions:**
- Badge color changes: crossfade 200ms
- Status dot: pulse animation (green=active, amber=pending)
- Progress bars: animated width with ease-out, number counter ticks up

**Loading states:**
- Skeleton screens: shimmer gradient sweep (left to right, 1.5s loop)
- Buttons: spinner replaces text, width maintained to prevent layout shift
- Page: content skeleton matches layout shape

**Toast notifications:**
- Slide in from top-right, 8px translate
- Auto-dismiss with shrinking progress bar at bottom
- Exit: fade out + slide up

**Modals/Dialogs:**
- Backdrop: fade in 200ms (bg opacity 0 → 0.5)
- Dialog: scale(0.95) → scale(1) + fade in, spring easing
- Exit: reverse with ease-in

**Sidebar navigation:**
- Active item: background slides (layout animation) instead of instant switch
- Collapse/expand: smooth width animation 300ms
- Hover: item background fades in 120ms

**Data visualizations (Metrics page):**
- Charts animate in: bars/lines draw from 0, 500ms staggered
- Metric cards: numbers count up from 0 to value on mount
- Tooltip follows cursor with 60fps tracking

---

## Component Library (shadcn/ui Customized)

### Components to Generate and Customize

**shadcn/ui components needed:**
- button, card, badge, input, table
- dialog, dropdown-menu, select, tabs
- tooltip, toast, skeleton, separator
- avatar, popover, command, switch

### Custom Component Variants

**Button** — 4 variants:
- `primary`: solid accent-blue background, white text
- `secondary`: transparent, border-default, text-secondary → text-primary on hover
- `ghost`: no border, text-secondary, bg-hover on hover
- `danger`: transparent, red text, red bg on hover
- All: 8px radius, 120ms hover, scale press effect, loading spinner state

**Card** — Glass morphism base:
- bg-secondary background, border-default border (1px), 12px radius
- Hover: border brightens, translateY(-1px)
- Variants: default, interactive (clickable), highlighted (accent border-left)

**Badge** — Status indicators:
- Pill shape (full radius), uppercase, 11px, wide letter-spacing
- Colors: green (paid/done), amber (pending/review), red (overdue), gray (draft), purple (escalated)
- Style: colored text on transparent bg with colored border

**Input** — Form fields:
- bg-tertiary background, border-default border
- Focus: border → accent-blue, subtle blue glow (box-shadow)
- 8px radius, 14px text
- Error: red border + red glow + error message below with fade-in

**Table** — Data display:
- Header: text-tertiary, uppercase, 11px, wide tracking
- Body rows: border-default bottom border, hover → bg-hover
- Sortable headers: chevron icon rotates on sort
- Selected row: subtle accent-blue left border

### Custom Components (Not shadcn)

**Sidebar** — App navigation:
- Fixed 240px, bg-primary background
- Logo at top
- Nav groups with subtle uppercase labels
- Active item: bg-tertiary with layout animation
- Hover: bg-hover fade in
- Bottom: user avatar + settings gear
- Mobile: overlay with backdrop blur

**Page Header** — Consistent page tops:
- Title (xl size), optional subtitle (text-secondary)
- Breadcrumbs above
- Action buttons right-aligned

**Metric Card** — Dashboard stats:
- Glass card with large animated number
- Label below, trend indicator (up/down arrow with color)
- Subtle gradient accent for emphasis

**Status Badge** — Unified status display:
- Maps status strings to colors consistently across all pages
- Pulse dot for active/live states

**Empty State** — When no data:
- Centered illustration placeholder
- Descriptive text + CTA button
- Fade in animation

**Animated Number** — Counter:
- Counts from 0 to target on mount
- Uses Framer Motion useMotionValue
- Configurable duration and format (currency, percentage, integer)

**Loading Skeleton** — Page placeholders:
- Shimmer gradient animation
- Matches layout shape of actual content
- Configurable rows, cards, or custom shapes

---

## Page-by-Page Overhaul Spec

### Layout Shell (all pages)

Replace current top Navigation with sidebar layout:
- Left: 240px fixed sidebar with nav items, logo, user
- Right: fluid content area with breadcrumbs at top
- Mobile: sidebar collapses to hamburger overlay with backdrop blur
- Page transitions: AnimatePresence wraps route content

### Auth / Sign In

- Centered glass card on dark background
- Subtle ambient gradient or noise texture behind card
- Input focus glow animations
- Sign-in button with loading spinner
- Error messages fade in below inputs

### Dashboard Home (`/dashboard`)

- Hero metrics row: 4 glass cards (MRR, Active Clients, Completion %, Open Invoices)
- Numbers animate up from 0 on mount
- Quick actions grid: "New Client", "Create Invoice", "View Deliverables"
- Recent activity feed: timeline with dots and connecting line
- All cards stagger in on page load (30ms offset each)

### Clients List (`/dashboard/clients`)

- Grid of client cards with avatar/initials circle, name, plan badge
- Hover: card elevates, border brightens
- Search bar with instant filter
- "New Client" button top-right with plus icon
- Empty state: illustration + CTA

### Client Detail (`/dashboard/clients/[id]`)

- Header: large client name, status badge, edit button
- Tabs (Radix): Overview | Deliverables | Invoices | Contracts
- Tab content crossfade animation on switch

### Plans List (`/dashboard/plans`)

- Card grid showing plan name, price, deliverable count
- Hover elevation effect
- "New Plan" CTA button

### Plan Detail (`/dashboard/plans/[id]`)

- Plan overview card with deliverable items listed
- Edit form with smooth validation states

### Invoices List (`/dashboard/invoices`)

- Table view with sortable columns (amount, due date, status)
- Status badges (color-coded pills)
- Hover rows highlight
- Filter bar: status dropdown, date range, search
- Row click expands detail or navigates

### Invoice Detail (`/dashboard/invoices/[id]`)

- Clean invoice preview card (styled like real invoice)
- Payment methods section with provider icons
- Status timeline: Created → Sent → Paid (with dates)
- Action buttons: Mark as Paid, Send Reminder, Download PDF

### Payment Page (`/dashboard/invoices/[id]/pay`)

- Clean payment form on glass card
- Bank transfer instructions in info card
- File upload area with dashed border
- Success state: checkmark animation + confetti-free celebration

### Deliverables List (`/dashboard/deliverables`)

- Table or card view toggle
- Status badges with pulse dots
- Filter by client, month, status
- Stagger-in animation for cards

### Deliverable Detail (`/dashboard/deliverables/[id]`)

- Status workflow visualized as stepper (Draft → Review → Approved → Done)
- File upload section
- Comments thread with timestamps
- Action buttons for status transitions

### Contracts List (`/dashboard/contracts`)

- Card grid showing contract status
- Signed: green checkmark + date
- Pending: amber clock + "Awaiting signature"
- Upload card with dashed border drag-and-drop zone

### Contract Upload (`/dashboard/contracts/upload`)

- Drag-and-drop zone with animated dashed border
- File preview after selection
- Client/plan selectors
- Upload progress bar

### Metrics (`/dashboard/metrics`)

- Metric cards with animated count-up numbers
- Charts with animated draw-in (line/bar)
- Time range selector: 30d / 90d / 1y
- Risk matrix scatter plot
- Export button

### Payment Settings (`/dashboard/settings/payments`)

- Integration cards per provider
- Connected: green dot + "Connected" label
- Disconnected: gray + "Connect" button
- Credential input forms with masked fields
- Test connection button with loading state

### Client Portal (`/portal/[clientToken]/deliverables`)

- Clean, minimal view for clients
- Read-only deliverable cards
- Approve / Request Changes buttons
- Status badges match agency-side styling

---

## Technical Implementation

### Dependencies to Add

```
framer-motion        — microanimations, layout, page transitions (~30KB)
@fontsource/inter    — Inter font self-hosted (no FOUT)
```

### shadcn/ui Components to Generate

```bash
npx shadcn@latest add button card badge input table
npx shadcn@latest add dialog dropdown-menu select tabs
npx shadcn@latest add tooltip toast skeleton separator
npx shadcn@latest add avatar popover command switch
```

### File Structure

```
components/
  ui/              ← shadcn/ui base (customized for dark-first)
    button.tsx
    card.tsx
    badge.tsx
    input.tsx
    table.tsx
    dialog.tsx
    dropdown-menu.tsx
    select.tsx
    tabs.tsx
    tooltip.tsx
    toast.tsx
    skeleton.tsx
    separator.tsx
    avatar.tsx
    popover.tsx
    switch.tsx
  layout/          ← app shell
    sidebar.tsx
    sidebar-nav-item.tsx
    breadcrumbs.tsx
    page-header.tsx
    mobile-nav.tsx
  shared/          ← reusable patterns
    status-badge.tsx
    metric-card.tsx
    empty-state.tsx
    loading-skeleton.tsx
    animated-number.tsx
    glass-card.tsx
  motion/          ← animation wrappers
    page-transition.tsx
    stagger-children.tsx
    fade-in.tsx
    press-scale.tsx
```

### Tailwind Config Changes

Extend tailwind.config.ts with:
- Full dark-first color token system
- Custom font-family (Inter)
- Custom border-radius presets
- Custom animation timing tokens
- Custom shadow presets (subtle, glass)

### globals.css Changes

- All color tokens as CSS custom properties
- Dark class as default, .light class for light mode
- Custom scrollbar styling (thin, matching theme)
- Selection highlight color
- Focus-visible ring styling

---

## Success Metrics

- Every page matches Linear-level polish
- Lighthouse accessibility score > 95
- No layout shift on page transitions
- Animations run at 60fps
- Dark/light mode toggle works on every page
- Mobile responsive on all pages (no horizontal scroll)
- Consistent component usage (no inline one-off styles)
