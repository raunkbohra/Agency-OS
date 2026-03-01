import {
  uploadContract,
  signContract,
  getContractsByClient,
  getContractById,
  createAgency,
  createClient,
  createPlan,
  createClientPlan
} from '@/lib/db-queries';
import { v4 as uuidv4 } from 'uuid';

describe('Contract DB Queries', () => {
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

  test('uploadContract stores contract metadata', async () => {
    const result = await uploadContract({
      agencyId,
      clientId,
      clientPlanId,
      fileName: 'contract.pdf',
      fileUrl: 's3://bucket/contract.pdf',
      fileSize: 2048
    });
    expect(result.file_name).toBe('contract.pdf');
    expect(result.signed).toBe(false);
  });

  test('signContract captures signature with audit data', async () => {
    const contract = await uploadContract({
      agencyId,
      clientId,
      clientPlanId,
      fileName: 'contract.pdf',
      fileUrl: 's3://bucket/contract.pdf'
    });

    const signed = await signContract(contract.id, agencyId, {
      signerName: 'John Doe',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0'
    });

    expect(signed.signed).toBe(true);
    expect(signed.signed_at).toBeDefined();
  });

  test('getContractsByClient returns all client contracts', async () => {
    const contracts = await getContractsByClient(clientId, agencyId);
    expect(Array.isArray(contracts)).toBe(true);
  });
});
