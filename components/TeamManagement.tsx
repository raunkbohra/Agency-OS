'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Check, AlertCircle } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  roles: string[];
  joinedAt: string;
  isOwner: boolean;
}

const AVAILABLE_ROLES = ['Designer', 'Developer', 'Project Manager', 'Account Manager'];

export default function TeamManagement() {
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoles, setInviteRoles] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);

  // Edit modal state
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editRoles, setEditRoles] = useState<string[]>([]);

  // Fetch team members on mount
  useEffect(() => {
    fetchTeamMembers();
  }, []);

  async function fetchTeamMembers() {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/team/members');

      if (!res.ok) {
        throw new Error('Failed to fetch team members');
      }

      const data = await res.json();
      setMembers(data.members || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();

    if (!inviteEmail || inviteRoles.length === 0) {
      setError('Email and at least one role are required');
      return;
    }

    try {
      setInviting(true);
      setError(null);

      const res = await fetch('/api/dashboard/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          roles: inviteRoles,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to send invite');
      }

      setSuccess(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteRoles([]);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  }

  async function handleUpdateRoles(memberId: string, newRoles: string[]) {
    if (newRoles.length === 0) {
      setError('At least one role is required');
      return;
    }

    try {
      setError(null);
      const res = await fetch(`/api/dashboard/team/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: newRoles }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update roles');
      }

      // Update member in local state
      setMembers(members.map(m =>
        m.id === memberId ? { ...m, roles: newRoles } : m
      ));

      setSuccess('Roles updated successfully');
      setEditingMemberId(null);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update roles');
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm('Are you sure you want to remove this team member?')) {
      return;
    }

    try {
      setError(null);
      const res = await fetch(`/api/dashboard/team/${memberId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to remove member');
      }

      setMembers(members.filter(m => m.id !== memberId));
      setSuccess('Team member removed');

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  }

  function toggleRole(role: string, currentRoles: string[]) {
    const updated = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];
    return updated;
  }

  function toggleInviteRole(role: string) {
    setInviteRoles(toggleRole(role, inviteRoles));
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 rounded-lg bg-bg-tertiary" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-900">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Invite Form */}
      <div className="bg-bg-secondary border border-border-default rounded-xl p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Invite Team Member</h2>

        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="member@example.com"
              disabled={inviting}
              className="w-full border border-border-default rounded-lg px-3 py-2 text-sm bg-bg-primary text-text-primary focus:border-border-active focus:outline-none disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-3">
              Roles (select at least one)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {AVAILABLE_ROLES.map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleInviteRole(role)}
                  disabled={inviting}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 capitalize ${
                    inviteRoles.includes(role)
                      ? 'bg-accent-blue text-white'
                      : 'border border-border-default text-text-primary hover:bg-bg-hover'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={inviting || !inviteEmail || inviteRoles.length === 0}
            className="w-full bg-accent-blue text-white font-medium py-2 rounded-lg hover:bg-accent-blue/90 disabled:opacity-50 transition-colors"
          >
            {inviting ? 'Sending Invite...' : 'Send Invite'}
          </button>
        </form>
      </div>

      {/* Team Members List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">Team Members ({members.length})</h2>

        {members.length === 0 ? (
          <div className="bg-bg-secondary border border-border-default rounded-xl p-8 text-center">
            <p className="text-text-secondary">No team members yet</p>
          </div>
        ) : (
          members.map(member => (
            <div
              key={member.id}
              className="bg-bg-secondary border border-border-default rounded-xl p-4 sm:p-5"
            >
              {editingMemberId === member.id ? (
                // Edit mode
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-text-primary mb-3">
                      Update Roles for {member.name}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {AVAILABLE_ROLES.map(role => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setEditRoles(toggleRole(role, editRoles))}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                            editRoles.includes(role)
                              ? 'bg-accent-blue text-white'
                              : 'border border-border-default text-text-primary hover:bg-bg-hover'
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleUpdateRoles(member.id, editRoles)}
                      className="px-4 py-2 bg-accent-blue text-white text-sm rounded-lg font-medium hover:bg-accent-blue/90 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingMemberId(null)}
                      className="px-4 py-2 border border-border-default text-text-primary text-sm rounded-lg font-medium hover:bg-bg-hover transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-text-primary truncate">
                        {member.name}
                      </h3>
                      {member.isOwner && (
                        <span className="px-2 py-0.5 bg-accent-blue/10 text-accent-blue text-xs font-semibold rounded">
                          Owner
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-tertiary mb-3 truncate">{member.email}</p>
                    <div className="flex flex-wrap gap-2">
                      {member.roles.map(role => (
                        <span
                          key={role}
                          className="px-2 py-1 bg-bg-tertiary border border-border-default text-xs text-text-secondary rounded capitalize"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-text-tertiary mt-2">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {!member.isOwner && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditingMemberId(member.id);
                          setEditRoles(member.roles);
                        }}
                        className="p-2 text-text-secondary hover:bg-bg-hover rounded-lg transition-colors"
                        title="Edit roles"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleRemove(member.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove member"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
