# Phase 4+: Automation + Integrations Design

**Date:** March 1, 2026
**Version:** 1.0
**Status:** Approved for Implementation

---

## Executive Summary

Phase 4+ adds **operational intelligence** to Agency OS: automated reminders keep clients engaged, auto-escalation reduces manual overhead, bulk CSV import speeds onboarding, and integrations (Discord, Google Calendar) connect Agency OS to the tools agencies already use daily.

**Goal:** Automate routine tasks and integrate with team communication/scheduling tools to reduce manual work and improve client engagement.

**Timeline:** 3 weeks sequential (Weeks 11-13)

**Tech Stack:** PostgreSQL job queue (`pg-boss`) + Vercel Crons + Postgres event logging

**Approach:** Balanced—clean architecture, reasonable effort, Vercel-native, extensible for future integrations

---

## Architecture Overview

### Job Processing Flow

```
Trigger (Vercel Cron or API)
  ↓
Vercel Function: /api/jobs/process
  ↓
pg-boss queue (Postgres tables)
  ↓
Job handler (reminders, escalation, import)
  ↓
Integration handler (Discord, Calendar)
  ↓
Event logged + Result stored
```

### Event-Driven Triggering

```
State change (invoice created, scope alert triggered, etc)
  ↓
Event recorded in events table
  ↓
Daily Cron: /api/jobs/process (runs at 2 AM UTC)
  ↓
For each agency, fetch pending events since last run
  ↓
Create jobs for handlers (reminders, escalations, integrations)
  ↓
Handlers execute:
  - Fetch config from integration_configs table
  - Call Discord webhook / Google Calendar API
  - Log result to integration_events table
  ↓
Next Cron cycle processes failures
```

### Key Components

- **pg-boss:** PostgreSQL-based job queue (lightweight, no Redis needed)
- **Vercel Cron:** Daily trigger at `/api/jobs/process`
- **Postgres tables:** job queue state, configuration, event logs
- **Integration handlers:** Modular functions for each integration
- **Credential storage:** Encrypted at rest, decrypted only when needed

---

## Automation Features

### 1. Email Reminders

**What triggers:**
- Invoice payment due in 3 days → email to client
- Invoice overdue (1, 3, 7 days) → escalating emails to agency
- Deliverable due in 2 days → email to client
- Scope alert created → email to agency

**Configuration:** Per-agency reminder settings (type, days before, enabled/disabled)

**Duplicate Prevention:** Track sent reminders to prevent duplicate emails same day

**Default Settings:**
- Invoice due 3 days before → client email
- Invoice overdue 1 day → agency email
- Invoice overdue 7 days → escalation email to agency
- Deliverable due 2 days → client email
- Scope alert triggered → agency email immediately

---

### 2. Auto-Escalation

**What happens:**
- Invoice > 7 days overdue → auto-mark as `escalated` (status field)
- Scope alert > 30 days active → auto-mark as `critical` (status field)

**Configuration:** Thresholds customizable per agency

**Default Thresholds:**
- Invoice escalation: 7 days overdue
- Scope critical: 30 days active

---

### 3. Bulk CSV Import

**What it supports:**
- Import clients (name, email, contact person)
- Import plans (client, deliverables, price, billing cycle)
- Import invoices (client, amount, due date, description)

**Flow:**
1. Agency uploads CSV file to `/dashboard/bulk-import`
2. System validates headers and sample rows
3. Job created to process import asynchronously
4. Job processes rows in batches (100 per batch)
5. Logs successes and errors per row
6. Sends summary email when complete

**Error Handling:**
- Invalid rows logged (row number, error reason)
- Successful rows still processed
- Summary email lists success count and failure details
- Agency can download error log CSV

---

## Integrations

### Discord Integration

**What it sends:**
- Scope alerts: "⚠️ Client XYZ is 75% over capacity (7 of 4 videos)"
- Invoice alerts: "💰 Invoice #123 overdue by 3 days - $5,000"
- Escalations: "🔴 Invoice #456 escalated - 10 days overdue"
- Payment received: "✅ Payment received for invoice #789 - $3,200"

**Configuration:**
- Agency provides Discord webhook URL
- Select which alert types to send (checkboxes)
- Test connection before saving

**Frequency:** Real-time when events occur during Cron cycle (batched daily)

---

### Google Calendar Integration

**What it syncs:**
- Deliverable due dates → Agency calendar
- Invoice due dates → Agency calendar
- Client payment deadlines → Agency calendar

**Configuration:**
- OAuth "Connect Google Calendar" flow
- Select which calendar to sync to
- Select which object types to sync (deliverables, invoices, deadlines)

**Frequency:** Real-time on object creation/update during Cron cycle

**Calendar Event Details:**
- Title: "[Type]: [Object Title]"
- Start/End: Due date (all-day event)
- Description: Object details (description, amount, etc)

---

## Data Model

### New Tables

```sql
-- Reminder settings per agency
CREATE TABLE reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
    -- 'invoice_due_soon', 'invoice_overdue', 'deliverable_due', 'scope_alert'
  days_before INT,  -- e.g., 3 for "3 days before"
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Track sent reminders (prevent duplicates)
CREATE TABLE sent_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id),
  deliverable_id UUID REFERENCES deliverables(id),
  reminder_type TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agency_id, invoice_id, deliverable_id, reminder_type)
);

-- Auto-escalation rules
CREATE TABLE escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL,  -- 'invoice_overdue', 'scope_critical'
  threshold_days INT,
  action TEXT NOT NULL,  -- 'mark_escalated'
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Bulk import tracking
CREATE TABLE bulk_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT,
  import_type TEXT NOT NULL,  -- 'clients', 'plans', 'invoices'
  total_rows INT,
  processed_rows INT DEFAULT 0,
  status TEXT DEFAULT 'pending',  -- pending, in_progress, completed, failed
  error_log JSONB,  -- array of {row_num: N, error: "reason"}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Integration configuration (credentials + settings)
CREATE TABLE integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,  -- 'discord', 'calendar'
  config JSONB NOT NULL,  -- encrypted credentials & settings
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agency_id, provider)
);

-- Integration event log (audit trail)
CREATE TABLE integration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  event_type TEXT,  -- 'sent', 'synced', 'failed'
  object_type TEXT,  -- 'invoice', 'deliverable', 'scope_alert'
  object_id UUID,
  status TEXT,  -- 'success', 'failed'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reminder_settings_agency ON reminder_settings(agency_id);
CREATE INDEX idx_sent_reminders_agency ON sent_reminders(agency_id);
CREATE INDEX idx_escalation_rules_agency ON escalation_rules(agency_id);
CREATE INDEX idx_bulk_imports_agency ON bulk_imports(agency_id);
CREATE INDEX idx_integration_configs_agency ON integration_configs(agency_id);
CREATE INDEX idx_integration_events_agency ON integration_events(agency_id);
```

---

## Pages & Components

### Agency Settings

**`/dashboard/settings/reminders`** - Email reminder configuration
- List all reminder types (invoice due soon, overdue, deliverable due, scope alert)
- For each type: toggle enabled/disabled, set days before
- Test send button to preview email

**`/dashboard/settings/escalations`** - Auto-escalation rules
- Invoice overdue threshold (editable, default 7 days)
- Scope alert critical threshold (editable, default 30 days)
- Toggle on/off

**`/dashboard/settings/integrations/discord`** - Discord setup
- Paste webhook URL input
- Checkboxes: select which alert types to send
- Test connection button
- Current status (connected/not connected)
- Disconnect button

**`/dashboard/settings/integrations/calendar`** - Google Calendar setup
- OAuth "Connect Google Calendar" button
- When connected: show calendar selector
- Checkboxes: select which object types to sync (deliverables, invoices)
- Current status (connected/not connected)
- Disconnect button

**`/dashboard/bulk-import`** - Bulk CSV import
- File upload input
- Dropdown: select import type (clients, plans, invoices)
- Preview first 5 rows of uploaded CSV
- Import button (queues job)
- List of past imports (status, success count, failure count, date)
- Click on past import to view error log

### API Endpoints

```
Settings - Reminders:
GET    /api/settings/reminders              → List all reminders
POST   /api/settings/reminders              → Create or update reminder
DELETE /api/settings/reminders/[id]        → Delete reminder
POST   /api/settings/reminders/test         → Send test email

Settings - Escalations:
GET    /api/settings/escalations            → List all rules
POST   /api/settings/escalations            → Create or update rule
DELETE /api/settings/escalations/[id]      → Delete rule

Settings - Integrations:
GET    /api/settings/integrations           → List all configs
GET    /api/settings/integrations/[provider] → Get config
POST   /api/settings/integrations/[provider] → Save config
DELETE /api/settings/integrations/[id]      → Remove config
POST   /api/settings/integrations/[provider]/test → Test connection
GET    /api/settings/integrations/[provider]/oauth/callback → OAuth callback

Bulk Import:
POST   /api/bulk-import                     → Upload and queue import
GET    /api/bulk-import                     → List imports
GET    /api/bulk-import/[id]                → Get import detail
GET    /api/bulk-import/[id]/errors/download → Download error log CSV

Jobs:
POST   /api/jobs/process                    → Process job queue (Vercel Cron calls)
GET    /api/jobs/status                     → Get queue status
```

---

## Error Handling & Reliability

**Integration Failures:**
- Discord webhook down → log error to `integration_events`, retry next Cron cycle
- Calendar API rate limited → wait and retry next cycle
- Invalid config → send agency alert email with instructions to fix

**CSV Import Failures:**
- Invalid row → log with row number and reason, continue processing
- Duplicate entry → skip with note in error log
- All rows processed even if some fail

**Retry Logic:**
- Failed integration calls → automatic retry next Cron cycle (no manual intervention)
- Max 3 retry attempts per event before marking as permanently failed
- Exponential backoff (1 min, 5 min, 15 min)

**Monitoring:**
- `integration_events` table tracks all integration activity
- Dashboard widget: "Integration Health" (last sync time, recent errors)
- Admin email alerts for critical failures (3+ consecutive failures)

---

## Testing Strategy

**Automation - Unit Tests:**
- Reminder calculation (which invoices due in X days)
- Escalation thresholds (invoice > 7 days = escalated)
- CSV parsing (valid/invalid rows, duplicate detection)

**Automation - Integration Tests:**
- Mock pg-boss job queue
- Verify handlers called with correct parameters
- Verify database state updated correctly

**Automation - E2E Tests:**
- Create test invoice, verify reminder sent
- Mark invoice as overdue, verify escalation triggered
- Upload CSV, verify all rows imported

**Integrations - Unit Tests:**
- Message formatting (Discord alert text)
- OAuth token refresh
- Calendar event formatting

**Integrations - Integration Tests:**
- Mock Discord/Calendar APIs
- Verify correct payloads sent to APIs
- Verify config stored/retrieved correctly

**Integrations - E2E Tests:**
- Connect real Discord test webhook
- Verify message appears in Discord channel
- Connect real Google Calendar (test account)
- Verify event appears in calendar

---

## Success Metrics

- All reminders delivered on time (100% of invoice due dates)
- Escalation rules working (100% of overdue invoices > threshold marked escalated)
- CSV bulk import success rate > 99% (rows processed correctly)
- Discord alerts delivered reliably (99%+ webhook success)
- Google Calendar sync working (events appear within 1 hour)
- Test coverage > 80% for business logic
- No integration-related support tickets from founding agencies

---

## Post-Launch: Phase 4++ Ideas

Once Phase 4+ complete, consider:

**Phase 4++A: More Integrations**
- Slack (team notifications)
- WhatsApp (client reminders)
- Email templates (custom branding)
- Webhook events (agencies can build custom integrations)

**Phase 4++B: Advanced Automation**
- Conditional logic (if X then Y)
- Multi-step workflows (when invoice paid, auto-mark deliverables done)
- Recurring jobs (run task every X days)

**Phase 4++C: Reporting**
- Export reminders sent (audit log)
- Bulk import history with detailed reports
- Integration usage analytics (Discord messages sent, Calendar syncs)

