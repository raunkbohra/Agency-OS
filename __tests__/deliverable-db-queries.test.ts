jest.mock('@/lib/db');

import {
  createDeliverable,
  getDeliverablesByClient,
  getDeliverablesByAgency,
  getDeliverableById,
  updateDeliverableStatus,
  addDeliverableFile,
  getDeliverableFiles,
  addDeliverableComment,
  getDeliverableComments,
} from '@/lib/db-queries';
import { db } from '@/lib/db';

describe('Deliverable DB Queries', () => {
  const testAgencyId = 'test-agency-id';
  const testClientId = 'test-client-id';
  const testPlanId = 'test-plan-id';
  const testDeliverableId = 'test-deliverable-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDeliverable', () => {
    it('creates deliverable with draft status', async () => {
      const mockDeliverable = {
        id: testDeliverableId,
        agency_id: testAgencyId,
        client_id: testClientId,
        plan_id: testPlanId,
        title: 'Video 1 of 4',
        description: 'Monthly video',
        status: 'draft',
        month_year: '2026-03',
        due_date: new Date('2026-03-15'),
        created_at: new Date(),
        updated_at: new Date(),
      };

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockDeliverable] });

      const result = await createDeliverable({
        agencyId: testAgencyId,
        clientId: testClientId,
        planId: testPlanId,
        title: 'Video 1 of 4',
        description: 'Monthly video',
        monthYear: '2026-03',
        dueDate: new Date('2026-03-15'),
      });

      expect(result.status).toBe('draft');
      expect(result.title).toBe('Video 1 of 4');
      expect(db.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDeliverablesByClient', () => {
    it('returns all client deliverables', async () => {
      const mockDeliverables = [
        { id: 'del-1', title: 'Video 1', status: 'draft', month_year: '2026-03', due_date: null },
        { id: 'del-2', title: 'Video 2', status: 'in_review', month_year: '2026-03', due_date: null },
      ];

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: mockDeliverables });

      const results = await getDeliverablesByClient(testClientId);

      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(2);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('client_id'),
        [testClientId]
      );
    });
  });

  describe('getDeliverablesByAgency', () => {
    it('returns all agency deliverables with client name', async () => {
      const mockDeliverables = [
        { id: 'del-1', agency_id: testAgencyId, client_name: 'Test Corp', title: 'Video 1', status: 'draft' },
      ];

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: mockDeliverables });

      const results = await getDeliverablesByAgency(testAgencyId);

      expect(Array.isArray(results)).toBe(true);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('agency_id'),
        [testAgencyId]
      );
    });
  });

  describe('getDeliverableById', () => {
    it('returns deliverable when found', async () => {
      const mockDeliverable = { id: testDeliverableId, agency_id: testAgencyId };

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockDeliverable] });

      const result = await getDeliverableById(testDeliverableId, testAgencyId);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(testDeliverableId);
    });

    it('returns null when not found', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await getDeliverableById('nonexistent', testAgencyId);

      expect(result).toBeNull();
    });
  });

  describe('updateDeliverableStatus', () => {
    it('transitions status correctly', async () => {
      const mockUpdated = { id: testDeliverableId, agency_id: testAgencyId, status: 'in_review' };

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUpdated] });

      const result = await updateDeliverableStatus(testDeliverableId, testAgencyId, 'in_review');

      expect(result.status).toBe('in_review');
    });
  });

  describe('addDeliverableFile', () => {
    it('stores file metadata', async () => {
      const mockFile = {
        id: 'file-id',
        deliverable_id: testDeliverableId,
        file_name: 'design.pdf',
        file_size: 2048,
        file_type: 'application/pdf',
        file_url: 's3://bucket/design.pdf',
        uploaded_by: 'user-id',
        version: 1,
        created_at: new Date(),
      };

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockFile] });

      const result = await addDeliverableFile({
        deliverableId: testDeliverableId,
        fileName: 'design.pdf',
        fileSize: 2048,
        fileType: 'application/pdf',
        fileUrl: 's3://bucket/design.pdf',
        uploadedBy: 'user-id',
      });

      expect(result.file_name).toBe('design.pdf');
    });
  });

  describe('getDeliverableFiles', () => {
    it('returns files for deliverable', async () => {
      const mockFiles = [{ id: 'file-1', deliverable_id: testDeliverableId, file_name: 'doc.pdf' }];

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: mockFiles });

      const results = await getDeliverableFiles(testDeliverableId);

      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(1);
    });
  });

  describe('addDeliverableComment', () => {
    it('creates comment with revision request flag', async () => {
      const mockComment = {
        id: 'comment-id',
        deliverable_id: testDeliverableId,
        user_id: 'user-id',
        comment: 'Please revise colors',
        is_revision_request: true,
        created_at: new Date(),
      };

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockComment] });

      const result = await addDeliverableComment({
        deliverableId: testDeliverableId,
        userId: 'user-id',
        comment: 'Please revise colors',
        isRevisionRequest: true,
      });

      expect(result.is_revision_request).toBe(true);
    });
  });

  describe('getDeliverableComments', () => {
    it('returns comments for deliverable', async () => {
      const mockComments = [{ id: 'c-1', deliverable_id: testDeliverableId, comment: 'Looks good' }];

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: mockComments });

      const results = await getDeliverableComments(testDeliverableId);

      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(1);
    });
  });
});
