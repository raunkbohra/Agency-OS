/**
 * Test suite for payment database queries and API
 * Tests payment creation, status updates, and retrieval with proper multi-tenant isolation
 */

jest.mock('@/lib/db');

import {
  Payment,
  createPayment,
  updatePaymentStatus,
  getPaymentsByInvoice,
  getPaymentById,
} from '@/lib/db-queries';
import { db } from '@/lib/db';

// Mock implementations
describe('Payment Type Interface', () => {
  const testAgencyId = '550e8400-e29b-41d4-a716-446655440000';
  const testInvoiceId = '550e8400-e29b-41d4-a716-446655440001';
  const testPaymentId = '550e8400-e29b-41d4-a716-446655440002';

  it('should validate Payment interface structure', () => {
    const mockPayment: Payment = {
      id: testPaymentId,
      invoice_id: testInvoiceId,
      agency_id: testAgencyId,
      amount: '5000',
      provider: 'bank_transfer',
      status: 'pending',
      reference_id: 'TXN12345',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(mockPayment).toBeDefined();
    expect(mockPayment.id).toBe(testPaymentId);
    expect(mockPayment.agency_id).toBe(testAgencyId);
    expect(mockPayment.invoice_id).toBe(testInvoiceId);
    expect(mockPayment.status).toBe('pending');
    expect(mockPayment.provider).toBe('bank_transfer');
    expect(mockPayment.reference_id).toBe('TXN12345');
    expect(mockPayment.amount).toBe('5000');
  });
});

describe('Payment Database Query Functions', () => {
  const testAgencyId = '550e8400-e29b-41d4-a716-446655440000';
  const testInvoiceId = '550e8400-e29b-41d4-a716-446655440001';
  const testPaymentId = '550e8400-e29b-41d4-a716-446655440002';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create a payment with required parameters', async () => {
      const mockPayment: Payment = {
        id: testPaymentId,
        invoice_id: testInvoiceId,
        agency_id: testAgencyId,
        amount: '5000',
        provider: 'bank_transfer',
        status: 'pending',
        reference_id: 'TXN12345',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockPayment],
      });

      const result = await createPayment(testInvoiceId, testAgencyId, {
        amount: 5000,
        referenceId: 'TXN12345',
      });

      expect(result).toEqual(mockPayment);
      expect(result.status).toBe('pending');
      expect(result.provider).toBe('bank_transfer');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO payments'),
        expect.arrayContaining([testInvoiceId, testAgencyId, 5000])
      );
    });

    it('should throw error on database failure', async () => {
      const error = new Error('Database connection failed');
      (db.query as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        createPayment(testInvoiceId, testAgencyId, {
          amount: 5000,
          referenceId: 'TXN123',
        })
      ).rejects.toThrow('Failed to create payment');
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status', async () => {
      const mockPayment: Payment = {
        id: testPaymentId,
        invoice_id: testInvoiceId,
        agency_id: testAgencyId,
        amount: '5000',
        provider: 'bank_transfer',
        status: 'verified',
        reference_id: 'TXN12345',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockPayment],
      });

      const result = await updatePaymentStatus(testPaymentId, testAgencyId, 'verified');

      expect(result).toEqual(mockPayment);
      expect(result?.status).toBe('verified');
    });

    it('should return null when payment not found on update', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      const result = await updatePaymentStatus(testPaymentId, testAgencyId, 'verified');

      expect(result).toBeNull();
    });
  });

  describe('getPaymentsByInvoice', () => {
    it('should retrieve payments for an invoice', async () => {
      const mockPayment1: Payment = {
        id: testPaymentId,
        invoice_id: testInvoiceId,
        agency_id: testAgencyId,
        amount: '5000',
        provider: 'bank_transfer',
        status: 'pending',
        reference_id: 'TXN12345',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockPayment1],
      });

      const result = await getPaymentsByInvoice(testInvoiceId, testAgencyId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(testPaymentId);
    });

    it('should return empty array when no payments exist', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      const result = await getPaymentsByInvoice(testInvoiceId, testAgencyId);

      expect(result).toEqual([]);
    });
  });

  describe('getPaymentById', () => {
    it('should retrieve a payment by ID', async () => {
      const mockPayment: Payment = {
        id: testPaymentId,
        invoice_id: testInvoiceId,
        agency_id: testAgencyId,
        amount: '5000',
        provider: 'bank_transfer',
        status: 'pending',
        reference_id: 'TXN12345',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockPayment],
      });

      const result = await getPaymentById(testPaymentId, testAgencyId);

      expect(result).toEqual(mockPayment);
    });

    it('should return null when payment not found', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      const result = await getPaymentById(testPaymentId, testAgencyId);

      expect(result).toBeNull();
    });
  });

  describe('Multi-tenant Isolation', () => {
    it('should enforce agency_id in payment queries', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      await getPaymentById(testPaymentId, testAgencyId);

      const callArgs = (db.query as jest.Mock).mock.calls[0];
      expect(callArgs[1]).toContain(testAgencyId);
    });

    it('should only get payments for the specified agency', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      await getPaymentsByInvoice(testInvoiceId, testAgencyId);

      const callArgs = (db.query as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toContain('agency_id');
      expect(callArgs[1][1]).toBe(testAgencyId);
    });
  });

  describe('Payment Status Transitions', () => {
    it('should support status transition: pending -> verified', async () => {
      const mockPayment: Payment = {
        id: testPaymentId,
        invoice_id: testInvoiceId,
        agency_id: testAgencyId,
        amount: '5000',
        provider: 'bank_transfer',
        status: 'verified',
        reference_id: 'TXN12345',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockPayment],
      });

      const result = await updatePaymentStatus(testPaymentId, testAgencyId, 'verified');

      expect(result?.status).toBe('verified');
    });

    it('should support failed status', async () => {
      const mockPayment: Payment = {
        id: testPaymentId,
        invoice_id: testInvoiceId,
        agency_id: testAgencyId,
        amount: '5000',
        provider: 'bank_transfer',
        status: 'failed',
        reference_id: 'TXN12345',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockPayment],
      });

      const result = await updatePaymentStatus(testPaymentId, testAgencyId, 'failed');

      expect(result?.status).toBe('failed');
    });
  });

  describe('Payment Amount Handling', () => {
    it('should handle decimal amounts correctly', async () => {
      const mockPayment: Payment = {
        id: testPaymentId,
        invoice_id: testInvoiceId,
        agency_id: testAgencyId,
        amount: '5000.50',
        provider: 'bank_transfer',
        status: 'pending',
        reference_id: 'TXN12345',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockPayment],
      });

      const result = await createPayment(testInvoiceId, testAgencyId, {
        amount: 5000.5,
        referenceId: 'TXN12345',
      });

      expect(result.amount).toBe('5000.50');
    });
  });
});
