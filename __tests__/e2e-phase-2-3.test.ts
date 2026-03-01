jest.mock('@/lib/db');

import {
  createDeliverable,
  updateDeliverableStatus,
  createPaymentTransaction,
  updatePaymentTransactionStatus,
  getInvoiceById,
} from '@/lib/db-queries';
import { db } from '@/lib/db';

describe('Phase 2 & 3 E2E Workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Deliverable Approval Workflow', () => {
    it('transitions deliverable through draft → in_review → approved', async () => {
      const testAgencyId = 'test-agency';
      const testClientId = 'test-client';
      const testPlanId = 'test-plan';

      // Step 1: Create deliverable (starts in draft)
      const mockDeliverable = {
        id: 'del-1',
        agency_id: testAgencyId,
        client_id: testClientId,
        plan_id: testPlanId,
        title: 'Video 1 of 4',
        description: 'Monthly video',
        status: 'draft',
        month_year: '2026-03',
        due_date: new Date('2026-03-31'),
        created_at: new Date(),
        updated_at: new Date(),
      };

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockDeliverable] });

      const created = await createDeliverable({
        agencyId: testAgencyId,
        clientId: testClientId,
        planId: testPlanId,
        title: 'Video 1 of 4',
        description: 'Monthly video',
        monthYear: '2026-03',
        dueDate: new Date('2026-03-31'),
      });

      expect(created.status).toBe('draft');

      // Step 2: Move to in_review
      const inReviewMock = { ...mockDeliverable, status: 'in_review' };
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [inReviewMock] });

      const inReview = await updateDeliverableStatus(created.id, testAgencyId, 'in_review');
      expect(inReview.status).toBe('in_review');

      // Step 3: Move to approved
      const approvedMock = { ...mockDeliverable, status: 'approved' };
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [approvedMock] });

      const approved = await updateDeliverableStatus(created.id, testAgencyId, 'approved');
      expect(approved.status).toBe('approved');
    });
  });

  describe('Multi-Provider Payment Processing', () => {
    it('creates and completes payments via multiple providers', async () => {
      const testAgencyId = 'test-agency';
      const testInvoiceId = 'test-invoice';

      // Step 1: Create payment via FonePay
      const fonePayMock = {
        id: 'txn-fonepay-1',
        invoice_id: testInvoiceId,
        agency_id: testAgencyId,
        provider_id: 'fonepay',
        amount: 5000,
        currency: 'NPR',
        status: 'pending',
        transaction_id: 'FONEPAY-123',
        reference_id: null,
        webhook_payload: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [fonePayMock] });

      const fonePayTxn = await createPaymentTransaction({
        invoiceId: testInvoiceId,
        agencyId: testAgencyId,
        providerId: 'fonepay',
        amount: 5000,
        currency: 'NPR',
        transactionId: 'FONEPAY-123',
      });

      expect(fonePayTxn.status).toBe('pending');
      expect(fonePayTxn.provider_id).toBe('fonepay');

      // Step 2: Mark FonePay payment as completed
      const fonePayCompleted = { ...fonePayMock, status: 'completed' };
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [fonePayCompleted] });

      const completedFonePay = await updatePaymentTransactionStatus(
        fonePayTxn.id,
        testAgencyId,
        'completed'
      );
      expect(completedFonePay.status).toBe('completed');

      // Step 3: Create payment via Stripe
      const stripeMock = {
        id: 'txn-stripe-1',
        invoice_id: testInvoiceId,
        agency_id: testAgencyId,
        provider_id: 'stripe',
        amount: 2500,
        currency: 'NPR',
        status: 'pending',
        transaction_id: 'STRIPE-456',
        reference_id: null,
        webhook_payload: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [stripeMock] });

      const stripeTxn = await createPaymentTransaction({
        invoiceId: testInvoiceId,
        agencyId: testAgencyId,
        providerId: 'stripe',
        amount: 2500,
        currency: 'NPR',
        transactionId: 'STRIPE-456',
      });

      expect(stripeTxn.status).toBe('pending');
      expect(stripeTxn.provider_id).toBe('stripe');

      // Step 4: Mark Stripe payment as completed
      const stripeCompleted = { ...stripeMock, status: 'completed' };
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [stripeCompleted] });

      const completedStripe = await updatePaymentTransactionStatus(
        stripeTxn.id,
        testAgencyId,
        'completed'
      );
      expect(completedStripe.status).toBe('completed');

      // Verify both payments are complete
      expect(completedFonePay.status).toBe('completed');
      expect(completedStripe.status).toBe('completed');
      expect(fonePayTxn.amount).toBe(5000);
      expect(stripeTxn.amount).toBe(2500);
    });
  });
});
