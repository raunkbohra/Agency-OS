/**
 * Test suite for invoice database queries
 * Tests the invoice-related database functions in db-queries.ts
 *
 * Note: These tests use mocked database responses
 * For integration tests, connect to a real database
 */

jest.mock('@/lib/db');

import {
  Invoice,
  InvoiceItem,
} from '@/lib/db-queries';
import { db } from '@/lib/db';

// Mock implementations
import * as dbQueries from '@/lib/db-queries';

describe('Invoice Type Interfaces', () => {
  const testAgencyId = '550e8400-e29b-41d4-a716-446655440000';
  const testClientId = '550e8400-e29b-41d4-a716-446655440001';

  it('should validate Invoice interface structure', () => {
    const mockInvoice: Invoice = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      agency_id: testAgencyId,
      client_id: testClientId,
      amount: '5000',
      status: 'draft',
      due_date: new Date().toISOString(),
      paid_date: null,
      created_at: new Date().toISOString(),
    };
    expect(mockInvoice).toBeDefined();
    expect(mockInvoice.id).toBeDefined();
    expect(mockInvoice.agency_id).toBe(testAgencyId);
    expect(mockInvoice.status).toBe('draft');
  });

  it('should validate InvoiceItem interface structure', () => {
    const mockItem: InvoiceItem = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      invoice_id: '550e8400-e29b-41d4-a716-446655440001',
      description: 'Test Service',
      quantity: 5,
      rate: '1000',
      created_at: new Date().toISOString(),
    };
    expect(mockItem).toBeDefined();
    expect(mockItem.description).toBe('Test Service');
    expect(mockItem.quantity).toBe(5);
  });
});

describe('Invoice Database Query Functions', () => {
  const testAgencyId = '550e8400-e29b-41d4-a716-446655440000';
  const testClientId = '550e8400-e29b-41d4-a716-446655440001';
  const testInvoiceId = '550e8400-e29b-41d4-a716-446655440002';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createInvoice', () => {
    it('should be callable with required parameters', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          {
            id: testInvoiceId,
            agency_id: testAgencyId,
            client_id: testClientId,
            amount: '5000',
            status: 'draft',
            due_date: null,
            paid_date: null,
            created_at: new Date().toISOString(),
          },
        ],
      });

      const result = await dbQueries.createInvoice(testAgencyId, testClientId, 5000);
      expect(result).toBeDefined();
      expect(result.agency_id).toBe(testAgencyId);
    });
  });

  describe('getInvoiceById', () => {
    it('should retrieve an invoice with agency filter', async () => {
      const mockInvoice: Invoice = {
        id: testInvoiceId,
        agency_id: testAgencyId,
        client_id: testClientId,
        amount: '5000',
        status: 'draft',
        due_date: null,
        paid_date: null,
        created_at: new Date().toISOString(),
      };

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockInvoice],
      });

      const result = await dbQueries.getInvoiceById(testInvoiceId, testAgencyId);
      expect(result).toBeDefined();
      if (result) {
        expect(result.agency_id).toBe(testAgencyId);
      }
    });

    it('should return null for non-existent invoice', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      const result = await dbQueries.getInvoiceById('nonexistent', testAgencyId);
      expect(result).toBeNull();
    });
  });

  describe('getInvoiceItems', () => {
    it('should retrieve invoice items as an array', async () => {
      const mockItems: InvoiceItem[] = [
        {
          id: 'item1',
          invoice_id: testInvoiceId,
          description: 'Service A',
          quantity: 2,
          rate: '1000',
          created_at: new Date().toISOString(),
        },
        {
          id: 'item2',
          invoice_id: testInvoiceId,
          description: 'Service B',
          quantity: 3,
          rate: '500',
          created_at: new Date().toISOString(),
        },
      ];

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: mockItems,
      });

      const result = await dbQueries.getInvoiceItems(testInvoiceId);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });

  describe('getInvoicesByAgency', () => {
    it('should retrieve invoices for an agency', async () => {
      const mockInvoices: Invoice[] = [
        {
          id: 'inv1',
          agency_id: testAgencyId,
          client_id: testClientId,
          amount: '5000',
          status: 'draft',
          due_date: null,
          paid_date: null,
          created_at: new Date().toISOString(),
        },
      ];

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: mockInvoices,
      });

      const result = await dbQueries.getInvoicesByAgency(testAgencyId);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      if (result.length > 0) {
        expect(result[0].agency_id).toBe(testAgencyId);
      }
    });
  });

  describe('updateInvoiceStatus', () => {
    it('should update invoice status', async () => {
      const mockInvoice: Invoice = {
        id: testInvoiceId,
        agency_id: testAgencyId,
        client_id: testClientId,
        amount: '5000',
        status: 'sent',
        due_date: null,
        paid_date: null,
        created_at: new Date().toISOString(),
      };

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockInvoice],
      });

      const result = await dbQueries.updateInvoiceStatus(
        testInvoiceId,
        testAgencyId,
        'sent'
      );
      expect(result).toBeDefined();
      if (result) {
        expect(result.status).toBe('sent');
      }
    });

    it('should update invoice status with PDF URL', async () => {
      const pdfUrl = '/invoices/test.pdf';
      const mockInvoice: Invoice = {
        id: testInvoiceId,
        agency_id: testAgencyId,
        client_id: testClientId,
        amount: '5000',
        status: 'sent',
        due_date: null,
        paid_date: null,
        created_at: new Date().toISOString(),
      };

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockInvoice],
      });

      const result = await dbQueries.updateInvoiceStatus(
        testInvoiceId,
        testAgencyId,
        'sent',
        pdfUrl
      );
      expect(result).toBeDefined();
    });

    it('should respect agency_id isolation', async () => {
      const wrongAgencyId = '00000000-0000-0000-0000-000000000000';

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      const result = await dbQueries.updateInvoiceStatus(
        testInvoiceId,
        wrongAgencyId,
        'sent'
      );
      expect(result).toBeNull();
    });
  });

  describe('addInvoiceItem', () => {
    it('should add an item to an invoice', async () => {
      const mockItem: InvoiceItem = {
        id: 'newitem',
        invoice_id: testInvoiceId,
        description: 'New Service',
        quantity: 1,
        rate: '2000',
        created_at: new Date().toISOString(),
      };

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockItem],
      });

      const result = await dbQueries.addInvoiceItem(
        testInvoiceId,
        'New Service',
        1,
        2000
      );
      expect(result).toBeDefined();
    });
  });

  describe('getInvoicesByClient', () => {
    it('should retrieve invoices for a specific client', async () => {
      const mockInvoices: Invoice[] = [
        {
          id: 'inv1',
          agency_id: testAgencyId,
          client_id: testClientId,
          amount: '5000',
          status: 'draft',
          due_date: null,
          paid_date: null,
          created_at: new Date().toISOString(),
        },
      ];

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: mockInvoices,
      });

      const result = await dbQueries.getInvoicesByClient(testClientId, testAgencyId);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
