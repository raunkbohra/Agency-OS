# Deliverables Tracking Enhancements — Design Document

**Date:** March 2, 2026
**Scope:** 9 enhancements across 3 phases
**Status:** Approved

---

## Overview

Enhance the deliverables tracking system with visibility tools, bulk operations, and client collaboration features. Delivered in 3 phases:
- **Phase 1:** Visibility & filtering (stats, urgent filter, sorting)
- **Phase 2:** Bulk operations & organization (grouping, bulk updates, calendar)
- **Phase 3:** Collaboration & external access (client portal, notifications)

---

## Phase 1 — Visibility & Filtering (Foundation)

### Goal
Agencies see what's pending/done at a glance and can quickly find urgent work.

### Components & Changes

#### 1. DeliverableStats Widget (New)
- **Location:** Top of `/dashboard/deliverables` page
- **Display:**
  - Pending count (draft + in_review + changes_requested)
  - In Review count
  - Done count
  - Overall completion % (Done / Total × 100)
- **Styling:** Color-coded boxes matching status colors
- **Data:** Aggregated from existing deliverables list, no DB changes

#### 2. Enhanced DeliverablesList Filtering

**Current state:**
- 6 status filter pills (all, draft, in_review, approved, changes_requested, done)
- No sorting options

**New features:**
- "Urgent" filter button — deliverables due within 7 days from today
- Sort dropdown with options:
  - By Due Date (ASC) — earliest first (default)
  - By Due Date (DESC) — latest first
  - By Client (A-Z)
  - By Status
- Filters + sorts compose (e.g., "Show Urgent, sorted by due date")
- Mobile-friendly: sort dropdown, urgent filter on same row as status pills

**Backend changes:**
- Update `/api/deliverables` GET to accept query params:
  - `?urgent=true` — filter to due within 7 days
  - `?sort=due_date|due_date_desc|client|status` — sort results
  - Works with existing status filter

#### 3. Page Header Stats
- Integrate `DeliverableStats` widget into `PageHeader` component
- Quick glance at top of page: "12 Pending · 3 In Review · 45 Done (78% Complete)"
- Styling: subtle boxes or badges, matches existing header design

### Data Flow
1. DeliverablesList fetches `/api/deliverables?status=all&urgent=false&sort=due_date`
2. Backend returns filtered, sorted array
3. DeliverableStats component aggregates counts from list
4. User toggles filter/sort → refetch with new params

### Testing
- Verify counts match filtered list
- Verify urgent filter shows only items due within 7 days
- Verify sorts order correctly (due date, client name)
- Test on mobile (filters responsive)

---

## Phase 2 — Bulk Operations & Organization

### Goal
Agencies batch-update deliverables and see work organized by client.

### Components & Changes

#### 1. Group By Client Toggle

**New toggle button:** "Group by Client" on/off (next to search/filter area)

**When ON:**
- DeliverableGroupedList component renders instead of flat list
- Deliverables grouped by `client_name`, collapsible sections
- Each group shows summary: "Acme Corp (3 Pending, 1 In Review, 2 Done, 60% Complete)"
- Click section to collapse/expand

**When OFF:**
- Flat list (current behavior)

**Mobile:** Toggle collapses automatically for readability; clients expand on demand

#### 2. Bulk Select & Actions

**New UI elements:**
- Checkbox on each row (desktop table) and card (mobile)
- "Select All" checkbox in table header
- Action bar appears when ≥1 item selected:
  - Shows count: "3 items selected"
  - Dropdown: "Change Status to: [Draft / In Review / Approved / Changes Requested / Done]"
  - "Deselect All" button

**Backend:**
- New endpoint: `PATCH /api/deliverables/bulk`
- Body: `{ ids: [id1, id2, ...], status: "done" }`
- Response: `{ updated: number, errors: [] }`
- Single transaction: all succeed or all fail

**Mobile:** Checkboxes on cards, action bar sticks to bottom

#### 3. Monthly Snapshot / Calendar View

**New tab/toggle:** "Calendar" view on deliverables page (alongside "List" view)

**Display:**
- Grid: Months (columns) × Statuses (rows)
- Cells show: count + % complete (e.g., "12 items, 75% Done")
- Current month highlighted
- Shows current year (Jan-Dec)
- Click month → filters list to that month
- Click status row → filters list to that status

**Example:**
```
          January    February   March    April
Draft        2         0         1        3
In Review    1         2         3        1
Approved     3         5         8        2
Changes Req  0         1         2        0
Done        15        18        45       22
% Complete  77%       81%       91%      78%
```

**Data:** Aggregated from deliverables, grouped by month_year + status

### Data Flow
1. DeliverablesList renders togglable GroupedList or FlatList based on state
2. Bulk update: POST to `/api/deliverables/bulk` with IDs + status
3. Calendar: Query aggregates deliverables by month + status, renders grid
4. All filters/sorts apply to grouped view too

### Testing
- Grouping collapses/expands correctly
- Bulk update updates all selected items in DB
- Calendar shows accurate counts per month/status
- Filters work with grouping on

---

## Phase 3 — Collaboration & External Access

### Goal
Clients see deliverable status in real-time; agencies get notifications when revision requested.

### Components & Changes

#### 1. Client Portal (Read-Only)

**New route:** `/client-portal/[token]` (public, no login required)

**Architecture:**
- Token stored in `clients` table: `portal_token` (varchar, nullable, unique)
- Generate token on client creation (random 32-char string)
- Verify token exists and matches client on request

**Display:**
- Client company name in header
- List of client's deliverables (filtered by `client_id`)
- Columns: Title, Status, Due Date, Month
- Status badges with colors (same color scheme as admin)
- File section: show uploaded files with download links (or view-only?)
- Comments section: read-only thread of all comments + revision requests
- "Powered by Agency OS" footer

**Permissions:**
- View deliverables for their client only
- View files (download or view in browser?)
- View comments (read-only)
- Cannot: change status, upload files, add comments, export

**Mobile:** Responsive card layout, same as dashboard

#### 2. Revision Request Notifications

**Trigger:**
- Agency posts comment on deliverable
- Checks "Revision Request" checkbox
- System sends email to client

**Email:**
- **To:** Client's email address (from `clients.email`)
- **Subject:** "Revision Request: [Deliverable Title] - [Agency Name]"
- **Body:**
  - Deliverable title, current status
  - Revision request summary (first 100 chars of comment)
  - Link to client portal: `https://[domain]/client-portal/[token]`
  - CTA button: "View Deliverable" (blue gradient)
- **Template:** Light theme (white card on #f6f7f9 background), matches existing email style
- **From:** Agency's email address (from agency settings)

**Database (optional):**
- New table `deliverable_notifications` (audit trail):
  - id, deliverable_id, client_id, notification_type, email_sent_at, created_at
  - Use for: tracking sent notifications, resend functionality (future)

**Implementation:**
- Email sent via existing email infrastructure (cron/queue)
- No in-app notifications required (email is enough)

#### 3. Modifications to Existing Components

**DeliverableDetail page:**
- When posting comment with "Revision Request" checked:
  - Trigger email send
  - Show toast: "Revision request sent to client"

**API: POST `/api/deliverables/[id]/comments`**
- Accept `isRevisionRequest: boolean`
- If true: call email function to notify client
- Optionally log to `deliverable_notifications` table

### Data Flow
1. Client receives portal link (email when revision requested)
2. Client visits `/client-portal/[token]` → token validated → client's deliverables loaded
3. Client sees status, files, comments (read-only)
4. Agency posts comment + revision request → email triggers → client gets notification

### Testing
- Portal access: valid token works, invalid token 404s
- Email sends on revision request with correct data
- Client portal shows only client's deliverables
- Comments thread visible in portal
- Download links work (if files are real URLs)

---

## Database Schema Changes (Minimal)

### Clients Table
Add (optional, nullable):
```sql
ALTER TABLE clients ADD COLUMN portal_token VARCHAR(255) UNIQUE;
```

### Deliverable Notifications Table (Optional)
```sql
CREATE TABLE deliverable_notifications (
  id UUID PRIMARY KEY,
  deliverable_id UUID NOT NULL REFERENCES deliverables(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  notification_type VARCHAR(50), -- 'revision_request'
  email_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## File Structure

**Components (new):**
- `components/DeliverableStats.tsx` — stats widget
- `components/DeliverableGroupedList.tsx` — grouped list by client
- `components/ClientPortal.tsx` — read-only portal view
- `components/DeliverableNotificationEmail.tsx` — email template

**Pages (new):**
- `app/client-portal/[token]/page.tsx` — portal landing

**Pages (modified):**
- `app/dashboard/deliverables/page.tsx` — add stats, grouping toggle, calendar view
- `app/dashboard/deliverables/[id]/page.tsx` — integrate with notification system

**API Routes (new):**
- `app/api/deliverables/bulk/route.ts` — bulk status update
- `app/api/client-portal/[token]/route.ts` — fetch client-visible deliverables

**API Routes (modified):**
- `app/api/deliverables/route.ts` — add filtering, sorting, urgent
- `app/api/deliverables/[id]/comments/route.ts` — trigger notifications

**Utilities (new/modified):**
- `lib/send-deliverable-notification.ts` — email sender
- `lib/db-queries.ts` — add queries for bulk updates, calendar data

---

## Implementation Order

1. **Phase 1** (stats, filters, sorts)
   - Update `/api/deliverables` with filtering logic
   - Build DeliverableStats component
   - Update DeliverablesList with sort dropdown + urgent filter
   - Integrate stats into PageHeader

2. **Phase 2** (grouping, bulk, calendar)
   - Build DeliverableGroupedList component
   - Create `/api/deliverables/bulk` endpoint
   - Build calendar grid view
   - Add toggle between views

3. **Phase 3** (portal, notifications)
   - Add `portal_token` to clients table
   - Build ClientPortal component
   - Create `/api/client-portal/[token]` endpoint
   - Build email notification logic
   - Update comment flow to trigger emails

---

## Success Criteria

- ✅ Agencies see completion % at a glance
- ✅ Urgent deliverables (due <7 days) found in one click
- ✅ Bulk update 10+ items in <5 seconds
- ✅ Client sees their deliverables in real-time via portal
- ✅ Revision requests email client with actionable link
- ✅ All views responsive (mobile, tablet, desktop)
- ✅ No breaking changes to existing deliverables flow

---

## Open Questions / Decisions

1. **Client portal download:** Allow file downloads or view-in-browser only?
2. **Calendar view:** Show current year only or allow year selector?
3. **Grouping default:** Start with grouped or flat list by default?
4. **Portal token regeneration:** Allow clients to regenerate tokens? (future)
5. **Notifications table:** Include for audit trail or skip for simplicity?

---

## Timeline

- Phase 1: ~2-3 hours (filters, stats are straightforward)
- Phase 2: ~2-3 hours (grouping, bulk, calendar queries)
- Phase 3: ~2 hours (portal, email integration)
- **Total:** ~6-8 hours of focused implementation

---

**Approved:** Yes
**Date Approved:** March 2, 2026
