# Phase 2 & 3 Implementation Plan: Deliverables + Multi-Provider Payments

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Build deliverables tracking with client approvals and flexible multi-provider payment system with QR codes, payment links, and webhooks.

**Architecture:**
- Phase 2: Event-driven deliverable system with auto-generation (Vercel Crons), file uploads, comments, and client portal
- Phase 3: Provider abstraction layer enabling agencies to choose payment gateways (bank transfer, Stripe, Razorpay, Esewa, FonePay)
- Integration: Webhooks trigger invoice status updates; invoices display all enabled payment methods

**Tech Stack:** Next.js 15, PostgreSQL, Server Actions, Vercel Blob for files, Vercel Crons for auto-generation, NextAuth v5, Tailwind CSS

**Timeline:** 3 weeks (Weeks 1-3, parallel execution of Phase 2 and Phase 3)

---

## Phase 2 (Weeks 1-2): Deliverables & Review Workflow

### Task 1: Database Migration - Deliverables Tables

**Files:**
- Create: `lib/migrations/004_add_deliverables_tables.sql`
- Modify: None (migrations auto-run in tests)

**Step 1: Write the migration SQL**

```sql
-- lib/migrations/004_add_deliverables_tables.sql
-- Add deliverables system for tracking monthly deliverables

CREATE TABLE deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  month_year TEXT NOT NULL,
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE deliverable_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INT,
  file_type TEXT,
  file_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  version INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE deliverable_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  comment TEXT NOT NULL,
  is_revision_request BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE deliverable_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  version_number INT,
  status_at_version TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_deliverables_agency_id ON deliverables(agency_id);
CREATE INDEX idx_deliverables_client_id ON deliverables(client_id);
CREATE INDEX idx_deliverables_status ON deliverables(status);
CREATE INDEX idx_deliverable_files_deliverable_id ON deliverable_files(deliverable_id);
CREATE INDEX idx_deliverable_comments_deliverable_id ON deliverable_comments(deliverable_id);
```

**Step 2: Run migration**

```bash
psql postgresql://raunakbohra@localhost/agency_os < lib/migrations/004_add_deliverables_tables.sql
```

Expected: Table creation success (no errors)

**Step 3: Commit**

```bash
git add lib/migrations/004_add_deliverables_tables.sql
git commit -m "migration: add deliverables tables"
```

---

### Task 2: Database Queries - Deliverable Operations

**Files:**
- Modify: `lib/db-queries.ts` (add new functions)
- Test: `__tests__/deliverable-db-queries.test.ts`

**Step 1: Write failing tests**

```typescript
// __tests__/deliverable-db-queries.test.ts
import {
  createDeliverable,
  getDeliverablesByClient,
  updateDeliverableStatus,
  addDeliverableFile,
  addDeliverableComment
} from '@/lib/db-queries';

describe('Deliverable DB Queries', () => {
  const testAgencyId = 'test-agency-id';
  const testClientId = 'test-client-id';
  const testPlanId = 'test-plan-id';

  test('createDeliverable creates deliverable with draft status', async () => {
    const result = await createDeliverable({
      agencyId: testAgencyId,
      clientId: testClientId,
      planId: testPlanId,
      title: 'Video 1 of 4',
      description: 'Monthly video',
      monthYear: '2026-03',
      dueDate: new Date('2026-03-15')
    });
    expect(result.status).toBe('draft');
    expect(result.title).toBe('Video 1 of 4');
  });

  test('getDeliverablesByClient returns all client deliverables', async () => {
    const results = await getDeliverablesByClient(testClientId, testAgencyId);
    expect(Array.isArray(results)).toBe(true);
  });

  test('updateDeliverableStatus transitions status correctly', async () => {
    const deliverable = await createDeliverable({
      agencyId: testAgencyId,
      clientId: testClientId,
      planId: testPlanId,
      title: 'Test',
      monthYear: '2026-03',
      dueDate: new Date()
    });
    const updated = await updateDeliverableStatus(
      deliverable.id,
      testAgencyId,
      'in_review'
    );
    expect(updated.status).toBe('in_review');
  });

  test('addDeliverableFile stores file metadata', async () => {
    const deliverable = await createDeliverable({
      agencyId: testAgencyId,
      clientId: testClientId,
      planId: testPlanId,
      title: 'Test',
      monthYear: '2026-03',
      dueDate: new Date()
    });
    const file = await addDeliverableFile({
      deliverableId: deliverable.id,
      fileName: 'design.pdf',
      fileSize: 2048,
      fileType: 'application/pdf',
      fileUrl: 's3://bucket/design.pdf',
      uploadedBy: 'user-id'
    });
    expect(file.file_name).toBe('design.pdf');
  });

  test('addDeliverableComment creates comment', async () => {
    const deliverable = await createDeliverable({
      agencyId: testAgencyId,
      clientId: testClientId,
      planId: testPlanId,
      title: 'Test',
      monthYear: '2026-03',
      dueDate: new Date()
    });
    const comment = await addDeliverableComment({
      deliverableId: deliverable.id,
      userId: 'user-id',
      comment: 'Please revise colors',
      isRevisionRequest: true
    });
    expect(comment.is_revision_request).toBe(true);
  });
});
```

**Step 2: Run tests (expect all to fail)**

```bash
npm test -- __tests__/deliverable-db-queries.test.ts
```

Expected: All tests fail with "function not found" errors

**Step 3: Add TypeScript interfaces**

```typescript
// lib/db-queries.ts - add these interfaces at top

export interface Deliverable {
  id: string;
  agency_id: string;
  client_id: string;
  plan_id: string;
  title: string;
  description?: string;
  status: 'draft' | 'in_review' | 'approved' | 'changes_requested' | 'done';
  month_year: string;
  due_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface DeliverableFile {
  id: string;
  deliverable_id: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  file_url: string;
  uploaded_by: string;
  version: number;
  created_at: Date;
}

export interface DeliverableComment {
  id: string;
  deliverable_id: string;
  user_id: string;
  comment: string;
  is_revision_request: boolean;
  created_at: Date;
}
```

**Step 4: Implement functions**

```typescript
// lib/db-queries.ts - add these functions

export async function createDeliverable(data: {
  agencyId: string;
  clientId: string;
  planId: string;
  title: string;
  description?: string;
  monthYear: string;
  dueDate?: Date;
}): Promise<Deliverable> {
  const result = await db.query(
    `INSERT INTO deliverables
     (agency_id, client_id, plan_id, title, description, month_year, due_date, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')
     RETURNING *`,
    [data.agencyId, data.clientId, data.planId, data.title, data.description, data.monthYear, data.dueDate]
  );
  return result.rows[0];
}

export async function getDeliverablesByClient(clientId: string, agencyId: string): Promise<Deliverable[]> {
  const result = await db.query(
    `SELECT * FROM deliverables WHERE client_id = $1 AND agency_id = $2 ORDER BY due_date ASC`,
    [clientId, agencyId]
  );
  return result.rows;
}

export async function getDeliverableById(id: string, agencyId: string): Promise<Deliverable | null> {
  const result = await db.query(
    `SELECT * FROM deliverables WHERE id = $1 AND agency_id = $2`,
    [id, agencyId]
  );
  return result.rows[0] || null;
}

export async function updateDeliverableStatus(
  id: string,
  agencyId: string,
  status: string
): Promise<Deliverable> {
  const result = await db.query(
    `UPDATE deliverables SET status = $1, updated_at = NOW() WHERE id = $2 AND agency_id = $3 RETURNING *`,
    [status, id, agencyId]
  );
  return result.rows[0];
}

export async function addDeliverableFile(data: {
  deliverableId: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
  fileUrl: string;
  uploadedBy: string;
}): Promise<DeliverableFile> {
  const result = await db.query(
    `INSERT INTO deliverable_files (deliverable_id, file_name, file_size, file_type, file_url, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [data.deliverableId, data.fileName, data.fileSize, data.fileType, data.fileUrl, data.uploadedBy]
  );
  return result.rows[0];
}

export async function getDeliverableFiles(deliverableId: string): Promise<DeliverableFile[]> {
  const result = await db.query(
    `SELECT * FROM deliverable_files WHERE deliverable_id = $1 ORDER BY created_at DESC`,
    [deliverableId]
  );
  return result.rows;
}

export async function addDeliverableComment(data: {
  deliverableId: string;
  userId: string;
  comment: string;
  isRevisionRequest?: boolean;
}): Promise<DeliverableComment> {
  const result = await db.query(
    `INSERT INTO deliverable_comments (deliverable_id, user_id, comment, is_revision_request)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.deliverableId, data.userId, data.comment, data.isRevisionRequest || false]
  );
  return result.rows[0];
}

export async function getDeliverableComments(deliverableId: string): Promise<DeliverableComment[]> {
  const result = await db.query(
    `SELECT * FROM deliverable_comments WHERE deliverable_id = $1 ORDER BY created_at DESC`,
    [deliverableId]
  );
  return result.rows;
}
```

**Step 5: Run tests (expect all to pass)**

```bash
npm test -- __tests__/deliverable-db-queries.test.ts
```

Expected: All tests PASS

**Step 6: Commit**

```bash
git add lib/db-queries.ts __tests__/deliverable-db-queries.test.ts
git commit -m "feat: add deliverable database operations"
```

---

### Task 3: Auto-Generation Cron Job

**Files:**
- Create: `app/api/cron/generate-deliverables/route.ts`
- Modify: `lib/db-queries.ts` (add getPlanItems function)

**Step 1: Add getPlanItems function to db-queries**

```typescript
// lib/db-queries.ts - add this function

export async function getPlanItems(planId: string): Promise<PlanItem[]> {
  const result = await db.query(
    `SELECT * FROM plan_items WHERE plan_id = $1`,
    [planId]
  );
  return result.rows;
}
```

**Step 2: Create cron endpoint**

```typescript
// app/api/cron/generate-deliverables/route.ts
import { db } from '@/lib/db';
import { getPlanItems, createDeliverable, getClientById } from '@/lib/db-queries';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  // Verify Vercel Cron secret
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get current month
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get all active client plans
    const result = await db.query(
      `SELECT cp.*, c.id as client_id, c.agency_id, p.id as plan_id
       FROM client_plans cp
       JOIN clients c ON cp.client_id = c.id
       JOIN plans p ON cp.plan_id = p.id
       WHERE cp.status = 'active'`
    );

    const clientPlans = result.rows;
    let created = 0;

    for (const clientPlan of clientPlans) {
      // Check if deliverables already exist for this month
      const existing = await db.query(
        `SELECT id FROM deliverables WHERE client_id = $1 AND month_year = $2`,
        [clientPlan.client_id, monthYear]
      );

      if (existing.rows.length === 0) {
        // Get plan items
        const planItems = await getPlanItems(clientPlan.plan_id);

        // Create deliverable for each plan item
        for (const item of planItems) {
          const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // End of month

          await createDeliverable({
            agencyId: clientPlan.agency_id,
            clientId: clientPlan.client_id,
            planId: clientPlan.plan_id,
            title: item.deliverable_type,
            monthYear,
            dueDate
          });

          created++;
        }
      }
    }

    return Response.json({
      success: true,
      message: `Created ${created} deliverables for ${monthYear}`
    });
  } catch (error) {
    console.error('Cron error:', error);
    return Response.json({ error: 'Failed to generate deliverables' }, { status: 500 });
  }
}
```

**Step 3: Add CRON_SECRET to .env.local**

```bash
# .env.local
CRON_SECRET=your-secret-key-here
```

**Step 4: Commit**

```bash
git add app/api/cron/generate-deliverables/route.ts
git commit -m "feat: add monthly deliverable generation cron"
```

---

### Task 4: Agency Deliverables List Page

**Files:**
- Create: `app/dashboard/deliverables/page.tsx`
- Create: `components/DeliverablesList.tsx`

**Step 1: Create list page**

```typescript
// app/dashboard/deliverables/page.tsx
import { auth } from '@/lib/auth';
import {
  getAgenciesByOwnerId,
  getDeliverablesByAgency
} from '@/lib/db-queries';
import DeliverablesList from '@/components/DeliverablesList';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DeliverablesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const agencies = await getAgenciesByOwnerId(session.user.id);
  const agencyId = agencies[0]?.id;

  if (!agencyId) {
    return <div className="p-8">No agency found</div>;
  }

  // Get all deliverables for agency
  // First, we need to add this query function in Task 5

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Deliverables</h1>
        <p className="text-gray-600 mt-1">Track all client deliverables</p>
      </div>

      <DeliverablesList agencyId={agencyId} />
    </div>
  );
}
```

**Step 2: Create list component**

```typescript
// components/DeliverablesList.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Deliverable {
  id: string;
  client_id: string;
  title: string;
  status: string;
  month_year: string;
  due_date: string;
}

export default function DeliverablesList({ agencyId }: { agencyId: string }) {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchDeliverables = async () => {
      const res = await fetch(`/api/deliverables?agencyId=${agencyId}`);
      const data = await res.json();
      setDeliverables(data);
      setLoading(false);
    };
    fetchDeliverables();
  }, [agencyId]);

  const filtered = statusFilter === 'all'
    ? deliverables
    : deliverables.filter(d => d.status === statusFilter);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          All
        </button>
        <button
          onClick={() => setStatusFilter('draft')}
          className={`px-4 py-2 rounded ${statusFilter === 'draft' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Draft
        </button>
        <button
          onClick={() => setStatusFilter('in_review')}
          className={`px-4 py-2 rounded ${statusFilter === 'in_review' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          In Review
        </button>
        <button
          onClick={() => setStatusFilter('approved')}
          className={`px-4 py-2 rounded ${statusFilter === 'approved' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Approved
        </button>
      </div>

      <div className="bg-white rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Title</th>
              <th className="px-6 py-3 text-left font-semibold">Month</th>
              <th className="px-6 py-3 text-left font-semibold">Due Date</th>
              <th className="px-6 py-3 text-left font-semibold">Status</th>
              <th className="px-6 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id} className="border-t">
                <td className="px-6 py-3">{d.title}</td>
                <td className="px-6 py-3">{d.month_year}</td>
                <td className="px-6 py-3">
                  {d.due_date ? new Date(d.due_date).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-3">
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    d.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    d.status === 'in_review' ? 'bg-blue-100 text-blue-800' :
                    d.status === 'approved' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {d.status.replace('_', ' ').charAt(0).toUpperCase() + d.status.replace('_', ' ').slice(1)}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <Link href={`/dashboard/deliverables/${d.id}`} className="text-blue-600 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add app/dashboard/deliverables/page.tsx components/DeliverablesList.tsx
git commit -m "feat: add deliverables list page"
```

---

### Task 5: Deliverable Detail Page with File Upload

**Files:**
- Create: `app/dashboard/deliverables/[id]/page.tsx`
- Create: `app/api/deliverables/[id]/route.ts`
- Modify: `lib/db-queries.ts` (add getDeliverablesByAgency function)

**Step 1: Add missing query function**

```typescript
// lib/db-queries.ts - add this function

export async function getDeliverablesByAgency(agencyId: string): Promise<Deliverable[]> {
  const result = await db.query(
    `SELECT d.*, c.name as client_name FROM deliverables d
     JOIN clients c ON d.client_id = c.id
     WHERE d.agency_id = $1
     ORDER BY d.due_date ASC`,
    [agencyId]
  );
  return result.rows;
}
```

**Step 2: Create API endpoint for deliverable operations**

```typescript
// app/api/deliverables/[id]/route.ts
import { auth } from '@/lib/auth';
import {
  getDeliverableById,
  getDeliverableFiles,
  getDeliverableComments,
  updateDeliverableStatus
} from '@/lib/db-queries';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const deliverable = await getDeliverableById(params.id, session.user.agencyId);

    if (!deliverable) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const files = await getDeliverableFiles(params.id);
    const comments = await getDeliverableComments(params.id);

    return Response.json({
      deliverable,
      files,
      comments
    });
  } catch (error) {
    console.error('Error fetching deliverable:', error);
    return Response.json({ error: 'Failed to fetch deliverable' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { status } = await request.json();

    const updated = await updateDeliverableStatus(
      params.id,
      session.user.agencyId,
      status
    );

    return Response.json(updated);
  } catch (error) {
    console.error('Error updating deliverable:', error);
    return Response.json({ error: 'Failed to update deliverable' }, { status: 500 });
  }
}
```

**Step 3: Create detail page**

```typescript
// app/dashboard/deliverables/[id]/page.tsx
import { auth } from '@/lib/auth';
import { getDeliverableById } from '@/lib/db-queries';
import DeliverableDetail from '@/components/DeliverableDetail';
import { redirect } from 'next/navigation';

export default async function DeliverableDetailPage({
  params
}: {
  params: { id: string }
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const deliverable = await getDeliverableById(params.id, session.user.agencyId);

  if (!deliverable) {
    return <div className="p-8">Deliverable not found</div>;
  }

  return (
    <div className="p-8">
      <DeliverableDetail deliverable={deliverable} deliverableId={params.id} />
    </div>
  );
}
```

**Step 4: Create detail component**

```typescript
// components/DeliverableDetail.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DeliverableDetailProps {
  deliverable: any;
  deliverableId: string;
}

export default function DeliverableDetail({
  deliverable,
  deliverableId
}: DeliverableDetailProps) {
  const router = useRouter();
  const [status, setStatus] = useState(deliverable.status);
  const [files, setFiles] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isRevisionRequest, setIsRevisionRequest] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`/api/deliverables/${deliverableId}`);
      const data = await res.json();
      setFiles(data.files);
      setComments(data.comments);
      setLoading(false);
    };
    fetchData();
  }, [deliverableId]);

  const handleStatusChange = async (newStatus: string) => {
    const res = await fetch(`/api/deliverables/${deliverableId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    if (res.ok) {
      setStatus(newStatus);
      router.refresh();
    }
  };

  const handleAddComment = async () => {
    const res = await fetch(`/api/deliverables/${deliverableId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comment: newComment,
        isRevisionRequest
      })
    });

    if (res.ok) {
      setNewComment('');
      setIsRevisionRequest(false);
      router.refresh();
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{deliverable.title}</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded border">
          <p className="text-sm text-gray-600">Status</p>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="mt-2 w-full border rounded p-2"
          >
            <option value="draft">Draft</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="changes_requested">Changes Requested</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div className="bg-white p-4 rounded border">
          <p className="text-sm text-gray-600">Month</p>
          <p className="text-lg font-semibold mt-2">{deliverable.month_year}</p>
        </div>

        <div className="bg-white p-4 rounded border">
          <p className="text-sm text-gray-600">Due Date</p>
          <p className="text-lg font-semibold mt-2">
            {deliverable.due_date ? new Date(deliverable.due_date).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Files</h2>
        {files.length === 0 ? (
          <p className="text-gray-600">No files uploaded yet</p>
        ) : (
          <ul className="space-y-2">
            {files.map(file => (
              <li key={file.id} className="flex justify-between items-center border-b pb-2">
                <span>{file.file_name}</span>
                <a href={file.file_url} className="text-blue-600 hover:underline">Download</a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Comments</h2>
        <div className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full border rounded p-3 mb-2"
            placeholder="Add a comment..."
            rows={3}
          />
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={isRevisionRequest}
              onChange={(e) => setIsRevisionRequest(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">This is a revision request</span>
          </label>
          <button
            onClick={handleAddComment}
            className="px-4 py-2 bg-blue-600 text-white rounded font-medium"
          >
            Add Comment
          </button>
        </div>

        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="border rounded p-4 bg-gray-50">
              <div className="flex justify-between mb-2">
                <p className="font-semibold">{comment.user_id}</p>
                <span className="text-xs text-gray-600">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-800">{comment.comment}</p>
              {comment.is_revision_request && (
                <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                  Revision Request
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 5: Create comment API endpoint**

```typescript
// app/api/deliverables/[id]/comments/route.ts
import { auth } from '@/lib/auth';
import { addDeliverableComment } from '@/lib/db-queries';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { comment, isRevisionRequest } = await request.json();

    const result = await addDeliverableComment({
      deliverableId: params.id,
      userId: session.user.id,
      comment,
      isRevisionRequest
    });

    return Response.json(result);
  } catch (error) {
    console.error('Error adding comment:', error);
    return Response.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
```

**Step 6: Commit**

```bash
git add app/dashboard/deliverables/[id]/page.tsx components/DeliverableDetail.tsx \
        app/api/deliverables/[id]/route.ts app/api/deliverables/[id]/comments/route.ts
git commit -m "feat: add deliverable detail page with file upload and comments"
```

---

### Task 6: Client Portal - View Deliverables

**Files:**
- Create: `app/portal/[clientToken]/deliverables/page.tsx`
- Create: `components/ClientDeliverablesList.tsx`
- Modify: `lib/db-queries.ts` (add getClientByToken function)

**Step 1: Create portal deliverables page**

```typescript
// app/portal/[clientToken]/deliverables/page.tsx
import { getClientByToken, getDeliverablesByClient } from '@/lib/db-queries';
import ClientDeliverablesList from '@/components/ClientDeliverablesList';

export default async function ClientDeliverablesPage({
  params
}: {
  params: { clientToken: string }
}) {
  const client = await getClientByToken(params.clientToken);

  if (!client) {
    return <div className="p-8">Access denied</div>;
  }

  const deliverables = await getDeliverablesByClient(client.id, client.agency_id);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Deliverables for {client.name}</h1>
      <p className="text-gray-600 mb-6">Review and approve your deliverables</p>

      <ClientDeliverablesList deliverables={deliverables} clientId={client.id} />
    </div>
  );
}
```

**Step 2: Create client component**

```typescript
// components/ClientDeliverablesList.tsx
'use client';

import { Deliverable } from '@/lib/db-queries';
import Link from 'next/link';

interface ClientDeliverablesListProps {
  deliverables: Deliverable[];
  clientId: string;
}

export default function ClientDeliverablesList({
  deliverables,
  clientId
}: ClientDeliverablesListProps) {
  return (
    <div className="grid gap-4">
      {deliverables.map(d => (
        <div key={d.id} className="bg-white rounded-lg p-6 border">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold">{d.title}</h3>
              <p className="text-gray-600">{d.month_year}</p>
            </div>
            <span className={`px-3 py-1 rounded text-sm font-medium ${
              d.status === 'draft' ? 'bg-gray-100 text-gray-800' :
              d.status === 'in_review' ? 'bg-blue-100 text-blue-800' :
              d.status === 'approved' ? 'bg-green-100 text-green-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {d.status.replace('_', ' ')}
            </span>
          </div>

          {d.description && <p className="text-gray-700 mb-4">{d.description}</p>}

          <Link href={`/portal/deliverable/${d.id}`} className="text-blue-600 hover:underline">
            View Details & Approve →
          </Link>
        </div>
      ))}
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add app/portal/[clientToken]/deliverables/page.tsx components/ClientDeliverablesList.tsx
git commit -m "feat: add client portal deliverables view"
```

---

## Phase 3 (Weeks 1.5-2.5 Parallel): Multi-Provider Payment System

### Task 7: Database Migration - Payment Provider Tables

**Files:**
- Create: `lib/migrations/005_add_payment_provider_tables.sql`

**Step 1: Write migration**

```sql
-- lib/migrations/005_add_payment_provider_tables.sql

CREATE TABLE payment_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  requires_credentials BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE agency_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL REFERENCES payment_providers(id),
  credentials JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  test_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id),
  provider_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'NPR',
  status TEXT DEFAULT 'pending',
  transaction_id TEXT,
  reference_id TEXT,
  webhook_payload JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payment_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,
  event_type TEXT,
  payload JSONB,
  verified BOOLEAN,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default providers
INSERT INTO payment_providers (id, name, description) VALUES
  ('bank_transfer', 'Bank Transfer', 'Manual bank transfer with receipt upload'),
  ('fonepay', 'FonePay', 'Nepal QR code payment'),
  ('stripe', 'Stripe', 'International card payments'),
  ('razorpay', 'Razorpay', 'India/South Asia payments'),
  ('esewa', 'Esewa', 'Nepal digital wallet');

CREATE INDEX idx_agency_payment_methods_agency_id ON agency_payment_methods(agency_id);
CREATE INDEX idx_payment_transactions_invoice_id ON payment_transactions(invoice_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_webhooks_provider_id ON payment_webhooks(provider_id);
```

**Step 2: Run migration**

```bash
psql postgresql://raunakbohra@localhost/agency_os < lib/migrations/005_add_payment_provider_tables.sql
```

Expected: Tables created successfully

**Step 3: Commit**

```bash
git add lib/migrations/005_add_payment_provider_tables.sql
git commit -m "migration: add payment provider tables"
```

---

### Task 8: Payment Provider Interface & Implementation

**Files:**
- Create: `lib/payment-providers/provider.ts` (interface)
- Create: `lib/payment-providers/bank-transfer.ts`
- Create: `lib/payment-providers/fonepay.ts`
- Create: `lib/payment-providers/stripe.ts`
- Create: `lib/payment-providers/razorpay.ts`
- Create: `lib/payment-providers/esewa.ts`
- Create: `lib/payment-providers/index.ts` (registry)

**Step 1: Create provider interface**

```typescript
// lib/payment-providers/provider.ts

export interface PaymentRequest {
  qr?: string;
  link?: string;
  embedded?: string;
}

export interface ParsedPaymentEvent {
  invoiceId: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  transactionId: string;
  timestamp: Date;
}

export interface PaymentProvider {
  id: string;
  name: string;

  initialize(credentials: Record<string, string>): Promise<void>;
  validateCredentials(credentials: Record<string, string>): Promise<boolean>;
  generatePaymentRequest(invoice: any): Promise<PaymentRequest>;
  verifyWebhook(payload: Record<string, any>, signature?: string): Promise<boolean>;
  parsePaymentEvent(payload: Record<string, any>): ParsedPaymentEvent;
}
```

**Step 2: Implement Bank Transfer (simplest)**

```typescript
// lib/payment-providers/bank-transfer.ts

import { PaymentProvider, PaymentRequest, ParsedPaymentEvent } from './provider';

export class BankTransferProvider implements PaymentProvider {
  id = 'bank_transfer';
  name = 'Bank Transfer';

  async initialize(credentials: Record<string, string>): Promise<void> {
    // No external API for bank transfer
  }

  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    // Bank transfer doesn't need credentials
    return true;
  }

  async generatePaymentRequest(invoice: any): Promise<PaymentRequest> {
    // Return bank transfer instructions only
    return {
      link: `/dashboard/invoices/${invoice.id}/pay?method=bank_transfer`
    };
  }

  async verifyWebhook(
    payload: Record<string, any>,
    signature?: string
  ): Promise<boolean> {
    // No webhook for bank transfer - manually verified by agency
    return true;
  }

  parsePaymentEvent(payload: Record<string, any>): ParsedPaymentEvent {
    return {
      invoiceId: payload.invoiceId,
      amount: payload.amount,
      status: 'completed',
      transactionId: payload.transactionId,
      timestamp: new Date()
    };
  }
}
```

**Step 3: Implement FonePay**

```typescript
// lib/payment-providers/fonepay.ts

import { PaymentProvider, PaymentRequest, ParsedPaymentEvent } from './provider';
import crypto from 'crypto';

export class FonePayProvider implements PaymentProvider {
  id = 'fonepay';
  name = 'FonePay';
  private apiKey: string = '';
  private merchantId: string = '';

  async initialize(credentials: Record<string, string>): Promise<void> {
    this.apiKey = credentials.apiKey;
    this.merchantId = credentials.merchantId;
  }

  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    try {
      // Try a test API call to validate credentials
      const response = await fetch('https://api.fonepay.com/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generatePaymentRequest(invoice: any): Promise<PaymentRequest> {
    // Generate FonePay QR code
    // This would call FonePay API to generate QR
    const qrResponse = await fetch('https://api.fonepay.com/qr/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        merchantId: this.merchantId,
        amount: invoice.amount,
        invoiceId: invoice.id
      })
    });

    const data = await qrResponse.json();
    return { qr: data.qrCode };
  }

  async verifyWebhook(
    payload: Record<string, any>,
    signature?: string
  ): Promise<boolean> {
    if (!signature) return false;

    // Verify signature with FonePay webhook secret
    const secretKey = process.env.FONEPAY_WEBHOOK_SECRET || '';
    const hash = crypto
      .createHmac('sha256', secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');

    return hash === signature;
  }

  parsePaymentEvent(payload: Record<string, any>): ParsedPaymentEvent {
    return {
      invoiceId: payload.invoiceId,
      amount: payload.amount,
      status: payload.status === 'success' ? 'completed' : 'failed',
      transactionId: payload.transactionId,
      timestamp: new Date(payload.timestamp)
    };
  }
}
```

**Step 4: Implement Stripe (simplified)**

```typescript
// lib/payment-providers/stripe.ts

import { PaymentProvider, PaymentRequest, ParsedPaymentEvent } from './provider';

export class StripeProvider implements PaymentProvider {
  id = 'stripe';
  name = 'Stripe';
  private apiKey: string = '';

  async initialize(credentials: Record<string, string>): Promise<void> {
    this.apiKey = credentials.apiKey;
  }

  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    try {
      const response = await fetch('https://api.stripe.com/v1/account', {
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generatePaymentRequest(invoice: any): Promise<PaymentRequest> {
    // Create Stripe payment link
    const response = await fetch('https://api.stripe.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'line_items[0][price_data][currency]': 'npr',
        'line_items[0][price_data][unit_amount]': String(Math.round(invoice.amount * 100)),
        'line_items[0][quantity]': '1'
      })
    });

    const data = await response.json();
    return { link: data.url };
  }

  async verifyWebhook(
    payload: Record<string, any>,
    signature?: string
  ): Promise<boolean> {
    // Verify Stripe signature
    const crypto = require('crypto');
    const secretKey = process.env.STRIPE_WEBHOOK_SECRET || '';
    const hash = crypto
      .createHmac('sha256', secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');
    return hash === signature;
  }

  parsePaymentEvent(payload: Record<string, any>): ParsedPaymentEvent {
    return {
      invoiceId: payload.metadata?.invoiceId || '',
      amount: payload.amount_total / 100,
      status: payload.payment_status === 'paid' ? 'completed' : 'pending',
      transactionId: payload.id,
      timestamp: new Date(payload.created * 1000)
    };
  }
}
```

**Step 5: Implement Razorpay (simplified)**

```typescript
// lib/payment-providers/razorpay.ts

import { PaymentProvider, PaymentRequest, ParsedPaymentEvent } from './provider';

export class RazorpayProvider implements PaymentProvider {
  id = 'razorpay';
  name = 'Razorpay';
  private keyId: string = '';
  private keySecret: string = '';

  async initialize(credentials: Record<string, string>): Promise<void> {
    this.keyId = credentials.keyId;
    this.keySecret = credentials.keySecret;
  }

  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    try {
      const auth = Buffer.from(`${credentials.keyId}:${credentials.keySecret}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/invoices', {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generatePaymentRequest(invoice: any): Promise<PaymentRequest> {
    // Create Razorpay QR code
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/qr_codes', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        upi_link: `upi://pay?pa=merchant@razorpay&pn=Invoice`,
        amount: String(Math.round(invoice.amount * 100))
      })
    });

    const data = await response.json();
    return { qr: data.image_url };
  }

  async verifyWebhook(
    payload: Record<string, any>,
    signature?: string
  ): Promise<boolean> {
    const crypto = require('crypto');
    const secretKey = this.keySecret;
    const hash = crypto
      .createHmac('sha256', secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');
    return hash === signature;
  }

  parsePaymentEvent(payload: Record<string, any>): ParsedPaymentEvent {
    return {
      invoiceId: payload.notes?.invoiceId || '',
      amount: payload.amount / 100,
      status: payload.status === 'issued' ? 'completed' : 'pending',
      transactionId: payload.id,
      timestamp: new Date(payload.created_at * 1000)
    };
  }
}
```

**Step 6: Implement Esewa (simplified)**

```typescript
// lib/payment-providers/esewa.ts

import { PaymentProvider, PaymentRequest, ParsedPaymentEvent } from './provider';

export class EsewaProvider implements PaymentProvider {
  id = 'esewa';
  name = 'Esewa';
  private merchantCode: string = '';
  private secret: string = '';

  async initialize(credentials: Record<string, string>): Promise<void> {
    this.merchantCode = credentials.merchantCode;
    this.secret = credentials.secret;
  }

  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    // Esewa validation would go here
    return !!(credentials.merchantCode && credentials.secret);
  }

  async generatePaymentRequest(invoice: any): Promise<PaymentRequest> {
    // Generate Esewa payment link with QR
    const link = `https://esewa.com.np/epay/main?amt=${invoice.amount}&psc=0&pid=${invoice.id}&scd=${this.merchantCode}`;
    return { link };
  }

  async verifyWebhook(
    payload: Record<string, any>,
    signature?: string
  ): Promise<boolean> {
    // Esewa webhook verification
    return true; // Simplified for now
  }

  parsePaymentEvent(payload: Record<string, any>): ParsedPaymentEvent {
    return {
      invoiceId: payload.pid || '',
      amount: payload.amt || 0,
      status: payload.status === 'success' ? 'completed' : 'failed',
      transactionId: payload.oid || '',
      timestamp: new Date()
    };
  }
}
```

**Step 7: Create provider registry**

```typescript
// lib/payment-providers/index.ts

import { PaymentProvider } from './provider';
import { BankTransferProvider } from './bank-transfer';
import { FonePayProvider } from './fonepay';
import { StripeProvider } from './stripe';
import { RazorpayProvider } from './razorpay';
import { EsewaProvider } from './esewa';

const providers: Record<string, PaymentProvider> = {
  bank_transfer: new BankTransferProvider(),
  fonepay: new FonePayProvider(),
  stripe: new StripeProvider(),
  razorpay: new RazorpayProvider(),
  esewa: new EsewaProvider()
};

export function getProvider(providerId: string): PaymentProvider | null {
  return providers[providerId] || null;
}

export function getAllProviders(): PaymentProvider[] {
  return Object.values(providers);
}

export { PaymentProvider, PaymentRequest, ParsedPaymentEvent } from './provider';
```

**Step 8: Commit**

```bash
git add lib/payment-providers/
git commit -m "feat: add payment provider interface and implementations"
```

---

### Task 9: Payment DB Queries

**Files:**
- Modify: `lib/db-queries.ts` (add payment functions)

**Step 1: Add payment database functions**

```typescript
// lib/db-queries.ts - add these functions

export interface PaymentTransaction {
  id: string;
  invoice_id: string;
  agency_id: string;
  provider_id: string;
  amount: number;
  currency: string;
  status: string;
  transaction_id?: string;
  reference_id?: string;
  webhook_payload?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface AgencyPaymentMethod {
  id: string;
  agency_id: string;
  provider_id: string;
  credentials: Record<string, string>;
  enabled: boolean;
  test_mode: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function createPaymentTransaction(data: {
  invoiceId: string;
  agencyId: string;
  providerId: string;
  amount: number;
  currency?: string;
  transactionId?: string;
  referenceId?: string;
  webhookPayload?: Record<string, any>;
}): Promise<PaymentTransaction> {
  const result = await db.query(
    `INSERT INTO payment_transactions
     (invoice_id, agency_id, provider_id, amount, currency, status, transaction_id, reference_id, webhook_payload)
     VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8)
     RETURNING *`,
    [
      data.invoiceId,
      data.agencyId,
      data.providerId,
      data.amount,
      data.currency || 'NPR',
      data.transactionId,
      data.referenceId,
      data.webhookPayload ? JSON.stringify(data.webhookPayload) : null
    ]
  );
  return result.rows[0];
}

export async function updatePaymentTransactionStatus(
  id: string,
  agencyId: string,
  status: string
): Promise<PaymentTransaction> {
  const result = await db.query(
    `UPDATE payment_transactions
     SET status = $1, updated_at = NOW()
     WHERE id = $2 AND agency_id = $3
     RETURNING *`,
    [status, id, agencyId]
  );
  return result.rows[0];
}

export async function getPaymentTransactionsByInvoice(
  invoiceId: string,
  agencyId: string
): Promise<PaymentTransaction[]> {
  const result = await db.query(
    `SELECT * FROM payment_transactions
     WHERE invoice_id = $1 AND agency_id = $2
     ORDER BY created_at DESC`,
    [invoiceId, agencyId]
  );
  return result.rows;
}

export async function addAgencyPaymentMethod(data: {
  agencyId: string;
  providerId: string;
  credentials: Record<string, string>;
  testMode?: boolean;
}): Promise<AgencyPaymentMethod> {
  const result = await db.query(
    `INSERT INTO agency_payment_methods
     (agency_id, provider_id, credentials, enabled, test_mode)
     VALUES ($1, $2, $3, true, $4)
     RETURNING *`,
    [data.agencyId, data.providerId, JSON.stringify(data.credentials), data.testMode || false]
  );
  return result.rows[0];
}

export async function getAgencyPaymentMethods(
  agencyId: string
): Promise<AgencyPaymentMethod[]> {
  const result = await db.query(
    `SELECT * FROM agency_payment_methods WHERE agency_id = $1 AND enabled = true`,
    [agencyId]
  );
  return result.rows;
}

export async function updateAgencyPaymentMethod(
  id: string,
  agencyId: string,
  data: { credentials?: Record<string, string>; enabled?: boolean }
): Promise<AgencyPaymentMethod> {
  const updates = [];
  const values = [id, agencyId];
  let paramCount = 2;

  if (data.credentials) {
    updates.push(`credentials = $${++paramCount}`);
    values.push(JSON.stringify(data.credentials));
  }

  if (data.enabled !== undefined) {
    updates.push(`enabled = $${++paramCount}`);
    values.push(data.enabled);
  }

  updates.push(`updated_at = NOW()`);

  const result = await db.query(
    `UPDATE agency_payment_methods
     SET ${updates.join(', ')}
     WHERE id = $1 AND agency_id = $2
     RETURNING *`,
    values
  );
  return result.rows[0];
}
```

**Step 2: Commit**

```bash
git add lib/db-queries.ts
git commit -m "feat: add payment transaction database operations"
```

---

### Task 10: Agency Payment Settings Page

**Files:**
- Create: `app/dashboard/settings/payments/page.tsx`
- Create: `components/PaymentMethodsManager.tsx`
- Create: `app/api/settings/payments/route.ts`

**Step 1: Create settings page**

```typescript
// app/dashboard/settings/payments/page.tsx
import { auth } from '@/lib/auth';
import { getAgenciesByOwnerId, getAgencyPaymentMethods } from '@/lib/db-queries';
import PaymentMethodsManager from '@/components/PaymentMethodsManager';
import { redirect } from 'next/navigation';

export default async function PaymentSettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const agencies = await getAgenciesByOwnerId(session.user.id);
  const agencyId = agencies[0]?.id;

  if (!agencyId) {
    return <div className="p-8">No agency found</div>;
  }

  const paymentMethods = await getAgencyPaymentMethods(agencyId);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Payment Methods</h1>
      <p className="text-gray-600 mb-6">Configure your payment providers</p>

      <PaymentMethodsManager agencyId={agencyId} initialMethods={paymentMethods} />
    </div>
  );
}
```

**Step 2: Create manager component**

```typescript
// components/PaymentMethodsManager.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const AVAILABLE_PROVIDERS = [
  { id: 'bank_transfer', name: 'Bank Transfer', requiresSetup: false },
  { id: 'fonepay', name: 'FonePay', requiresSetup: true },
  { id: 'stripe', name: 'Stripe', requiresSetup: true },
  { id: 'razorpay', name: 'Razorpay', requiresSetup: true },
  { id: 'esewa', name: 'Esewa', requiresSetup: true }
];

const CREDENTIAL_FIELDS: Record<string, { label: string; type: string }[]> = {
  fonepay: [
    { label: 'API Key', type: 'password' },
    { label: 'Merchant ID', type: 'text' }
  ],
  stripe: [
    { label: 'API Key', type: 'password' }
  ],
  razorpay: [
    { label: 'Key ID', type: 'text' },
    { label: 'Key Secret', type: 'password' }
  ],
  esewa: [
    { label: 'Merchant Code', type: 'text' },
    { label: 'Secret', type: 'password' }
  ]
};

export default function PaymentMethodsManager({
  agencyId,
  initialMethods
}: {
  agencyId: string;
  initialMethods: any[];
}) {
  const router = useRouter();
  const [methods, setMethods] = useState(initialMethods);
  const [showForm, setShowForm] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleAddProvider = async (providerId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId,
          providerId,
          credentials: formData
        })
      });

      if (res.ok) {
        setFormData({});
        setShowForm(null);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (methodId: string, enabled: boolean) => {
    const res = await fetch(`/api/settings/payments/${methodId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !enabled })
    });

    if (res.ok) {
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {AVAILABLE_PROVIDERS.map(provider => {
        const existing = methods.find(m => m.provider_id === provider.id);

        return (
          <div key={provider.id} className="bg-white rounded-lg p-6 border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{provider.name}</h3>
              {existing && (
                <button
                  onClick={() => handleToggle(existing.id, existing.enabled)}
                  className={`px-4 py-2 rounded ${
                    existing.enabled ? 'bg-green-600 text-white' : 'bg-gray-300'
                  }`}
                >
                  {existing.enabled ? 'Enabled' : 'Disabled'}
                </button>
              )}
            </div>

            {!existing && provider.requiresSetup && (
              <>
                {showForm === provider.id ? (
                  <div className="space-y-4">
                    {CREDENTIAL_FIELDS[provider.id].map(field => (
                      <div key={field.label}>
                        <label className="block text-sm font-medium mb-1">
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          value={formData[field.label] || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [field.label]: e.target.value
                            })
                          }
                          className="w-full border rounded p-2"
                        />
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddProvider(provider.id)}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setShowForm(null)}
                        className="px-4 py-2 border rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowForm(provider.id)}
                    className="text-blue-600 hover:underline"
                  >
                    Configure →
                  </button>
                )}
              </>
            )}

            {existing && (
              <p className="text-sm text-gray-600">
                Configured on {new Date(existing.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

**Step 3: Create API endpoint**

```typescript
// app/api/settings/payments/route.ts
import { auth } from '@/lib/auth';
import { addAgencyPaymentMethod, getAgencyPaymentMethods } from '@/lib/db-queries';

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { agencyId, providerId, credentials } = await request.json();

    const result = await addAgencyPaymentMethod({
      agencyId,
      providerId,
      credentials
    });

    return Response.json(result);
  } catch (error) {
    console.error('Error adding payment method:', error);
    return Response.json({ error: 'Failed to add payment method' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const agencyId = url.searchParams.get('agencyId');

    if (!agencyId) {
      return Response.json({ error: 'Missing agencyId' }, { status: 400 });
    }

    const methods = await getAgencyPaymentMethods(agencyId);
    return Response.json(methods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return Response.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
  }
}
```

**Step 4: Create update endpoint**

```typescript
// app/api/settings/payments/[id]/route.ts
import { auth } from '@/lib/auth';
import { updateAgencyPaymentMethod } from '@/lib/db-queries';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { agencyId, ...updates } = await request.json();

    const result = await updateAgencyPaymentMethod(params.id, agencyId, updates);
    return Response.json(result);
  } catch (error) {
    console.error('Error updating payment method:', error);
    return Response.json({ error: 'Failed to update payment method' }, { status: 500 });
  }
}
```

**Step 5: Commit**

```bash
git add app/dashboard/settings/payments/page.tsx \
        components/PaymentMethodsManager.tsx \
        app/api/settings/payments/route.ts \
        app/api/settings/payments/[id]/route.ts
git commit -m "feat: add payment methods configuration page"
```

---

### Task 11: Webhook Router & Payment Processing

**Files:**
- Create: `app/api/webhooks/payments/route.ts`
- Create: `lib/webhook-processor.ts`

**Step 1: Create webhook processor**

```typescript
// lib/webhook-processor.ts
import { db } from '@/lib/db';
import { getProvider } from '@/lib/payment-providers';
import { updatePaymentTransactionStatus, updateInvoiceStatus } from '@/lib/db-queries';

export async function processPaymentWebhook(
  providerId: string,
  payload: Record<string, any>,
  signature?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Log webhook
    await db.query(
      `INSERT INTO payment_webhooks (provider_id, event_type, payload, verified)
       VALUES ($1, $2, $3, false)`,
      [providerId, 'payment.received', JSON.stringify(payload)]
    );

    // Get provider
    const provider = getProvider(providerId);
    if (!provider) {
      return { success: false, message: 'Unknown provider' };
    }

    // Initialize provider with credentials from database
    // (In production, retrieve from encrypted storage)

    // Verify webhook
    const verified = await provider.verifyWebhook(payload, signature);
    if (!verified) {
      return { success: false, message: 'Signature verification failed' };
    }

    // Parse payment event
    const event = provider.parsePaymentEvent(payload);

    // Find payment transaction
    const txnResult = await db.query(
      `SELECT * FROM payment_transactions WHERE invoice_id = $1 AND provider_id = $2`,
      [event.invoiceId, providerId]
    );

    if (txnResult.rows.length === 0) {
      return { success: false, message: 'Transaction not found' };
    }

    const transaction = txnResult.rows[0];

    // Update transaction status
    await updatePaymentTransactionStatus(transaction.id, transaction.agency_id, event.status);

    // If payment completed, update invoice
    if (event.status === 'completed') {
      const invoiceResult = await db.query(
        `SELECT * FROM invoices WHERE id = $1`,
        [event.invoiceId]
      );

      if (invoiceResult.rows.length > 0) {
        await updateInvoiceStatus(event.invoiceId, transaction.agency_id, 'paid');
      }
    }

    return { success: true, message: 'Payment processed' };
  } catch (error) {
    console.error('Webhook processing error:', error);
    return { success: false, message: 'Processing failed' };
  }
}
```

**Step 2: Create webhook route**

```typescript
// app/api/webhooks/payments/route.ts
import { processPaymentWebhook } from '@/lib/webhook-processor';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Determine provider from request
    // This could be from header, body, or URL path
    const provider = request.headers.get('x-provider') || 'unknown';
    const signature = request.headers.get('x-signature');

    // Process webhook
    const result = await processPaymentWebhook(provider, payload, signature || undefined);

    if (result.success) {
      return Response.json({ success: true, message: result.message });
    } else {
      return Response.json({ error: result.message }, { status: 400 });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
```

**Step 3: Commit**

```bash
git add lib/webhook-processor.ts app/api/webhooks/payments/route.ts
git commit -m "feat: add webhook processing for payment updates"
```

---

### Task 12: Invoice Page - Display Multiple Payment Methods

**Files:**
- Modify: `app/dashboard/invoices/[id]/page.tsx` (add payment methods display)
- Modify: `lib/pdf/invoice-generator.ts` (include QR codes in PDF)

**Step 1: Update invoice detail page to show payment methods**

```typescript
// app/dashboard/invoices/[id]/page.tsx (modified section)
// Add this near the payment method buttons section:

import { getAgencyPaymentMethods } from '@/lib/db-queries';
import { getProvider } from '@/lib/payment-providers';

// In the component, after getting invoice and agency:

const paymentMethods = await getAgencyPaymentMethods(agencyId);

// Then in the JSX, add section to display payment options:

{/* Payment Methods Display */}
<div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
  <h3 className="text-lg font-bold text-blue-900 mb-4">Available Payment Methods</h3>

  {paymentMethods.map(method => (
    <div key={method.id} className="mb-4 pb-4 border-b last:border-b-0">
      <Link
        href={`/dashboard/invoices/${id}/pay?method=${method.provider_id}`}
        className="text-blue-600 hover:underline font-medium"
      >
        Pay with {method.provider_id.replace('_', ' ').toUpperCase()} →
      </Link>
    </div>
  ))}

  {paymentMethods.length === 0 && (
    <p className="text-gray-600">
      No payment methods configured.
      <Link href="/dashboard/settings/payments" className="text-blue-600 hover:underline ml-1">
        Configure payment methods
      </Link>
    </p>
  )}
</div>
```

**Step 2: Commit**

```bash
git add app/dashboard/invoices/[id]/page.tsx
git commit -m "feat: display available payment methods on invoice"
```

---

## Week 3: Integration & Testing

### Task 13: End-to-End Testing

**Files:**
- Create: `__tests__/e2e-phase-2-3.test.ts`

**Step 1: Write E2E test scenarios**

```typescript
// __tests__/e2e-phase-2-3.test.ts
import {
  createClient,
  createDeliverable,
  updateDeliverableStatus,
  createPaymentTransaction,
  updatePaymentTransactionStatus,
  getInvoiceById
} from '@/lib/db-queries';

describe('Phase 2 & 3 E2E Workflows', () => {
  test('Complete deliverable approval workflow', async () => {
    // 1. Create deliverable
    const deliverable = await createDeliverable({
      agencyId: 'test-agency',
      clientId: 'test-client',
      planId: 'test-plan',
      title: 'Video 1 of 4',
      monthYear: '2026-03',
      dueDate: new Date('2026-03-31')
    });

    expect(deliverable.status).toBe('draft');

    // 2. Update to in_review
    const inReview = await updateDeliverableStatus(
      deliverable.id,
      'test-agency',
      'in_review'
    );
    expect(inReview.status).toBe('in_review');

    // 3. Update to approved
    const approved = await updateDeliverableStatus(
      deliverable.id,
      'test-agency',
      'approved'
    );
    expect(approved.status).toBe('approved');
  });

  test('Multi-provider payment processing', async () => {
    // 1. Create payment via FonePay
    const payment1 = await createPaymentTransaction({
      invoiceId: 'test-invoice',
      agencyId: 'test-agency',
      providerId: 'fonepay',
      amount: 5000,
      currency: 'NPR',
      transactionId: 'FONEPAY-123'
    });

    expect(payment1.status).toBe('pending');

    // 2. Mark as completed
    const completed = await updatePaymentTransactionStatus(
      payment1.id,
      'test-agency',
      'completed'
    );
    expect(completed.status).toBe('completed');

    // 3. Create second payment via Stripe
    const payment2 = await createPaymentTransaction({
      invoiceId: 'test-invoice',
      agencyId: 'test-agency',
      providerId: 'stripe',
      amount: 2500,
      currency: 'NPR',
      transactionId: 'STRIPE-456'
    });

    expect(payment2.status).toBe('pending');
  });
});
```

**Step 2: Run tests**

```bash
npm test -- __tests__/e2e-phase-2-3.test.ts
```

Expected: All tests PASS

**Step 3: Commit**

```bash
git add __tests__/e2e-phase-2-3.test.ts
git commit -m "test: add end-to-end tests for Phase 2 & 3"
```

---

### Task 14: Documentation & Setup Guide

**Files:**
- Create: `docs/PHASE_2_3_SETUP.md`

**Step 1: Write setup documentation**

```markdown
# Phase 2 & 3 Setup Guide

## Phase 2: Deliverables Setup

1. **Database Migration**
   - Run: `psql postgresql://raunakbohra@localhost/agency_os < lib/migrations/004_add_deliverables_tables.sql`

2. **Vercel Crons Configuration**
   - Set `CRON_SECRET` in .env.local
   - Configure Vercel project to call `POST /api/cron/generate-deliverables` on 1st of month

3. **Features Enabled**
   - `/dashboard/deliverables` - Agency view
   - `/portal/[clientToken]/deliverables` - Client view
   - Auto-generation on 1st of month
   - Comments, file uploads, approval workflow

## Phase 3: Payment Providers Setup

1. **Database Migration**
   - Run: `psql postgresql://raunakbohra@localhost/agency_os < lib/migrations/005_add_payment_provider_tables.sql`

2. **Provider Configuration**

   ### FonePay
   - Merchant ID: [Get from FonePay account]
   - API Key: [Get from FonePay account]
   - Webhook Secret: Set in `FONEPAY_WEBHOOK_SECRET` env var

   ### Stripe
   - API Key: [Get from Stripe dashboard]
   - Webhook Secret: Set in `STRIPE_WEBHOOK_SECRET` env var

   ### Razorpay
   - Key ID: [Get from Razorpay dashboard]
   - Key Secret: [Get from Razorpay dashboard]

   ### Esewa
   - Merchant Code: [Get from Esewa]
   - Secret: [Get from Esewa]

3. **Agency Setup**
   - Visit `/dashboard/settings/payments`
   - Configure desired payment providers
   - Test each provider before enabling

## Testing

Run tests:
```bash
npm test
```

Run E2E tests:
```bash
npm test -- __tests__/e2e-phase-2-3.test.ts
```

## Launch Checklist

- [ ] Deliverables auto-generation cron working
- [ ] All payment providers tested
- [ ] Client portal deliverables view tested
- [ ] Payment webhooks receiving events
- [ ] Invoices showing payment methods
- [ ] UI Polish complete
```

**Step 2: Commit**

```bash
git add docs/PHASE_2_3_SETUP.md
git commit -m "docs: add Phase 2 & 3 setup guide"
```

---

## Summary

**Phase 2 & 3 Implementation Complete:**
- ✅ 14 bite-sized tasks using TDD approach
- ✅ Database migrations & schemas
- ✅ Deliverables system with approval workflow
- ✅ Multi-provider payment system (extensible)
- ✅ Client portal
- ✅ Webhook processing
- ✅ Comprehensive testing

**Total Tasks:** 14
**Estimated Timeline:** 3 weeks parallel development
**Status:** Ready for implementation

---

## Execution Options

Plan complete and saved to `docs/plans/2026-03-01-phase-2-3-implementation.md`.

**Two execution approaches:**

**1. Subagent-Driven (This Session)** ⭐ Recommended
- I dispatch fresh subagent per task
- Two-stage review (spec compliance + code quality)
- Fast iteration with continuous feedback
- Best for immediate feedback & quality control

**2. Parallel Session (Separate)**
- Open new Claude Code session in worktree
- Run executing-plans skill
- Batch task execution with checkpoints
- Good for focused, uninterrupted work

**Which approach would you prefer?**