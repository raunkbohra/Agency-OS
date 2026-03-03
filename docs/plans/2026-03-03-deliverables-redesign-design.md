# Deliverables Page Redesign

## Summary
Redesign the deliverables page into a modern SaaS dashboard (Stripe/Vercel style) with clean layout, compact stats, unified toolbar with search, onboarding empty state, and smooth animations. List view only (no calendar/kanban).

## Current Issues
1. `DeliverableStats` rendered twice (lines 137 and 277 in DeliverablesList.tsx)
2. Mobile: stats stack as 4 full-width cards, pushing content far down
3. Filter bar is two messy rows with inconsistent grouping
4. Empty state is a plain gray box with "No deliverables."
5. No search functionality
6. No view transitions/animations

## Design

### 1. Page Header + Compact Stats Bar
- Title + "New Deliverable" CTA on same row
- Replace 4 large stat cards with a single horizontal bar of compact chips:
  `● 3 Pending  ● 1 In Review  ● 5 Done  ● 56% Complete`
- Mobile: 2x2 grid of small chips (not full-width cards)
- Remove duplicate DeliverableStats render
- Replace DeliverableStats component with new inline DeliverableStatsBar

### 2. Unified Toolbar
- Search input: filter deliverables by title (client-side)
- Status filter pills on their own row (horizontally scrollable on mobile)
- Search + Sort + Urgent + Group on second row
- Mobile: search full-width at top, status pills scroll horizontally, sort/filters below
- Bulk mode: toggleable bar appears when activated (keep existing behavior)

### 3. List View (Only View)
- Remove Calendar view and view toggle entirely
- Desktop: clean table with hover states
- Mobile: card list with status badges
- Keep grouped view option (Group by Client checkbox)

### 4. Empty State — Onboarding Guide
- 3-step horizontal guide with Lucide icons:
  1. "Add a Client" (Users icon) → links to /dashboard/clients
  2. "Create a Plan" (ClipboardList icon) → links to /dashboard/plans
  3. "Track Deliverables" (CheckCircle icon)
- Prominent CTA: "+ Create Your First Deliverable"
- Subtitle: "Or create a deliverable directly if you already have clients and plans set up."
- Mobile: steps stack vertically

### 5. Animated Transitions
- Filter changes: Framer Motion AnimatePresence, deliverable rows animate in/out
- Page load: staggered skeleton → content reveal
- Subtle timing: 150-250ms, ease-out curves

### 6. Responsive Breakpoints

| Breakpoint | Stats | Toolbar | Content |
|---|---|---|---|
| Mobile (<640px) | 2x2 chip grid | Search full-width, pills scroll, filters row below | Card list |
| Tablet (640-1024px) | Inline bar | Full toolbar | Table |
| Desktop (>1024px) | Inline bar | Full toolbar | Table |

## Files to Modify
- `components/DeliverablesList.tsx` — main rewrite (remove duplicate stats, add search, remove calendar/view toggle, add animations)
- `components/DeliverableStats.tsx` — replace with compact DeliverableStatsBar
- `components/DeliverableGroupedList.tsx` — minor responsive fixes
- Remove `DeliverableCalendar` import/usage from DeliverablesList

## Files to NOT Touch
- `app/dashboard/deliverables/page.tsx` — server component, no changes needed
- `app/dashboard/deliverables/[id]/page.tsx` — detail page, out of scope
- `components/DeliverableDetail.tsx` — detail view, out of scope
- API routes — no backend changes needed
