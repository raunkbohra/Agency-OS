import {
  uploadContract,
  signContract,
  createScopeAlert,
  createAgency,
  createClient,
  createPlan,
  createClientPlan
} from '@/lib/db-queries';
import { calculateFinancialMetrics, calculateOperationalMetrics } from '@/lib/metrics-calculator';
import { checkForScopeCreep } from '@/lib/scope-checker';
import { v4 as uuidv4 } from 'uuid';

describe('Phase 4 End-to-End Workflows', () => {
  let agencyId: string;
  let clientId: string;
  let clientPlanId: string;

  beforeAll(async () => {
    const ownerId = uuidv4();
    const agency = await createAgency('Test Agency', ownerId);
    agencyId = agency.id;

    const client = await createClient(agencyId, 'Test Client', 'test@example.com');
    clientId = client.id;

    const plan = await createPlan(agencyId, 'Test Plan', 5000, 'monthly');
    const clientPlan = await createClientPlan(clientId, plan.id);
    clientPlanId = clientPlan.id;
  });

  test('Complete contract workflow: upload → sign → scope check', async () => {
    // Upload contract
    const contract = await uploadContract({
      agencyId,
      clientId,
      clientPlanId,
      fileName: 'contract.pdf',
      fileUrl: 's3://bucket/contract.pdf',
      fileSize: 2048
    });

    expect(contract.signed).toBe(false);

    // Sign contract
    const signed = await signContract(contract.id, agencyId, {
      signerName: 'John Doe',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0'
    });

    expect(signed.signed).toBe(true);
    expect(signed.signed_at).toBeDefined();

    // Scope check (should not create alerts if within limits)
    await checkForScopeCreep(clientId, agencyId, clientPlanId);
  });

  test('Financial metrics calculation', async () => {
    const metrics = await calculateFinancialMetrics(agencyId);

    expect(typeof metrics.mrr).toBe('number');
    expect(typeof metrics.arr).toBe('number');
    expect(typeof metrics.collectionRate).toBe('number');
    expect(metrics.arr).toBe(metrics.mrr * 12);
  });

  test('Operational metrics calculation', async () => {
    const metrics = await calculateOperationalMetrics(agencyId);

    expect(typeof metrics.completionPercentage).toBe('number');
    expect(typeof metrics.onTimePercentage).toBe('number');
    expect(typeof metrics.avgDaysToComplete).toBe('number');
    expect(metrics.completionPercentage).toBeLessThanOrEqual(100);
  });

  test('Scope alert creation during contract lifecycle', async () => {
    const alert = await createScopeAlert({
      agencyId,
      clientId,
      alertType: 'over_scope',
      thresholdExceeded: 0.6
    });

    expect(alert.alert_type).toBe('over_scope');
    expect(parseFloat(alert.threshold_exceeded as any)).toBe(0.6);
    expect(alert.status).toBe('active');
  });
});
