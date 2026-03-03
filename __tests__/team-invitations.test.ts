jest.mock('@/lib/db');

import {
  createAgencyInvite,
  getAgencyInviteByToken,
  acceptAgencyInvite,
  assignUserRole,
  getUserRolesInAgency,
  updateUserRoles,
  getAgencyTeamMembers,
  removeUserFromAgency,
  canUserEditDeliverable,
} from '@/lib/db-queries';
import { db } from '@/lib/db';

describe('Team Invitations Feature', () => {
  const testAgencyId = 'test-agency-id';
  const testUserId = 'test-user-id';
  const inviteToken = 'test-invite-token-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Invite Creation and Acceptance', () => {
    it('should create an agency invite with roles', async () => {
      const email = 'test-designer@example.com';
      const roles = ['Designer'];

      const mockInvite = {
        id: 'invite-1',
        agency_id: testAgencyId,
        email,
        roles,
        token: inviteToken,
        accepted: false,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        created_at: new Date(),
      };

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockInvite] });

      const result = await createAgencyInvite(testAgencyId, email, roles, inviteToken);

      expect(result.email).toBe(email);
      expect(result.roles).toContain('Designer');
      expect(result.accepted).toBe(false);
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO agency_invites'),
        [testAgencyId, email, roles, inviteToken]
      );
    });

    it('should retrieve an invite by valid token', async () => {
      const mockInvite = {
        id: 'invite-1',
        agency_id: testAgencyId,
        email: 'designer@example.com',
        roles: ['Designer'],
        token: inviteToken,
        accepted: false,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockInvite] });

      const result = await getAgencyInviteByToken(inviteToken);

      expect(result).not.toBeNull();
      expect(result?.token).toBe(inviteToken);
      expect(result?.accepted).toBe(false);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM agency_invites'),
        [inviteToken]
      );
    });

    it('should not retrieve an invite with invalid or expired token', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await getAgencyInviteByToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should accept an invite and mark as accepted', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [{ success: true }] });

      await acceptAgencyInvite(inviteToken, testUserId);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE agency_invites'),
        [inviteToken, testUserId]
      );
    });
  });

  describe('Role Management', () => {
    it('should assign a role to a user', async () => {
      const role = 'Developer';

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await assignUserRole(testUserId, testAgencyId, role);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_roles'),
        [testUserId, testAgencyId, role]
      );
    });

    it('should retrieve user roles in an agency', async () => {
      const mockRoles = [{ role: 'Designer' }, { role: 'Manager' }];

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: mockRoles });

      const result = await getUserRolesInAgency(testUserId, testAgencyId);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(['Designer', 'Manager']);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT role FROM user_roles'),
        [testUserId, testAgencyId]
      );
    });

    it('should return empty array when user has no roles', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await getUserRolesInAgency(testUserId, testAgencyId);

      expect(result).toEqual([]);
    });

    it('should update user roles', async () => {
      const newRoles = ['Designer', 'Project Manager'];

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ success: true }] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // DELETE
        .mockResolvedValueOnce({ rows: [] }) // INSERT 1
        .mockResolvedValueOnce({ rows: [] }) // INSERT 2
        .mockResolvedValueOnce({ rows: [{ success: true }] }); // COMMIT

      await updateUserRoles(testUserId, testAgencyId, newRoles);

      expect(db.query).toHaveBeenCalledTimes(5);
      expect(db.query).toHaveBeenCalledWith('BEGIN');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM user_roles'),
        [testUserId, testAgencyId]
      );
      expect(db.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should remove user from agency', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await removeUserFromAgency(testUserId, testAgencyId);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM user_roles'),
        [testUserId, testAgencyId]
      );
    });
  });

  describe('Team Member Retrieval', () => {
    it('should retrieve all team members with roles', async () => {
      const mockTeamMembers = [
        {
          id: 'user-1',
          name: 'John Designer',
          email: 'john@example.com',
          roles: ['Designer'],
          joinedAt: new Date(),
          isOwner: true,
        },
        {
          id: 'user-2',
          name: 'Jane Developer',
          email: 'jane@example.com',
          roles: ['Developer'],
          joinedAt: new Date(),
          isOwner: false,
        },
      ];

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: mockTeamMembers });

      const result = await getAgencyTeamMembers(testAgencyId);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0].isOwner).toBe(true);
      expect(result[1].roles).toContain('Developer');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [testAgencyId]
      );
    });

    it('should return empty array when no team members exist', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await getAgencyTeamMembers(testAgencyId);

      expect(result).toEqual([]);
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow edit if user has matching role', async () => {
      const deliverableId = 'test-deliverable-123';

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ required_roles: ['Designer'] }],
      });

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ role: 'Designer' }, { role: 'Manager' }],
      });

      const result = await canUserEditDeliverable(testUserId, deliverableId, testAgencyId);

      expect(result).toBe(true);
    });

    it('should deny edit if user lacks required role', async () => {
      const deliverableId = 'test-deliverable-designer-only';

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ required_roles: ['Designer'] }],
      });

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ role: 'Developer' }],
      });

      const result = await canUserEditDeliverable(testUserId, deliverableId, testAgencyId);

      expect(result).toBe(false);
    });

    it('should allow edit if no roles required', async () => {
      const deliverableId = 'test-deliverable-no-role';

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ required_roles: [] }],
      });

      const result = await canUserEditDeliverable(testUserId, deliverableId, testAgencyId);

      expect(result).toBe(true);
    });

    it('should deny edit if deliverable not found', async () => {
      const deliverableId = 'nonexistent-deliverable';

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await canUserEditDeliverable(testUserId, deliverableId, testAgencyId);

      expect(result).toBe(false);
    });

    it('should handle multiple required roles', async () => {
      const deliverableId = 'test-deliverable-multi-role';

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ required_roles: ['Designer', 'Manager', 'Developer'] }],
      });

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ role: 'Manager' }],
      });

      const result = await canUserEditDeliverable(testUserId, deliverableId, testAgencyId);

      expect(result).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully on invite creation', async () => {
      const dbError = new Error('Database connection failed');
      (db.query as jest.Mock).mockRejectedValueOnce(dbError);

      await expect(
        createAgencyInvite(testAgencyId, 'test@example.com', ['Designer'], inviteToken)
      ).rejects.toThrow('Failed to create agency invite');
    });

    it('should handle database errors gracefully on role assignment', async () => {
      const dbError = new Error('Database connection failed');
      (db.query as jest.Mock).mockRejectedValueOnce(dbError);

      await expect(
        assignUserRole(testUserId, testAgencyId, 'Designer')
      ).rejects.toThrow('Failed to assign user role');
    });

    it('should handle database errors gracefully on team member retrieval', async () => {
      const dbError = new Error('Database connection failed');
      (db.query as jest.Mock).mockRejectedValueOnce(dbError);

      await expect(getAgencyTeamMembers(testAgencyId)).rejects.toThrow(
        'Failed to get team members'
      );
    });

    it('should return false on permission check if database error occurs', async () => {
      const dbError = new Error('Database connection failed');
      (db.query as jest.Mock).mockRejectedValueOnce(dbError);

      const result = await canUserEditDeliverable('user-id', 'deliv-id', testAgencyId);

      expect(result).toBe(false);
    });
  });
});
