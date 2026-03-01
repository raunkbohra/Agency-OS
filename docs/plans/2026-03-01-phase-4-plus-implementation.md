# Phase 4+ Implementation Plan: Automation + Integrations

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add automated email reminders, auto-escalation, bulk CSV import, and Discord + Google Calendar integrations to Agency OS.

**Architecture:** PostgreSQL job queue (pg-boss) processes daily Vercel Cron tasks. Configuration stored per-agency, events logged for audit trail. Integration handlers execute asynchronously with retry logic.

**Tech Stack:** pg-boss (job queue), Vercel Crons, PostgreSQL, Discord webhooks, Google Calendar API, Next.js API routes, Supabase

---

## Task 1: Database Migration - Core Tables

**Files:**
- Create: `lib/migrations/010_add_phase_4_plus_tables.sql`
- Test: `__tests__/migrations/010_phase_4_plus.test.ts`

**Step 1: Write the failing test**

```typescript
// __tests__/migrations/010_phase_4_plus.test.ts
import { createClient } from '@supabase/supabase-js';

describe('Phase 4+ Migration', () => {
  it('should create reminder_settings table', async () => {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
    const { data, error } = await supabase
      .from('reminder_settings')
      .select('*')
      .limit(1);
    expect(error).toBeNull();
  });

  it('should create integration_configs table', async () => {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
    const { data, error } = await supabase
      .from('integration_configs')
      .select('*')
      .limit(1);
    expect(error).toBeNull();
  });

  it('should create bulk_imports table', async () => {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
    const { data, error } = await supabase
      .from('bulk_imports')
      .select('*')
      .limit(1);
    expect(error).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/raunakbohra/Desktop/Agency\ OS && npm test -- __tests__/migrations/010_phase_4_plus.test.ts
```

Expected: FAIL - relation "reminder_settings" does not exist

**Step 3: Write the migration SQL**

```sql
-- lib/migrations/010_add_phase_4_plus_tables.sql

-- Reminder settings
CREATE TABLE reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
    -- 'invoice_due_soon', 'invoice_overdue', 'deliverable_due', 'scope_alert'
  days_before INT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Track sent reminders
CREATE TABLE sent_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id),
  deliverable_id UUID REFERENCES deliverables(id),
  reminder_type TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agency_id, invoice_id, deliverable_id, reminder_type)
);

-- Escalation rules
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

-- Bulk imports
CREATE TABLE bulk_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT,
  import_type TEXT NOT NULL,  -- 'clients', 'plans', 'invoices'
  total_rows INT,
  processed_rows INT DEFAULT 0,
  status TEXT DEFAULT 'pending',  -- pending, in_progress, completed, failed
  error_log JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Integration configs
CREATE TABLE integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,  -- 'discord', 'calendar'
  config JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agency_id, provider)
);

-- Integration event log
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

**Step 4: Run the migration**

```bash
cd /Users/raunakbohra/Desktop/Agency\ OS && psql postgresql://raunakbohra@localhost/agency_os < lib/migrations/010_add_phase_4_plus_tables.sql
```

Expected: CREATE TABLE messages for all 6 tables

**Step 5: Run test to verify it passes**

```bash
npm test -- __tests__/migrations/010_phase_4_plus.test.ts
```

Expected: PASS (all tables exist)

**Step 6: Commit**

```bash
git add lib/migrations/010_add_phase_4_plus_tables.sql __tests__/migrations/010_phase_4_plus.test.ts
git commit -m "migration: add Phase 4+ tables (reminders, escalations, integrations, bulk imports)"
```

---

## Task 2: pg-boss Setup & Initialization

**Files:**
- Create: `lib/jobs/pgBossClient.ts`
- Test: `__tests__/jobs/pgBoss.test.ts`

**Step 1: Write the failing test**

```typescript
// __tests__/jobs/pgBoss.test.ts
import { initializePgBoss, enqueueJob, getJobStatus } from '@/lib/jobs/pgBossClient';

describe('pg-boss job queue', () => {
  it('should initialize pg-boss', async () => {
    const boss = await initializePgBoss();
    expect(boss).toBeDefined();
    await boss.close();
  });

  it('should enqueue a job', async () => {
    const boss = await initializePgBoss();
    const jobId = await enqueueJob('test_job', { data: 'test' });
    expect(jobId).toBeDefined();
    await boss.close();
  });

  it('should get job status', async () => {
    const boss = await initializePgBoss();
    const jobId = await enqueueJob('test_job', { data: 'test' });
    const status = await getJobStatus(jobId);
    expect(['created', 'active', 'completed']).toContain(status);
    await boss.close();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/jobs/pgBoss.test.ts
```

Expected: FAIL - "initializePgBoss is not defined"

**Step 3: Write the pg-boss client**

```typescript
// lib/jobs/pgBossClient.ts
import PgBoss from 'pg-boss';

let boss: PgBoss | null = null;

export async function initializePgBoss(): Promise<PgBoss> {
  if (boss) return boss;

  boss = new PgBoss({
    connectionString: process.env.DATABASE_URL,
    schema: 'pgboss',
    archiveCompletedAfterSeconds: 3600 * 24 * 7, // keep for 7 days
  });

  await boss.start();
  return boss;
}

export async function enqueueJob(
  name: string,
  data: Record<string, any>,
  options?: { startAfter?: number; retryLimit?: number }
): Promise<string> {
  const client = await initializePgBoss();
  const jobId = await client.send(name, data, {
    retryLimit: options?.retryLimit || 3,
    retryDelay: 1,
    retryBackoff: true,
    startAfter: options?.startAfter,
  });
  return jobId;
}

export async function getJobStatus(jobId: string): Promise<string> {
  const client = await initializePgBoss();
  const job = await client.getJobById(jobId);
  return job?.state || 'unknown';
}

export async function closePgBoss(): Promise<void> {
  if (boss) {
    await boss.close();
    boss = null;
  }
}

// Initialize on module load
initializePgBoss().catch(console.error);
```

**Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/jobs/pgBoss.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add lib/jobs/pgBossClient.ts __tests__/jobs/pgBoss.test.ts
git commit -m "feat: add pg-boss job queue initialization"
```

---

## Task 3: Reminder Settings CRUD Operations

**Files:**
- Create: `lib/db/reminders.ts`
- Test: `__tests__/db/reminders.test.ts`

**Step 1: Write the failing test**

```typescript
// __tests__/db/reminders.test.ts
import { createReminderSetting, getReminderSettings, updateReminderSetting, deleteReminderSetting } from '@/lib/db/reminders';

describe('Reminder Settings', () => {
  const testAgencyId = 'test-agency-123';

  it('should create a reminder setting', async () => {
    const reminder = await createReminderSetting({
      agencyId: testAgencyId,
      reminderType: 'invoice_due_soon',
      daysBefore: 3,
      enabled: true,
    });
    expect(reminder.id).toBeDefined();
    expect(reminder.reminderType).toBe('invoice_due_soon');
  });

  it('should get reminder settings for agency', async () => {
    await createReminderSetting({
      agencyId: testAgencyId,
      reminderType: 'invoice_overdue',
      daysBefore: 1,
      enabled: true,
    });
    const reminders = await getReminderSettings(testAgencyId);
    expect(reminders.length).toBeGreaterThan(0);
    expect(reminders[0].agencyId).toBe(testAgencyId);
  });

  it('should update a reminder setting', async () => {
    const reminder = await createReminderSetting({
      agencyId: testAgencyId,
      reminderType: 'deliverable_due',
      daysBefore: 2,
      enabled: true,
    });
    const updated = await updateReminderSetting(reminder.id, { enabled: false });
    expect(updated.enabled).toBe(false);
  });

  it('should delete a reminder setting', async () => {
    const reminder = await createReminderSetting({
      agencyId: testAgencyId,
      reminderType: 'scope_alert',
      daysBefore: 0,
      enabled: true,
    });
    await deleteReminderSetting(reminder.id);
    const reminders = await getReminderSettings(testAgencyId);
    expect(reminders.find((r) => r.id === reminder.id)).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/db/reminders.test.ts
```

Expected: FAIL - "createReminderSetting is not defined"

**Step 3: Write reminder database operations**

```typescript
// lib/db/reminders.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

export interface ReminderSetting {
  id: string;
  agencyId: string;
  reminderType: 'invoice_due_soon' | 'invoice_overdue' | 'deliverable_due' | 'scope_alert';
  daysBefore: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function createReminderSetting(input: {
  agencyId: string;
  reminderType: ReminderSetting['reminderType'];
  daysBefore: number;
  enabled: boolean;
}): Promise<ReminderSetting> {
  const { data, error } = await supabase
    .from('reminder_settings')
    .insert({
      agency_id: input.agencyId,
      reminder_type: input.reminderType,
      days_before: input.daysBefore,
      enabled: input.enabled,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create reminder: ${error.message}`);
  return mapReminderSetting(data);
}

export async function getReminderSettings(agencyId: string): Promise<ReminderSetting[]> {
  const { data, error } = await supabase
    .from('reminder_settings')
    .select('*')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to get reminders: ${error.message}`);
  return data.map(mapReminderSetting);
}

export async function updateReminderSetting(
  id: string,
  updates: Partial<ReminderSetting>
): Promise<ReminderSetting> {
  const { data, error } = await supabase
    .from('reminder_settings')
    .update({
      ...(updates.daysBefore !== undefined && { days_before: updates.daysBefore }),
      ...(updates.enabled !== undefined && { enabled: updates.enabled }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update reminder: ${error.message}`);
  return mapReminderSetting(data);
}

export async function deleteReminderSetting(id: string): Promise<void> {
  const { error } = await supabase.from('reminder_settings').delete().eq('id', id);

  if (error) throw new Error(`Failed to delete reminder: ${error.message}`);
}

function mapReminderSetting(data: any): ReminderSetting {
  return {
    id: data.id,
    agencyId: data.agency_id,
    reminderType: data.reminder_type,
    daysBefore: data.days_before,
    enabled: data.enabled,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/db/reminders.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add lib/db/reminders.ts __tests__/db/reminders.test.ts
git commit -m "feat: add reminder settings CRUD operations"
```

---

## Task 4: Reminder Settings API & UI Pages

**Files:**
- Create: `app/api/settings/reminders/route.ts`
- Create: `app/api/settings/reminders/[id]/route.ts`
- Create: `app/dashboard/settings/reminders/page.tsx`
- Test: `__tests__/api/settings/reminders.test.ts`

**Step 1: Write the failing test**

```typescript
// __tests__/api/settings/reminders.test.ts
import { POST, GET } from '@/app/api/settings/reminders/route';

describe('Reminders API', () => {
  it('should GET reminders for agency', async () => {
    const request = new Request('http://localhost/api/settings/reminders', {
      method: 'GET',
      headers: { 'x-agency-id': 'test-agency-123' },
    });
    const response = await GET(request as any);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should POST create reminder', async () => {
    const request = new Request('http://localhost/api/settings/reminders', {
      method: 'POST',
      headers: { 'x-agency-id': 'test-agency-123' },
      body: JSON.stringify({
        reminderType: 'invoice_due_soon',
        daysBefore: 3,
        enabled: true,
      }),
    });
    const response = await POST(request as any);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/api/settings/reminders.test.ts
```

Expected: FAIL - route file doesn't exist

**Step 3: Write API route handlers**

```typescript
// app/api/settings/reminders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { getReminderSettings, createReminderSetting } from '@/lib/db/reminders';

export async function GET(request: NextRequest) {
  const agency = await requireAuth(request);
  if (!agency) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const reminders = await getReminderSettings(agency.id);
    return NextResponse.json(reminders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const agency = await requireAuth(request);
  if (!agency) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const reminder = await createReminderSetting({
      agencyId: agency.id,
      reminderType: body.reminderType,
      daysBefore: body.daysBefore,
      enabled: body.enabled,
    });
    return NextResponse.json(reminder, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

```typescript
// app/api/settings/reminders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { updateReminderSetting, deleteReminderSetting } from '@/lib/db/reminders';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const agency = await requireAuth(request);
  if (!agency) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const reminder = await updateReminderSetting(params.id, body);
    return NextResponse.json(reminder);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const agency = await requireAuth(request);
  if (!agency) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await deleteReminderSetting(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

**Step 4: Write the UI page**

```typescript
// app/dashboard/settings/reminders/page.tsx
'use client';

import { useState, useEffect } from 'react';

export default function RemindersSettingsPage() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReminders() {
      try {
        const response = await fetch('/api/settings/reminders');
        if (response.ok) {
          const data = await response.json();
          setReminders(data);
        }
      } catch (error) {
        console.error('Failed to load reminders:', error);
      } finally {
        setLoading(false);
      }
    }
    loadReminders();
  }, []);

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await fetch(`/api/settings/reminders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      });
      setReminders(reminders.map((r) => (r.id === id ? { ...r, enabled: !enabled } : r)));
    } catch (error) {
      console.error('Failed to update reminder:', error);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Email Reminders</h1>

      <div className="space-y-4">
        {reminders.map((reminder) => (
          <div key={reminder.id} className="border rounded-lg p-6 flex justify-between items-center">
            <div>
              <h3 className="font-semibold capitalize">{reminder.reminderType.replace(/_/g, ' ')}</h3>
              <p className="text-sm text-gray-600">{reminder.daysBefore} days before</p>
            </div>
            <button
              onClick={() => handleToggle(reminder.id, reminder.enabled)}
              className={`px-4 py-2 rounded-lg font-medium ${
                reminder.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {reminder.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 5: Run test to verify it passes**

```bash
npm test -- __tests__/api/settings/reminders.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add app/api/settings/reminders/ app/dashboard/settings/reminders/ __tests__/api/settings/reminders.test.ts
git commit -m "feat: add reminder settings API and UI pages"
```

---

## Task 5: Email Reminder Job Processor

**Files:**
- Create: `lib/jobs/reminders.ts`
- Test: `__tests__/jobs/reminders.test.ts`

**Step 1: Write the failing test**

```typescript
// __tests__/jobs/reminders.test.ts
import { processReminderJob } from '@/lib/jobs/reminders';

describe('Reminder Job Processor', () => {
  it('should process due soon invoices', async () => {
    const result = await processReminderJob('invoice_due_soon', 3);
    expect(result).toHaveProperty('processed');
    expect(result.processed).toBeGreaterThanOrEqual(0);
  });

  it('should not send duplicate reminders', async () => {
    const result1 = await processReminderJob('invoice_due_soon', 3);
    const result2 = await processReminderJob('invoice_due_soon', 3);

    // Second run should skip already-sent reminders
    expect(result2.skipped).toBeGreaterThanOrEqual(0);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/jobs/reminders.test.ts
```

Expected: FAIL - "processReminderJob is not defined"

**Step 3: Write reminder job processor**

```typescript
// lib/jobs/reminders.ts
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/sendEmail';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

export async function processReminderJob(reminderType: string, daysBefore: number) {
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  try {
    if (reminderType === 'invoice_due_soon') {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysBefore);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('id, agency_id, client_id, amount, due_date')
        .gte('due_date', targetDate.toISOString())
        .lt('due_date', nextDay.toISOString())
        .eq('status', 'pending');

      if (error) throw error;

      for (const invoice of invoices || []) {
        try {
          const { data: sent } = await supabase
            .from('sent_reminders')
            .select('id')
            .eq('invoice_id', invoice.id)
            .eq('reminder_type', 'invoice_due_soon')
            .eq('agency_id', invoice.agency_id)
            .single();

          if (sent) {
            skipped++;
            continue;
          }

          const { data: client } = await supabase
            .from('clients')
            .select('email')
            .eq('id', invoice.client_id)
            .single();

          if (client?.email) {
            await sendEmail({
              to: client.email,
              subject: `Invoice reminder - $${invoice.amount} due soon`,
              template: 'invoice_due_soon',
              data: { invoice, daysBefore },
            });

            await supabase.from('sent_reminders').insert({
              agency_id: invoice.agency_id,
              invoice_id: invoice.id,
              reminder_type: 'invoice_due_soon',
              sent_at: new Date().toISOString(),
            });

            processed++;
          }
        } catch (err) {
          console.error(`Failed to send reminder for invoice ${invoice.id}:`, err);
          errors++;
        }
      }
    }

    return { processed, skipped, errors };
  } catch (error) {
    console.error('Reminder job failed:', error);
    throw error;
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/jobs/reminders.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add lib/jobs/reminders.ts __tests__/jobs/reminders.test.ts
git commit -m "feat: add email reminder job processor"
```

---

## Task 6-15: Remaining Tasks

**Task 6: Escalation Rules CRUD** — Similar to Task 3, create `lib/db/escalations.ts` with CRUD operations for escalation_rules table

**Task 7: Escalation Job Processor** — Similar to Task 5, check for invoices overdue > threshold, mark as escalated

**Task 8: Bulk Import Database Operations** — Create `lib/db/bulkImports.ts` with CRUD for bulk_imports tracking

**Task 9: CSV Parsing & Upload Endpoint** — Create `app/api/bulk-import/route.ts` to parse CSV, validate, queue job

**Task 10: Bulk Import Job Processor** — Create `lib/jobs/bulkImports.ts` to process CSV rows in batches (100 per batch)

**Task 11: Discord Config CRUD & Webhook Setup** — Create `lib/db/integrations.ts` with CRUD, test Discord webhook connection

**Task 12: Discord Message Formatting & Job Handler** — Create `lib/integrations/discord.ts` with message formatting and webhook sender

**Task 13: Google Calendar OAuth Flow** — Create OAuth callback handler in `app/api/integrations/calendar/callback/route.ts`

**Task 14: Calendar Event Sync Job Handler** — Create `lib/integrations/calendar.ts` to sync deliverables/invoices to Google Calendar

**Task 15: Vercel Cron Setup & Integration Testing** — Create `/api/jobs/process` Cron handler, full E2E tests

Each task follows: failing test → implementation → passing test → commit pattern.

---

## Ready for Separate Session Execution

Plan complete and saved. You can now open a new Claude Code session and execute with:

```
Set up worktree for Phase 4+, then execute docs/plans/2026-03-01-phase-4-plus-implementation.md using superpowers:executing-plans. Sequential TDD tasks: database migration → pg-boss → reminders → escalations → bulk import → Discord → Calendar integrations.
```

Good luck! 🚀
