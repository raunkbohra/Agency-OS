jest.mock('@/lib/db');

import { db } from '@/lib/db';
import {
  createPaymentTransaction,
  updatePaymentTransactionStatus,
  getPaymentTransactionsByInvoice,
  addAgencyPaymentMethod,
  getAgencyPaymentMethods,
  updateAgencyPaymentMethod,
} from '@/lib/db-queries';

describe('Payment DB Queries', () => {
  const testAgencyId = 'test-agency-id';
  const testInvoiceId = 'test-invoice-id';
  const testTransactionId = 'test-transaction-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentTransaction', () => {
    it('creates transaction with pending status', async () => {
      const mockTransaction = {
        id: testTransactionId,
        invoice_id: testInvoiceId,
        agency_id: testAgencyId,
        provider_id: 'stripe',
        amount: 5000,
        currency: 'NPR',
        status: 'pending',
        transaction_id: 'stripe-123',
        reference_id: null,
        webhook_payload: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockTransaction] });

      const result = await createPaymentTransaction({
        invoiceId: testInvoiceId,
        agencyId: testAgencyId,
        providerId: 'stripe',
        amount: 5000,
        currency: 'NPR',
        transactionId: 'stripe-123',
      });

      expect(result.status).toBe('pending');
      expect(result.provider_id).toBe('stripe');
      expect(db.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('updatePaymentTransactionStatus', () => {
    it('updates transaction status', async () => {
      const mockUpdated = {
        id: testTransactionId,
        agency_id: testAgencyId,
        status: 'completed',
      };

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUpdated] });

      const result = await updatePaymentTransactionStatus(testTransactionId, testAgencyId, 'completed');

      expect(result.status).toBe('completed');
    });
  });

  describe('getPaymentTransactionsByInvoice', () => {
    it('returns transactions for invoice', async () => {
      const mockTransactions = [
        { id: 'txn-1', invoice_id: testInvoiceId, status: 'pending' },
        { id: 'txn-2', invoice_id: testInvoiceId, status: 'completed' },
      ];

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: mockTransactions });

      const results = await getPaymentTransactionsByInvoice(testInvoiceId, testAgencyId);

      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(2);
    });
  });

  describe('addAgencyPaymentMethod', () => {
    it('adds payment method', async () => {
      const mockMethod = {
        id: 'method-1',
        agency_id: testAgencyId,
        provider_id: 'stripe',
        credentials: { apiKey: 'sk_test_123' },
        enabled: true,
        test_mode: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockMethod] });

      const result = await addAgencyPaymentMethod({
        agencyId: testAgencyId,
        providerId: 'stripe',
        credentials: { apiKey: 'sk_test_123' },
      });

      expect(result.provider_id).toBe('stripe');
      expect(result.enabled).toBe(true);
    });
  });

  describe('getAgencyPaymentMethods', () => {
    it('returns enabled payment methods for agency', async () => {
      const mockMethods = [
        { id: 'method-1', provider_id: 'stripe', enabled: true },
        { id: 'method-2', provider_id: 'razorpay', enabled: true },
      ];

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: mockMethods });

      const results = await getAgencyPaymentMethods(testAgencyId);

      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(2);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('enabled = true'),
        [testAgencyId]
      );
    });
  });

  describe('updateAgencyPaymentMethod', () => {
    it('updates method credentials and enabled status', async () => {
      const mockUpdated = {
        id: 'method-1',
        agency_id: testAgencyId,
        enabled: false,
      };

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUpdated] });

      const result = await updateAgencyPaymentMethod('method-1', testAgencyId, { enabled: false });

      expect(result.enabled).toBe(false);
    });
  });
});
