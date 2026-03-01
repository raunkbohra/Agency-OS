import {
  createScopeAlert,
  getScopeAlertsByClient,
  acknowledgeScopeAlert,
  calculateClientRiskScore
} from '@/lib/db-queries';
import {
  createAgency,
  createClient,
  createPlan,
  createClientPlan
} from '@/lib/db-queries';
import { v4 as uuidv4 } from 'uuid';

describe('Scope Alert Queries', () => {
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

  test('createScopeAlert stores alert with overage percentage', async () => {
    const alert = await createScopeAlert({
      agencyId,
      clientId,
      alertType: 'over_scope',
      thresholdExceeded: 0.75
    });
    expect(parseFloat(alert.threshold_exceeded as any)).toBe(0.75);
    expect(alert.status).toBe('active');
  });

  test('getScopeAlertsByClient returns active alerts', async () => {
    const alerts = await getScopeAlertsByClient(clientId, agencyId);
    expect(Array.isArray(alerts)).toBe(true);
  });

  test('acknowledgeScopeAlert marks alert as dismissed', async () => {
    const alert = await createScopeAlert({
      agencyId,
      clientId,
      alertType: 'over_scope',
      thresholdExceeded: 0.75
    });
    const dismissed = await acknowledgeScopeAlert(alert.id, agencyId);
    expect(dismissed.status).toBe('acknowledged');
  });

  test('calculateClientRiskScore computes risk from alert history', async () => {
    const risk = await calculateClientRiskScore(clientId, agencyId);
    expect(typeof risk).toBe('number');
    expect(risk).toBeGreaterThanOrEqual(0);
    expect(risk).toBeLessThanOrEqual(100);
  });
});
