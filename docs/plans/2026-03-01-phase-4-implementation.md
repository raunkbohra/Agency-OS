# Phase 4 Implementation Plan: Contracts + Scope Control + Metrics + Polish

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Add contracts with digital signatures, scope creep alerts, business metrics dashboard, and production polish to make Agency OS launch-ready.

**Architecture:**
Contracts system stores PDFs with immutable digital signatures (name + date + audit trail) and links to client plans for scope baseline. Scope alerts calculate deliverable overage in real-time and trigger notifications. Metrics dashboard aggregates financial data (MRR, collection rate) and operational metrics (completion %, on-time delivery, risk score). Polish phase adds caching, pagination, error handling, responsive design, and comprehensive tests.

**Tech Stack:** Next.js 15, PostgreSQL, Vercel Blob for file storage, Server Actions, Tailwind CSS, Chart.js for graphs

**Timeline:** 2 weeks (10 days of development, sequential feature rollout)

---

## Week 1: Contracts + Scope Alerts

### Task 1: Database Migration - Contracts Tables

**Files:**
- Create: `lib/migrations/006_add_contracts_tables.sql`

**Step 1: Write migration**

```sql
-- lib/migrations/006_add_contracts_tables.sql

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  client_plan_id UUID NOT NULL REFERENCES client_plans(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INT,
  signed BOOLEAN DEFAULT false,
  signed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE contract_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  signed_date TIMESTAMP NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE scope_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  deliverable_id UUID REFERENCES deliverables(id),
  alert_type TEXT,
  threshold_exceeded DECIMAL,
  status TEXT DEFAULT 'active',
  dismissed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_contracts_client_id ON contracts(client_id);
CREATE INDEX idx_contracts_signed ON contracts(signed);
CREATE INDEX idx_scope_alerts_client_id ON scope_alerts(client_id);
CREATE INDEX idx_scope_alerts_status ON scope_alerts(status);
```

**Step 2: Run migration**

```bash
psql postgresql://raunakbohra@localhost/agency_os < lib/migrations/006_add_contracts_tables.sql
```

Expected: Tables created successfully

**Step 3: Commit**

```bash
git add lib/migrations/006_add_contracts_tables.sql
git commit -m "migration: add contracts and scope alerts tables"
```

---

### Task 2: Contract Database Queries

**Files:**
- Modify: `lib/db-queries.ts` (add contract functions)
- Test: `__tests__/contract-db-queries.test.ts`

**Step 1: Write failing tests**

```typescript
// __tests__/contract-db-queries.test.ts
import {
  uploadContract,
  signContract,
  getContractsByClient,
  getContractById
} from '@/lib/db-queries';

describe('Contract DB Queries', () => {
  test('uploadContract stores contract metadata', async () => {
    const result = await uploadContract({
      agencyId: 'test-agency',
      clientId: 'test-client',
      clientPlanId: 'test-plan',
      fileName: 'contract.pdf',
      fileUrl: 's3://bucket/contract.pdf',
      fileSize: 2048
    });
    expect(result.file_name).toBe('contract.pdf');
    expect(result.signed).toBe(false);
  });

  test('signContract captures signature with audit data', async () => {
    const contract = await uploadContract({
      agencyId: 'test-agency',
      clientId: 'test-client',
      clientPlanId: 'test-plan',
      fileName: 'contract.pdf',
      fileUrl: 's3://bucket/contract.pdf'
    });

    const signed = await signContract(contract.id, 'test-agency', {
      signerName: 'John Doe',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0'
    });

    expect(signed.signed).toBe(true);
    expect(signed.signed_at).toBeDefined();
  });

  test('getContractsByClient returns all client contracts', async () => {
    const contracts = await getContractsByClient('test-client', 'test-agency');
    expect(Array.isArray(contracts)).toBe(true);
  });
});
```

**Step 2: Run tests (expect fail)**

```bash
npm test -- __tests__/contract-db-queries.test.ts
```

Expected: All tests fail with "function not found"

**Step 3: Add TypeScript interfaces**

```typescript
// lib/db-queries.ts

export interface Contract {
  id: string;
  agency_id: string;
  client_id: string;
  client_plan_id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  signed: boolean;
  signed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ContractSignature {
  id: string;
  contract_id: string;
  signer_name: string;
  signed_date: Date;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}
```

**Step 4: Implement functions**

```typescript
// lib/db-queries.ts

export async function uploadContract(data: {
  agencyId: string;
  clientId: string;
  clientPlanId: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
}): Promise<Contract> {
  const result = await db.query(
    `INSERT INTO contracts (agency_id, client_id, client_plan_id, file_name, file_url, file_size)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [data.agencyId, data.clientId, data.clientPlanId, data.fileName, data.fileUrl, data.fileSize]
  );
  return result.rows[0];
}

export async function signContract(
  id: string,
  agencyId: string,
  data: {
    signerName: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<Contract> {
  const signedDate = new Date();

  // Create signature record
  await db.query(
    `INSERT INTO contract_signatures (contract_id, signer_name, signed_date, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, data.signerName, signedDate, data.ipAddress, data.userAgent]
  );

  // Update contract as signed
  const result = await db.query(
    `UPDATE contracts SET signed = true, signed_at = NOW() WHERE id = $1 AND agency_id = $2 RETURNING *`,
    [id, agencyId]
  );
  return result.rows[0];
}

export async function getContractsByClient(clientId: string, agencyId: string): Promise<Contract[]> {
  const result = await db.query(
    `SELECT * FROM contracts WHERE client_id = $1 AND agency_id = $2 ORDER BY created_at DESC`,
    [clientId, agencyId]
  );
  return result.rows;
}

export async function getContractById(id: string, agencyId: string): Promise<Contract | null> {
  const result = await db.query(
    `SELECT * FROM contracts WHERE id = $1 AND agency_id = $2`,
    [id, agencyId]
  );
  return result.rows[0] || null;
}

export async function getContractSignatures(contractId: string): Promise<ContractSignature[]> {
  const result = await db.query(
    `SELECT * FROM contract_signatures WHERE contract_id = $1 ORDER BY created_at DESC`,
    [contractId]
  );
  return result.rows;
}
```

**Step 5: Run tests (expect pass)**

```bash
npm test -- __tests__/contract-db-queries.test.ts
```

Expected: All tests PASS

**Step 6: Commit**

```bash
git add lib/db-queries.ts __tests__/contract-db-queries.test.ts
git commit -m "feat: add contract database operations"
```

---

### Task 3: Scope Alert Database Queries

**Files:**
- Modify: `lib/db-queries.ts` (add scope alert functions)
- Test: `__tests__/scope-alert-db-queries.test.ts`

**Step 1: Write failing tests**

```typescript
// __tests__/scope-alert-db-queries.test.ts
import {
  createScopeAlert,
  getScopeAlertsByClient,
  acknowledgeScopeAlert,
  calculateClientRiskScore
} from '@/lib/db-queries';

describe('Scope Alert Queries', () => {
  test('createScopeAlert stores alert with overage percentage', async () => {
    const alert = await createScopeAlert({
      agencyId: 'test-agency',
      clientId: 'test-client',
      alertType: 'over_scope',
      thresholdExceeded: 0.75
    });
    expect(alert.threshold_exceeded).toBe(0.75);
    expect(alert.status).toBe('active');
  });

  test('getScopeAlertsByClient returns active alerts', async () => {
    const alerts = await getScopeAlertsByClient('test-client', 'test-agency');
    expect(Array.isArray(alerts)).toBe(true);
  });

  test('acknowledgeScopeAlert marks alert as dismissed', async () => {
    const alert = await createScopeAlert({
      agencyId: 'test-agency',
      clientId: 'test-client',
      alertType: 'over_scope',
      thresholdExceeded: 0.75
    });
    const dismissed = await acknowledgeScopeAlert(alert.id, 'test-agency');
    expect(dismissed.status).toBe('acknowledged');
  });

  test('calculateClientRiskScore computes risk from alert history', async () => {
    const risk = await calculateClientRiskScore('test-client', 'test-agency');
    expect(typeof risk).toBe('number');
    expect(risk).toBeGreaterThanOrEqual(0);
    expect(risk).toBeLessThanOrEqual(100);
  });
});
```

**Step 2: Run tests (expect fail)**

```bash
npm test -- __tests__/scope-alert-db-queries.test.ts
```

**Step 3: Add interfaces and implement**

```typescript
// lib/db-queries.ts

export interface ScopeAlert {
  id: string;
  agency_id: string;
  client_id: string;
  deliverable_id?: string;
  alert_type: string;
  threshold_exceeded: number;
  status: 'active' | 'acknowledged' | 'resolved';
  dismissed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export async function createScopeAlert(data: {
  agencyId: string;
  clientId: string;
  deliverableId?: string;
  alertType: string;
  thresholdExceeded: number;
}): Promise<ScopeAlert> {
  const result = await db.query(
    `INSERT INTO scope_alerts (agency_id, client_id, deliverable_id, alert_type, threshold_exceeded)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.agencyId, data.clientId, data.deliverableId, data.alertType, data.thresholdExceeded]
  );
  return result.rows[0];
}

export async function getScopeAlertsByClient(
  clientId: string,
  agencyId: string,
  onlyActive = true
): Promise<ScopeAlert[]> {
  const query = onlyActive
    ? `SELECT * FROM scope_alerts WHERE client_id = $1 AND agency_id = $2 AND status = 'active' ORDER BY created_at DESC`
    : `SELECT * FROM scope_alerts WHERE client_id = $1 AND agency_id = $2 ORDER BY created_at DESC`;

  const result = await db.query(query, [clientId, agencyId]);
  return result.rows;
}

export async function acknowledgeScopeAlert(id: string, agencyId: string): Promise<ScopeAlert> {
  const result = await db.query(
    `UPDATE scope_alerts SET status = 'acknowledged', dismissed_at = NOW() WHERE id = $1 AND agency_id = $2 RETURNING *`,
    [id, agencyId]
  );
  return result.rows[0];
}

export async function calculateClientRiskScore(clientId: string, agencyId: string): Promise<number> {
  const result = await db.query(
    `SELECT COUNT(*) as alert_count, AVG(threshold_exceeded) as avg_overage
     FROM scope_alerts
     WHERE client_id = $1 AND agency_id = $2 AND status = 'active'`,
    [clientId, agencyId]
  );

  const row = result.rows[0];
  const alertCount = parseInt(row.alert_count) || 0;
  const avgOverage = parseFloat(row.avg_overage) || 0;

  // Risk score: (alert count * 10) + (avg overage * 100)
  const risk = Math.min((alertCount * 10) + (avgOverage * 100), 100);
  return Math.round(risk);
}
```

**Step 4: Run tests (expect pass)**

```bash
npm test -- __tests__/scope-alert-db-queries.test.ts
```

**Step 5: Commit**

```bash
git add lib/db-queries.ts __tests__/scope-alert-db-queries.test.ts
git commit -m "feat: add scope alert calculation and tracking"
```

---

### Task 4: Scope Alert Detection on Deliverable Changes

**Files:**
- Create: `lib/scope-checker.ts`
- Modify: `app/api/deliverables/[id]/route.ts` (trigger scope check)

**Step 1: Create scope checking logic**

```typescript
// lib/scope-checker.ts
import { db } from '@/lib/db';
import {
  getPlanItems,
  getDeliverablesByClient,
  createScopeAlert,
  getScopeAlertsByClient
} from '@/lib/db-queries';

export async function checkForScopeCreep(
  clientId: string,
  agencyId: string,
  clientPlanId: string
): Promise<void> {
  try {
    // Get plan items (planned deliverables)
    const planResult = await db.query(
      `SELECT id FROM plans WHERE id IN (
        SELECT plan_id FROM client_plans WHERE id = $1
      )`,
      [clientPlanId]
    );

    if (planResult.rows.length === 0) return;

    const planId = planResult.rows[0].id;
    const planItems = await getPlanItems(planId);

    // Get actual deliverables
    const deliverables = await getDeliverablesByClient(clientId, agencyId);

    // For each plan item, count actual deliverables
    for (const planItem of planItems) {
      const planned = 1; // Each plan_item represents 1 planned deliverable
      const actual = deliverables.filter(
        d => d.title.includes(planItem.deliverable_type)
      ).length;

      // Check threshold: >50% overage
      const overage = (actual - planned) / planned;

      if (overage > 0.5) {
        // Check if alert already exists
        const existing = await getScopeAlertsByClient(clientId, agencyId);
        const alertExists = existing.some(
          a => a.deliverable_id === planItem.id && a.status === 'active'
        );

        if (!alertExists) {
          // Create alert
          await createScopeAlert({
            agencyId,
            clientId,
            deliverableId: planItem.id,
            alertType: 'over_scope',
            thresholdExceeded: overage
          });

          // TODO: Send email notification
        }
      }
    }
  } catch (error) {
    console.error('Scope check error:', error);
  }
}
```

**Step 2: Modify deliverable API to trigger scope check**

```typescript
// app/api/deliverables/[id]/route.ts (add to PATCH handler)

import { checkForScopeCreep } from '@/lib/scope-checker';

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

    // Trigger scope check
    if (updated.client_id && updated.status === 'in_review') {
      const clientPlanResult = await db.query(
        `SELECT id FROM client_plans WHERE client_id = $1 LIMIT 1`,
        [updated.client_id]
      );

      if (clientPlanResult.rows.length > 0) {
        await checkForScopeCreep(
          updated.client_id,
          session.user.agencyId,
          clientPlanResult.rows[0].id
        );
      }
    }

    return Response.json(updated);
  } catch (error) {
    console.error('Error updating deliverable:', error);
    return Response.json({ error: 'Failed to update deliverable' }, { status: 500 });
  }
}
```

**Step 3: Commit**

```bash
git add lib/scope-checker.ts app/api/deliverables/[id]/route.ts
git commit -m "feat: add real-time scope creep detection"
```

---

### Task 5: Contract Upload & Signing Pages

**Files:**
- Create: `app/dashboard/contracts/page.tsx`
- Create: `app/dashboard/contracts/upload/page.tsx`
- Create: `components/ContractsList.tsx`
- Create: `app/api/contracts/upload/route.ts`
- Create: `app/api/contracts/[id]/sign/route.ts`

**Step 1: Create contracts list page**

```typescript
// app/dashboard/contracts/page.tsx
import { auth } from '@/lib/auth';
import { getAgenciesByOwnerId } from '@/lib/db-queries';
import ContractsList from '@/components/ContractsList';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function ContractsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const agencies = await getAgenciesByOwnerId(session.user.id);
  const agencyId = agencies[0]?.id;

  if (!agencyId) {
    return <div className="p-8">No agency found</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Contracts</h1>
          <p className="text-gray-600 mt-1">Manage client contracts and signatures</p>
        </div>
        <Link
          href="/dashboard/contracts/upload"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
        >
          Upload Contract
        </Link>
      </div>

      <ContractsList agencyId={agencyId} />
    </div>
  );
}
```

**Step 2: Create upload page**

```typescript
// app/dashboard/contracts/upload/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ContractUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [clientId, setClientId] = useState('');
  const [clientPlanId, setClientPlanId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!file || !clientId || !clientPlanId) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientId', clientId);
      formData.append('clientPlanId', clientPlanId);

      const res = await fetch('/api/contracts/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        router.push('/dashboard/contracts');
      } else {
        const data = await res.json();
        setError(data.error || 'Upload failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Upload Contract</h1>

      <form onSubmit={handleUpload} className="bg-white rounded-lg p-6 border">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-800 rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block font-semibold mb-2">Contract PDF</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="border rounded p-2 w-full"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-2">Client</label>
          <input
            type="text"
            placeholder="Client ID"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="border rounded p-2 w-full"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block font-semibold mb-2">Client Plan</label>
          <input
            type="text"
            placeholder="Client Plan ID"
            value={clientPlanId}
            onChange={(e) => setClientPlanId(e.target.value)}
            className="border rounded p-2 w-full"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:bg-gray-400"
        >
          {loading ? 'Uploading...' : 'Upload Contract'}
        </button>
      </form>
    </div>
  );
}
```

**Step 3: Create upload API endpoint**

```typescript
// app/api/contracts/upload/route.ts
import { auth } from '@/lib/auth';
import { uploadContract } from '@/lib/db-queries';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clientId = formData.get('clientId') as string;
    const clientPlanId = formData.get('clientPlanId') as string;

    if (!file || !clientId || !clientPlanId) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    // TODO: Upload to Vercel Blob
    // For now, generate a mock URL
    const fileUrl = `https://blob.vercel.com/${uuidv4()}`;

    const contract = await uploadContract({
      agencyId: session.user.agencyId,
      clientId,
      clientPlanId,
      fileName: file.name,
      fileUrl,
      fileSize: file.size
    });

    return Response.json(contract);
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: 'Failed to upload contract' }, { status: 500 });
  }
}
```

**Step 4: Create sign API endpoint**

```typescript
// app/api/contracts/[id]/sign/route.ts
import { auth } from '@/lib/auth';
import { signContract, getContractById } from '@/lib/db-queries';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { signerName, clientId, agencyId } = await request.json();

    // Get client token from somewhere (or use clientId directly for now)
    const contract = await getContractById(params.id, agencyId);

    if (!contract) {
      return Response.json({ error: 'Contract not found' }, { status: 404 });
    }

    const signed = await signContract(params.id, agencyId, {
      signerName,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return Response.json(signed);
  } catch (error) {
    console.error('Sign error:', error);
    return Response.json({ error: 'Failed to sign contract' }, { status: 500 });
  }
}
```

**Step 5: Create list component**

```typescript
// components/ContractsList.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Contract {
  id: string;
  client_id: string;
  file_name: string;
  signed: boolean;
  signed_at?: string;
  created_at: string;
}

export default function ContractsList({ agencyId }: { agencyId: string }) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContracts = async () => {
      const res = await fetch(`/api/contracts?agencyId=${agencyId}`);
      const data = await res.json();
      setContracts(data);
      setLoading(false);
    };
    fetchContracts();
  }, [agencyId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left font-semibold">File</th>
            <th className="px-6 py-3 text-left font-semibold">Client</th>
            <th className="px-6 py-3 text-left font-semibold">Status</th>
            <th className="px-6 py-3 text-left font-semibold">Signed Date</th>
            <th className="px-6 py-3 text-left font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map(contract => (
            <tr key={contract.id} className="border-t">
              <td className="px-6 py-3">{contract.file_name}</td>
              <td className="px-6 py-3">{contract.client_id}</td>
              <td className="px-6 py-3">
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  contract.signed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {contract.signed ? 'Signed' : 'Pending'}
                </span>
              </td>
              <td className="px-6 py-3">
                {contract.signed_at ? new Date(contract.signed_at).toLocaleDateString() : 'N/A'}
              </td>
              <td className="px-6 py-3">
                <Link href={`/contracts/${contract.id}`} className="text-blue-600 hover:underline">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Step 6: Commit**

```bash
git add app/dashboard/contracts/ components/ContractsList.tsx app/api/contracts/
git commit -m "feat: add contract upload and signing system"
```

---

## Week 2: Metrics Dashboard + Polish

### Task 6: Metrics Database Queries

**Files:**
- Modify: `lib/db-queries.ts` (add metrics functions)
- Create: `lib/metrics-calculator.ts`

**Step 1: Create metrics calculator**

```typescript
// lib/metrics-calculator.ts
import { db } from '@/lib/db';
import { calculateClientRiskScore } from '@/lib/db-queries';

export interface FinancialMetrics {
  mrr: number;
  arr: number;
  collectionRate: number;
  outstandingValue: number;
}

export interface OperationalMetrics {
  completionPercentage: number;
  onTimePercentage: number;
  avgDaysToComplete: number;
}

export async function calculateFinancialMetrics(agencyId: string): Promise<FinancialMetrics> {
  // MRR: Sum of active client plan prices
  const mrrResult = await db.query(
    `SELECT COALESCE(SUM(p.price), 0) as total FROM client_plans cp
     JOIN plans p ON cp.plan_id = p.id
     WHERE cp.client_id IN (SELECT id FROM clients WHERE agency_id = $1)
     AND cp.status = 'active'`,
    [agencyId]
  );
  const mrr = parseFloat(mrrResult.rows[0].total) || 0;

  // Collection rate
  const collectionResult = await db.query(
    `SELECT
      COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid,
      COUNT(*) as total
     FROM invoices WHERE agency_id = $1`,
    [agencyId]
  );
  const collection = collectionResult.rows[0];
  const collectionRate = collection.total > 0 ? (collection.paid / collection.total) * 100 : 0;

  // Outstanding
  const outstandingResult = await db.query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM invoices
     WHERE agency_id = $1 AND status != 'paid'`,
    [agencyId]
  );
  const outstandingValue = parseFloat(outstandingResult.rows[0].total) || 0;

  return {
    mrr,
    arr: mrr * 12,
    collectionRate: Math.round(collectionRate),
    outstandingValue
  };
}

export async function calculateOperationalMetrics(agencyId: string): Promise<OperationalMetrics> {
  // Completion percentage
  const completionResult = await db.query(
    `SELECT
      COUNT(CASE WHEN status = 'done' THEN 1 END) as done,
      COUNT(*) as total
     FROM deliverables WHERE agency_id = $1`,
    [agencyId]
  );
  const completion = completionResult.rows[0];
  const completionPercentage = completion.total > 0 ? (completion.done / completion.total) * 100 : 0;

  // On-time delivery
  const onTimeResult = await db.query(
    `SELECT
      COUNT(CASE WHEN updated_at <= due_date THEN 1 END) as ontime,
      COUNT(*) as total
     FROM deliverables WHERE agency_id = $1 AND status = 'done'`,
    [agencyId]
  );
  const onTime = onTimeResult.rows[0];
  const onTimePercentage = onTime.total > 0 ? (onTime.ontime / onTime.total) * 100 : 0;

  // Avg days to complete
  const avgDaysResult = await db.query(
    `SELECT AVG(EXTRACT(DAY FROM (updated_at - created_at))) as avg_days
     FROM deliverables WHERE agency_id = $1 AND status = 'done'`,
    [agencyId]
  );
  const avgDaysToComplete = Math.round(parseFloat(avgDaysResult.rows[0].avg_days) || 0);

  return {
    completionPercentage: Math.round(completionPercentage),
    onTimePercentage: Math.round(onTimePercentage),
    avgDaysToComplete
  };
}
```

**Step 2: Commit**

```bash
git add lib/metrics-calculator.ts
git commit -m "feat: add financial and operational metrics calculation"
```

---

### Task 7: Metrics Dashboard Page

**Files:**
- Create: `app/dashboard/metrics/page.tsx`
- Create: `components/MetricsDashboard.tsx`
- Create: `app/api/metrics/route.ts`

**Step 1: Create metrics API**

```typescript
// app/api/metrics/route.ts
import { auth } from '@/lib/auth';
import { getAgenciesByOwnerId } from '@/lib/db-queries';
import { calculateFinancialMetrics, calculateOperationalMetrics } from '@/lib/metrics-calculator';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const agencies = await getAgenciesByOwnerId(session.user.id);
    const agencyId = agencies[0]?.id;

    if (!agencyId) {
      return Response.json({ error: 'No agency found' }, { status: 404 });
    }

    const financialMetrics = await calculateFinancialMetrics(agencyId);
    const operationalMetrics = await calculateOperationalMetrics(agencyId);

    return Response.json({
      ...financialMetrics,
      ...operationalMetrics
    });
  } catch (error) {
    console.error('Metrics error:', error);
    return Response.json({ error: 'Failed to calculate metrics' }, { status: 500 });
  }
}
```

**Step 2: Create metrics dashboard page**

```typescript
// app/dashboard/metrics/page.tsx
import { auth } from '@/lib/auth';
import { getAgenciesByOwnerId } from '@/lib/db-queries';
import MetricsDashboard from '@/components/MetricsDashboard';
import { redirect } from 'next/navigation';

export default async function MetricsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const agencies = await getAgenciesByOwnerId(session.user.id);
  const agencyId = agencies[0]?.id;

  if (!agencyId) {
    return <div className="p-8">No agency found</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Business Metrics</h1>
      <p className="text-gray-600 mb-6">Track your agency's financial and operational performance</p>

      <MetricsDashboard agencyId={agencyId} />
    </div>
  );
}
```

**Step 3: Create dashboard component**

```typescript
// components/MetricsDashboard.tsx
'use client';

import { useEffect, useState } from 'react';

interface Metrics {
  mrr: number;
  arr: number;
  collectionRate: number;
  outstandingValue: number;
  completionPercentage: number;
  onTimePercentage: number;
  avgDaysToComplete: number;
}

export default function MetricsDashboard({ agencyId }: { agencyId: string }) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      const res = await fetch('/api/metrics');
      const data = await res.json();
      setMetrics(data);
      setLoading(false);
    };
    fetchMetrics();
  }, [agencyId]);

  if (loading) return <div>Loading metrics...</div>;
  if (!metrics) return <div>Failed to load metrics</div>;

  return (
    <div className="space-y-6">
      {/* Financial Metrics */}
      <div>
        <h2 className="text-xl font-bold mb-4">Financial Metrics</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg border">
            <p className="text-sm text-gray-600">Monthly Recurring Revenue</p>
            <p className="text-3xl font-bold mt-2">₹{Math.round(metrics.mrr).toLocaleString()}</p>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <p className="text-sm text-gray-600">Annual Recurring Revenue</p>
            <p className="text-3xl font-bold mt-2">₹{Math.round(metrics.arr).toLocaleString()}</p>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <p className="text-sm text-gray-600">Collection Rate</p>
            <p className="text-3xl font-bold mt-2">{metrics.collectionRate}%</p>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <p className="text-sm text-gray-600">Outstanding Invoices</p>
            <p className="text-3xl font-bold mt-2">₹{Math.round(metrics.outstandingValue).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Operational Metrics */}
      <div>
        <h2 className="text-xl font-bold mb-4">Operational Metrics</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg border">
            <p className="text-sm text-gray-600">Deliverable Completion</p>
            <p className="text-3xl font-bold mt-2">{metrics.completionPercentage}%</p>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <p className="text-sm text-gray-600">On-Time Delivery Rate</p>
            <p className="text-3xl font-bold mt-2">{metrics.onTimePercentage}%</p>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <p className="text-sm text-gray-600">Avg Days to Complete</p>
            <p className="text-3xl font-bold mt-2">{metrics.avgDaysToComplete} days</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add app/dashboard/metrics/ components/MetricsDashboard.tsx app/api/metrics/
git commit -m "feat: add business metrics dashboard"
```

---

### Task 8: Production Polish - Database Optimization

**Files:**
- Create: `lib/db-optimization.sql`
- Modify: Database connection for caching

**Step 1: Add database optimization SQL**

```sql
-- lib/db-optimization.sql
-- Add missing indexes for performance

CREATE INDEX IF NOT EXISTS idx_invoices_status_agency ON invoices(status, agency_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_month_year ON deliverables(month_year, agency_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status_agency ON payment_transactions(status, agency_id);
CREATE INDEX IF NOT EXISTS idx_clients_agency_created ON clients(agency_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date) WHERE status != 'paid';

-- Add database constraints for data integrity
ALTER TABLE invoices ADD CONSTRAINT check_valid_status CHECK (status IN ('draft', 'sent', 'payment_pending', 'paid'));
ALTER TABLE deliverables ADD CONSTRAINT check_deliverable_status CHECK (status IN ('draft', 'in_review', 'approved', 'changes_requested', 'done'));
```

**Step 2: Run optimization**

```bash
psql postgresql://raunakbohra@localhost/agency_os < lib/db-optimization.sql
```

**Step 3: Commit**

```bash
git add lib/db-optimization.sql
git commit -m "perf: add database indexes and constraints"
```

---

### Task 9: Production Polish - Error Handling & Testing

**Files:**
- Modify: All API routes (add comprehensive error handling)
- Create: `__tests__/end-to-end-phase-4.test.ts`

**Step 1: Add comprehensive tests**

```typescript
// __tests__/end-to-end-phase-4.test.ts
import {
  uploadContract,
  signContract,
  createScopeAlert,
  calculateFinancialMetrics,
  calculateOperationalMetrics
} from '@/lib/db-queries';
import { checkForScopeCreep } from '@/lib/scope-checker';

describe('Phase 4 End-to-End Workflows', () => {
  test('Complete contract workflow: upload → sign → scope check', async () => {
    // Upload contract
    const contract = await uploadContract({
      agencyId: 'test-agency',
      clientId: 'test-client',
      clientPlanId: 'test-plan',
      fileName: 'contract.pdf',
      fileUrl: 's3://bucket/contract.pdf',
      fileSize: 2048
    });

    expect(contract.signed).toBe(false);

    // Sign contract
    const signed = await signContract(contract.id, 'test-agency', {
      signerName: 'John Doe',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0'
    });

    expect(signed.signed).toBe(true);
    expect(signed.signed_at).toBeDefined();

    // Scope check (should not create alerts if within limits)
    await checkForScopeCreep('test-client', 'test-agency', 'test-plan');
  });

  test('Financial metrics calculation', async () => {
    const metrics = await calculateFinancialMetrics('test-agency');

    expect(typeof metrics.mrr).toBe('number');
    expect(typeof metrics.arr).toBe('number');
    expect(typeof metrics.collectionRate).toBe('number');
    expect(metrics.arr).toBe(metrics.mrr * 12);
  });

  test('Operational metrics calculation', async () => {
    const metrics = await calculateOperationalMetrics('test-agency');

    expect(typeof metrics.completionPercentage).toBe('number');
    expect(typeof metrics.onTimePercentage).toBe('number');
    expect(typeof metrics.avgDaysToComplete).toBe('number');
    expect(metrics.completionPercentage).toBeLessThanOrEqual(100);
  });
});
```

**Step 2: Run tests**

```bash
npm test -- __tests__/end-to-end-phase-4.test.ts
```

Expected: All tests PASS

**Step 3: Commit**

```bash
git add __tests__/end-to-end-phase-4.test.ts
git commit -m "test: add end-to-end Phase 4 tests"
```

---

### Task 10: Production Polish - Responsive Design & Mobile Testing

**Files:**
- Modify: All new pages for responsive design
- Create: `docs/LAUNCH_CHECKLIST.md`

**Step 1: Create launch checklist**

```markdown
# Launch Checklist for Phase 1-4

## Pre-Launch Verification

### Database & Migrations ✓
- [ ] All 6 migrations applied successfully
- [ ] Database constraints in place
- [ ] Indexes created for performance
- [ ] Backups configured

### Testing Coverage ✓
- [ ] 500+ unit tests passing
- [ ] 0 console errors in browser dev tools
- [ ] E2E workflows tested manually
- [ ] Mobile testing on iOS/Android
- [ ] Payment webhooks tested with sandbox

### Performance ✓
- [ ] All API endpoints <500ms
- [ ] Page load time <2s
- [ ] Database query optimization verified
- [ ] Caching strategy working

### Security ✓
- [ ] No XSS vulnerabilities
- [ ] No SQL injection risks
- [ ] Auth checks on all endpoints
- [ ] Rate limiting configured

### UI/UX Polish ✓
- [ ] Mobile navigation responsive
- [ ] Tables collapse to cards on phone
- [ ] Forms work on all screen sizes
- [ ] No horizontal scrolling
- [ ] Error messages user-friendly

### Features Complete ✓
- [ ] Contracts upload & signing
- [ ] Scope creep alerts working
- [ ] Metrics dashboard calculating
- [ ] All payment providers tested
- [ ] Email notifications configured

### Launch Day ✓
- [ ] Monitoring set up (Sentry/LogRocket)
- [ ] Error logging working
- [ ] Database backups scheduled
- [ ] Support channels ready
```

**Step 2: Commit checklist**

```bash
git add docs/LAUNCH_CHECKLIST.md
git commit -m "docs: add comprehensive launch checklist"
```

---

## Summary

**Phase 4 Implementation Complete:**
- ✅ 10 bite-sized tasks using TDD
- ✅ Contracts system with digital signatures
- ✅ Real-time scope creep detection (>50% threshold)
- ✅ Business metrics dashboard (financial + operational)
- ✅ Production polish (performance, error handling, testing)

**Total Tasks:** 10
**Estimated Timeline:** 2 weeks sequential development
**Status:** Ready for implementation

---

## Execution Options

Plan complete and saved to `docs/plans/2026-03-01-phase-4-implementation.md`.

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